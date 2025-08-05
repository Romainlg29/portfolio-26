// #include <fog_pars_vertex>

varying vec2 vUv;
varying float vNoise;
varying vec3 vNormal;
varying vec3 vWorldPosition;

uniform float uTime;

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

void main() {
    vUv = uv;

    float windStrength = 5.;
    float uNoiseScale = 0.1; // Reduced scale for larger islands

    // Get world position for consistent island pattern
    vec4 worldPos = instanceMatrix * vec4(position, 1.0);

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

    // Calculate wind displacement based on Y position (remove island mask)
    float windEffect = windStrength * position.y * position.y;

    // Optional: Add subtle variation using noise instead of masking
    windEffect *= (0.7 + 0.3 * combinedNoise); // Varies between 70-100% intensity

    // Apply wind bending (mainly in X direction)
    vec3 bendPosition = position;
    bendPosition.x += windEffect * 0.4;
    bendPosition.z += windEffect * 0.2;

    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(bendPosition, 1.0);

    vNormal = normalMatrix * normal;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

    // #include <fog_vertex>
}