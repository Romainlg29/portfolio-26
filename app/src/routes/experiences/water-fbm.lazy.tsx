import { Box, OrbitControls, useHelper } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useControls } from "leva";
import { useMemo, useRef, type FC } from "react";
import {
  Color,
  DirectionalLight,
  DirectionalLightHelper,
  Mesh,
  MeshStandardMaterial,
} from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { Perf } from "r3f-perf";

import fragment from "@/components/shaders/csm/natures/water-fragment-csm.glsl?raw";
import vertex from "@/components/shaders/csm/natures/water-vertex-csm.glsl?raw";

const lights_options = {
  helper: false,
};

const water_options = {
  uFoamColor: "#ffffff",
  uWaterColor: "#00a1ff",
  uWaveAngle: 0, // Angle in radians (0 = right, Math.PI/2 = up, etc.)
  uWaveSpeed: 0.5,
  uWaveHeight: 0.1,
  uWaveFrequency: 4.0,
};

const Water: FC = () => {
  const waterMeshRef = useRef<Mesh>(null!);

  // Create a custom shader material for the water
  const material = useMemo(() => {
    return new CustomShaderMaterial({
      baseMaterial: MeshStandardMaterial,
      vertexShader: vertex,
      fragmentShader: fragment,
      roughness: 1,
      metalness: 0,
      uniforms: {
        uTime: { value: 0 },
        uFoamColor: { value: new Color(water_options.uFoamColor) },
        uWaterColor: { value: new Color(water_options.uWaterColor) },
        uWaveAngle: { value: water_options.uWaveAngle },
        uWaveSpeed: { value: water_options.uWaveSpeed },
        uWaveHeight: { value: water_options.uWaveHeight },
        uWaveFrequency: { value: water_options.uWaveFrequency },
      },
      transparent: true,
    });
  }, []);

  const {
    uFoamColor,
    uWaterColor,
    uWaveAngle,
    uWaveFrequency,
    uWaveHeight,
    uWaveSpeed,
  } = useControls("Water", water_options);

  useFrame((_, delta) => {
    if (!waterMeshRef.current) return;

    // Update the time uniform for the shader
    material.uniforms.uTime.value += delta;

    // Update the wave uniforms
    material.uniforms.uWaterColor.value = new Color(uFoamColor);
    material.uniforms.uFoamColor.value = new Color(uWaterColor);
    material.uniforms.uWaveAngle.value = uWaveAngle;
    material.uniforms.uWaveFrequency.value = uWaveFrequency;
    material.uniforms.uWaveHeight.value = uWaveHeight;
    material.uniforms.uWaveSpeed.value = uWaveSpeed;
  });

  return (
    <mesh ref={waterMeshRef} material={material} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[10, 10, 100, 100]} />
    </mesh>
  );
};

const Lights = () => {
  const { helper } = useControls("Lights", lights_options);

  // Create a reference for the directional light
  const directionalLightRef = useRef<DirectionalLight>(null!);

  // Use the helper to visualize the directional light
  useHelper(helper && directionalLightRef, DirectionalLightHelper, 1, "red");

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        ref={directionalLightRef}
        position={[5, 5, 5]}
        intensity={5}
        castShadow
      />
    </>
  );
};

const Index = () => {
  const { performance } = useControls("Performance", {
    performance: false,
  });

  return (
    <div className="w-dvw h-dvh flex bg-gradient-to-b from-blue-300 to-white">
      <Canvas shadows className="w-full h-full">
        <OrbitControls />

        <Lights />

        <Water />
        <Box position={[0, -2, 0]} />

        {performance ? <Perf position="top-left" /> : null}
      </Canvas>
    </div>
  );
};

export const Route = createLazyFileRoute("/experiences/water-fbm")({
  component: Index,
});
