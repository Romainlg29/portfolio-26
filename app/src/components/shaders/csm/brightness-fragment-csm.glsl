uniform float uBrightness;

void main() {
    csm_FragColor.rgb *= uBrightness;
}

