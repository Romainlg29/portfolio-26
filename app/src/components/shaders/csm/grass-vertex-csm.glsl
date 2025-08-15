uniform float uTime;

// Uniforms for wind and noise
uniform float uNoiseScale;
uniform float uWindStrength;

// If the vertex should be displaced or not based on distance
uniform float uMaxDisplacementDistance;

// Maximum distance from the camera to show the grass
uniform float uMaxDistance;

// Varying variables to pass data to the fragment shader
varying vec2 vUv;
varying float vNoise;
varying float vDiscard;

// Simplex noise implementation
vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
    return mod289(((x*34.0)+1.0)*x);
}

float simplexNoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                        -0.577350269189626, // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0

    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);

    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                     + i.x + vec3(0.0, i1.x, 1.0 ));

    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// Frustum culling function using projection and modelView matrices
bool isInsideFrustum(vec4 clipSpacePos) {
    // After perspective division, check if the position is within NDC bounds
    vec3 ndc = clipSpacePos.xyz / clipSpacePos.w;

    // Add margin to prevent grass from popping at frustum edges
    float margin = 0.2; // Adjust this value to increase/decrease margin
    float minBound = -1.0 - margin;
    float maxBound = 1.0 + margin;

    // Check if within expanded normalized device coordinates
    return (ndc.x >= minBound && ndc.x <= maxBound &&
            ndc.y >= minBound && ndc.y <= maxBound &&
            ndc.z >= -1.0 && ndc.z <= 1.0); // Keep Z bounds strict for near/far planes
}

void main() {
    vUv = uv;

    // Convert the position to world space
    vec4 worldPos = instanceMatrix * vec4(position, 1.0);

    // Transform to clip space for frustum culling
    vec4 clipSpacePos = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);

    // Frustum culling - cull if outside view frustum (with margin)
    if (!isInsideFrustum(clipSpacePos)) {
        csm_PositionRaw = vec4(-999999.0);
        vDiscard = 1.0;
        return;
    }

    // Compute the distance from the camera to this grass instance
    vec3 cameraPos = (inverse(viewMatrix) * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    float distanceToCamera = distance(cameraPos, worldPos.xyz);

    // Create a transition zone for fading
    // Fade out over the last 20% of the maximum distance
    float fadeStart = uMaxDistance * 0.8;
    float fadeEnd = uMaxDistance;
    float fadeFactor = 1. - smoothstep(fadeStart, fadeEnd, distanceToCamera);

    // Discard vertices that are too far from the camera
    if (distanceToCamera > uMaxDistance) {
        csm_PositionRaw = vec4(-999999.0);
        vDiscard = 1.0;
        return;
    }

    // Create island pattern using multiple octaves of noise
    vec2 noiseCoord1 = worldPos.xz * uNoiseScale;
    vec2 noiseCoord2 = worldPos.xz * uNoiseScale * 2.0;
    vec2 noiseCoord3 = worldPos.xz * uNoiseScale * 4.0;

    // Sample noise at different scales for island effect
    float noise1 = simplexNoise(noiseCoord1 + uTime * 0.1);
    float noise2 = simplexNoise(noiseCoord2 + uTime * 0.15) * 0.5;
    float noise3 = simplexNoise(noiseCoord3 + uTime * 0.2) * 0.25;

    // Combine noises to create island pattern
    float combinedNoise = noise1 + noise2 + noise3;
    vNoise = combinedNoise;

    // Store the default position
    vec3 bendPosition = position;

    if (distanceToCamera <= uMaxDisplacementDistance) {
        // Compute the wind displacement based on the Y position
        float windEffect = uWindStrength * position.y * position.y;

        // Add variation to the position based on noise
        windEffect *= (0.7 + 0.3 * combinedNoise);

        // Add sine wave animation for bending
        float swayPhase = uTime * 2. + worldPos.x * 0.1 + worldPos.z * 0.05;
        float sway = sin(swayPhase) * 0.5 + 0.5; // Normalize to [0, 1]

        bendPosition.x += windEffect * sway * 0.4;
        bendPosition.z += windEffect * sway * 0.2 * sin(swayPhase * 1.3); // Add some variation in Z
    }

    // Apply the fade factor if needed
    bendPosition.y *= fadeFactor;

    // Set the final position for the vertex shader
    vec4 bentWorldPos = instanceMatrix * vec4(bendPosition, 1.0);
    vec4 bentClipSpacePos = projectionMatrix * modelViewMatrix * bentWorldPos;
    csm_PositionRaw = bentClipSpacePos;
}