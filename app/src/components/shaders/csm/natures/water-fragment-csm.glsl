uniform float uTime;

uniform vec3 uFoamColor;
uniform vec3 uWaterColor;
uniform float uWaveHeight;

varying vec2 vUv;
varying vec3 vCSMPosition;
varying float vNoise;

void main() {
    // Normalize the Z position between 0 and 1
    float z = clamp(vCSMPosition.z, .0, uWaveHeight);

    // Mix the foam and water colors based on the Z position
    vec3 color = mix(uFoamColor, uWaterColor, z);

    // Interpolate the opacity based on the Z position
    float opacity = 1. - smoothstep(uWaveHeight, 0.0, z);

    csm_DiffuseColor = vec4(color, opacity + .9);

    // Boost the emissive color based on the wave height
    csm_Emissive = uFoamColor * z * 10.;
}