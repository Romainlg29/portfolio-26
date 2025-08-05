uniform float uTime;
uniform sampler2D uDepthTexture;
uniform sampler2D uWaterDepthTexture;

uniform float uCameraNear;
uniform float uCameraFar;

varying vec2 vUv;

float readDepth(sampler2D depthSampler, vec2 coord) {
    float fragCoordZ = texture2D(depthSampler, coord).x;
    float viewZ = perspectiveDepthToViewZ(fragCoordZ, uCameraNear, uCameraFar);
    return viewZToOrthographicDepth(viewZ, uCameraNear, uCameraFar);
}

void main() {
    float sceneDepth = readDepth(uDepthTexture, vUv);
    float waterDepth = readDepth(uWaterDepthTexture, vUv);

    // Display the depths
    csm_DiffuseColor = vec4(vec3(sceneDepth), 1.0);
    // csm_DiffuseColor = vec4(vec3(waterDepth), 1.0);

    // compute the difference
    // float depthDifference = abs(sceneDepth - waterDepth);
    // csm_DiffuseColor = vec4(vec3(depthDifference), 1.0);
}