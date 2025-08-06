import {
  OrbitControls,
  useHelper,
  useFBO,
  RoundedBox,
  OrthographicCamera,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useControls } from "leva";
import { useEffect, useMemo, useRef, useState, type FC } from "react";
import {
  CameraHelper,
  DirectionalLight,
  DirectionalLightHelper,
  Layers,
  Mesh,
  MeshToonMaterial,
  OrthographicCamera as OrthographicCameraClass,
} from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { Perf } from "r3f-perf";

import fragment from "@/components/shaders/csm/natures/water-fragment-csm.glsl?raw";
import vertex from "@/components/shaders/csm/natures/water-vertex-csm.glsl?raw";

const lights_options = {
  helper: false,
};

const Water: FC<{ camera: OrthographicCameraClass }> = ({ camera }) => {
  const depthRenderTargetA = useFBO(512, 512, { depthBuffer: true });
  const depthRenderTargetB = useFBO(512, 512, { depthBuffer: true });

  const waterMeshRef = useRef<Mesh>(null!);

  // Create a custom shader material for the water
  const material = useMemo(() => {
    return new CustomShaderMaterial({
      baseMaterial: MeshToonMaterial,
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTime: { value: 0 },
        uDepthTexture: { value: null },
        uWaterDepthTexture: { value: null },
        uCameraNear: { value: camera.near },
        uCameraFar: { value: camera.far },
      },
    });
  }, [camera]);

  useFrame(({ scene, gl }, delta) => {
    if (!waterMeshRef.current) return;

    // Render scene depth
    camera.layers.set(0);
    gl.setRenderTarget(depthRenderTargetA);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(null);

    // Set the depth texture for the shader
    material.uniforms.uDepthTexture.value = depthRenderTargetA.depthTexture;

    // Render water mesh depth to B
    camera.layers.set(1);
    gl.setRenderTarget(depthRenderTargetB);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(null);

    // Set the water depth texture for the shader (from B)
    material.uniforms.uWaterDepthTexture.value =
      depthRenderTargetB.depthTexture;

    // Update the time uniform for the shader
    if (material.uniforms.uTime) {
      material.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh
      ref={waterMeshRef}
      material={material}
      rotation-x={-Math.PI / 2}
      // Set the layer to 1 for depth rendering
      layers={1}
    >
      <planeGeometry args={[10, 10, 1, 1]} />
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
        intensity={1}
        castShadow
      />
    </>
  );
};

const DepthCamera: FC<{
  setCamera: (camera: OrthographicCameraClass | null) => void;
}> = ({ setCamera }) => {
  const cameraRef = useRef<OrthographicCameraClass>(null!);

  const { helper } = useControls("Depth camera", {
    helper: false,
  });

  // Use the helper to visualize the depth camera
  useHelper(helper && cameraRef, CameraHelper);

  useEffect(() => {
    // Set the camera in the parent component
    if (cameraRef.current) {
      setCamera(cameraRef.current);
    }
  }, [setCamera]);

  return (
    <OrthographicCamera
      ref={cameraRef}
      name="top-camera"
      position={[0, 10, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      near={0.1}
      far={20}
      left={-5}
      right={5}
      top={5}
      bottom={-5}
    />
  );
};

const Index = () => {
  const { performance } = useControls("Performance", {
    performance: false,
  });

  const [depthCamera, setDepthCamera] =
    useState<OrthographicCameraClass | null>(null);

  // Enable the layer 1 rendering
  const layers = useMemo(() => {
    const lays = new Layers();

    // Add the layer one
    lays.enable(1);

    return lays;
  }, []);

  return (
    <div className="w-dvw h-dvh flex bg-gradient-to-b from-blue-300 to-white">
      <Canvas shadows className="w-full h-full" camera={{ layers: layers }}>
        <OrbitControls />

        <Lights />

        <DepthCamera setCamera={setDepthCamera} />
        {/* Render the water with the depth camera */}
        {depthCamera ? <Water camera={depthCamera} /> : null}

        <RoundedBox position={[0, 1, 0]} />
        <RoundedBox position={[2, -2, 0]} />
        <RoundedBox position={[-2, 0, 0]} />

        {performance ? <Perf position="top-left" /> : null}
      </Canvas>
    </div>
  );
};

export const Route = createLazyFileRoute("/experiences/water")({
  component: Index,
});
