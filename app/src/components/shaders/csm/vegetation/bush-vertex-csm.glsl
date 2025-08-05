uniform float uTime;
uniform vec2 uWindDirection;
uniform float uWindStrength;

varying float vRadius;

void main() {
    vRadius = length(position);

    // Calculate sway factor: 0 at base (y=0), 1 at top (y=1)
    float swayAmount = clamp(position.y, 0.5, 1.0);

    // Make sway exponential for a more natural effect
    float curve = 3.;
    swayAmount = pow(swayAmount, curve);

    float sway = sin(uTime + position.x * 2.0 + position.z * 2.0) * uWindStrength;

    vec3 pos = position;
    pos.x += uWindDirection.x * sway * swayAmount;
    pos.z += uWindDirection.y * sway * swayAmount;

    csm_Position = pos;
}