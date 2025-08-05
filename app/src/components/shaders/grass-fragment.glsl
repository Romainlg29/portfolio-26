precision highp float;

// #include <fog_pars_fragment>

varying vec2 vUv;
varying float vNoise;
varying vec3 vNormal;
varying vec3 vWorldPosition;

uniform sampler2D uAlphaTexture;
uniform vec3 uBaseColor;
uniform vec3 uTipColor;
uniform vec3 uWindTipColor;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uAmbientStrength;

void main() {
    // Obtain the alpha value from the texture
    float alpha = texture2D(uAlphaTexture, vUv).r;

    // Discard pixels with low alpha
    if (alpha < 0.5) {
      discard;
    }

    // Use noise to modulate the color blend and add variation
    float noiseInfluence = vNoise * 0.3 + 0.7; // Scale noise to 0.7-1.0 range

    // Choose tip color based on noise (wind areas vs calm areas)
    float colorTransition = smoothstep(0.2, 0.6, vNoise);
    vec3 finalTipColor = mix(uWindTipColor, uTipColor, colorTransition);

    // Blend between base and tip color based on Y coordinate, influenced by noise
    vec3 color = mix(finalTipColor, uBaseColor, vUv.y * noiseInfluence);

    // Add subtle color variation based on noise
    color = mix(color, color * 1.1, vNoise * 0.2);

    // Simple directional lighting
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(-uLightDirection);

    // Calculate diffuse lighting
    float NdotL = max(dot(normal, lightDir), 0.0);

    // Add ambient lighting
    vec3 ambient = uAmbientStrength * color;
    vec3 diffuse = NdotL * uLightColor * color;

    // Combine lighting
    vec3 finalColor = ambient + diffuse;

    gl_FragColor = vec4(finalColor, alpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    // #include <fog_fragment>
}
