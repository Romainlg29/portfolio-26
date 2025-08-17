uniform sampler2D uColorMap;
varying float vRotation;

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0., -1./3., 2./3., -1.);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1e-10;
    return vec3(abs((q.w - q.y) / (6. * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1., 2./3., 1./3., 3.);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6. - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0., 1.), c.y);
}

vec2 rotateUV(vec2 uv, float rotation, vec2 center) {
  float s = sin(rotation);
  float c = cos(rotation);
  uv -= center;
  uv = mat2(c, -s, s, c) * uv;
  uv += center;
  return uv;
}

void main() {
    vec2 uv = vec2(gl_PointCoord.x, 1. - gl_PointCoord.y);
    uv = rotateUV(uv, vRotation, vec2(0.5, 0.5));

    vec4 color = texture2D(uColorMap, uv);

    float saturation = 1.2;
    vec3 hsv = rgb2hsv(color.rgb);
    hsv.y = clamp(hsv.y * saturation, 0.0, 1.0);

    csm_DiffuseColor = vec4(hsv2rgb(hsv), color.a);
}