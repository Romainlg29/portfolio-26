uniform vec3 uInsideColor;
uniform vec3 uOutsideColor;

varying float vRadius;

void main() {
    float t = smoothstep(0.2, 1.0, vRadius);
    vec3 color = mix(uInsideColor, uOutsideColor, t);
    csm_DiffuseColor = vec4(color, 1.0);
}