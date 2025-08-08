uniform float uTime;

uniform float uCameraNear;
uniform float uCameraFar;

varying vec2 vUv;

float readDepth(sampler2D depthSampler, vec2 coord) {
    float fragCoordZ = texture2D(depthSampler, coord).x;
    float viewZ = perspectiveDepthToViewZ(fragCoordZ, uCameraNear, uCameraFar);
    return viewZToOrthographicDepth(viewZ, uCameraNear, uCameraFar);
}

void main() {
    // Display the depths
    csm_DiffuseColor = vec4(1., 1., 1., 1.0);
}