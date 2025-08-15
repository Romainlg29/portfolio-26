varying vec2 vUv;
varying float vNoise;
varying float vDiscard;

uniform vec3 uBaseColor;
uniform vec3 uTipColor;
uniform vec3 uWindTipColor;

void main() {
    if (vDiscard > 0.0) discard;

    // Create a color blending factor based on the noise
    float noiseInfluence = vNoise * 0.3 + 0.7;

    // Choose tip color based on noise (wind areas vs calm areas)
    float colorTransition = smoothstep(0.2, 0.6, vNoise);
    vec3 finalTipColor = mix(uTipColor, uWindTipColor, colorTransition);

    // Blend between base and tip color based on Y coordinate, influenced by noise
    vec3 color = mix(finalTipColor, uBaseColor, vUv.y * noiseInfluence);

    // Add subtle color variation based on noise
    color = mix(color, color * 1.1, vNoise * 0.2);

    csm_DiffuseColor = vec4(color, 1.0);
}

