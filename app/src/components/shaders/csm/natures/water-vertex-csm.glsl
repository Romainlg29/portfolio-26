uniform float uTime;

uniform float uWaveAngle; // Angle in radians for wave direction
uniform float uWaveSpeed;
uniform float uWaveHeight;
uniform float uWaveFrequency;

varying vec2 vUv;
varying vec3 vCSMPosition;

// Improved simplex noise implementation for smoother transitions
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

// Smoother FBM with better interpolation
float fbm(vec2 st, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    float maxValue = 0.0;  // Used for normalizing result to [-1,1]

    for (int i = 0; i < octaves; i++) {
        value += amplitude * simplexNoise(st * frequency);
        maxValue += amplitude;

        st *= 2.0;
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    return value / maxValue;
}

void main() {
    vUv = uv;

    vec3 pos = position;

    // Calculate direction vector from angle
    vec2 direction = vec2(cos(uWaveAngle), sin(uWaveAngle));

    // Smoother time progression
    float time = uTime * uWaveSpeed;

    // Base sine wave for smooth motion
    float baseWave = sin(dot(uv, direction) * uWaveFrequency + time);

    // Primary large waves using FBM modulated by sine wave
    vec2 coord1 = uv * uWaveFrequency + direction * time;
    float primaryNoise = fbm(coord1, 4);
    float primaryWaves = (baseWave * 0.7 + primaryNoise * 0.3) * 0.6;

    // Secondary medium waves with different direction and sine modulation
    vec2 perpDirection = vec2(-direction.y, direction.x);
    float secondarySine = sin(dot(uv, perpDirection) * uWaveFrequency * 1.8 + time * 1.3);
    vec2 coord2 = uv * uWaveFrequency * 1.8 + perpDirection * time * 0.8;
    float secondaryNoise = fbm(coord2, 3);
    float secondaryWaves = (secondarySine * 0.6 + secondaryNoise * 0.4) * 0.35;

    // Tertiary small ripples with sine smoothing
    float rippleSine = sin(dot(uv, direction) * uWaveFrequency * 4.5 + time * 2.0);
    vec2 coord3 = uv * uWaveFrequency * 4.5 + direction * time * 1.2;
    float rippleNoise = simplexNoise(coord3);
    float ripples = (rippleSine * 0.8 + rippleNoise * 0.2) * 0.12;

    // Slow moving large swells with sine base
    float swellSine = sin(dot(uv, direction) * uWaveFrequency * 0.4 + time * 0.3);
    vec2 coord4 = uv * uWaveFrequency * 0.4 + direction * time * 0.3;
    float swellNoise = fbm(coord4, 2);
    float swells = (swellSine * 0.8 + swellNoise * 0.2) * 0.45;

    // Cross-directional waves with sine smoothing
    vec2 diagonalDir = normalize(direction + perpDirection * 0.6);
    float crossSine = sin(dot(uv, diagonalDir) * uWaveFrequency * 2.2 + time * 0.9);
    vec2 coord5 = uv * uWaveFrequency * 2.2 + diagonalDir * time * 0.9;
    float crossNoise = simplexNoise(coord5);
    float crossWaves = (crossSine * 0.7 + crossNoise * 0.3) * 0.2;

    // Combine all wave layers
    float combinedWaves = primaryWaves + secondaryWaves + ripples + swells + crossWaves;

    // Apply wave height with smooth scaling
    float finalHeight = combinedWaves * uWaveHeight;

    // Add some foam-like peaks using sine-smoothed noise
    float foamSine = sin(abs(combinedWaves) * 3.14159);
    float foam = smoothstep(0.4, 0.8, foamSine) * 0.15;
    finalHeight += foam * uWaveHeight;

    // Apply to Z position
    pos.z += finalHeight;

    // Set CSM position
    csm_Position = pos;

    // Pass the transformed position to fragment shader
    vCSMPosition = csm_Position;
}
