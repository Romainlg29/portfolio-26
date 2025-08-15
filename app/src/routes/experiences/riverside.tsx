import {
  OrbitControls,
  RoundedBox,
  useGLTF,
  useHelper,
  useTexture,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { createFileRoute } from "@tanstack/react-router";
import { useControls } from "leva";
import { useEffect, useMemo, useRef, useState, type FC } from "react";
import {
  Color,
  DirectionalLight,
  DirectionalLightHelper,
  Mesh,
  MeshStandardMaterial,
} from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { MeshSurfaceSampler } from "three-stdlib";
import { Perf } from "r3f-perf";

const lights_options = {
  helper: false,
};

const Terrain: FC = () => {
  const { scene } = useGLTF("/models/riverside.glb", true);
  const [terrainTexture, pathTexture] = useTexture([
    "/textures/riverside/riverside_terrain.webp",
    "/textures/riverside/riverside_path.webp",
  ]);

  useEffect(() => {
    const terrainMesh = scene.getObjectByName("riverside_terrain") as
      | Mesh
      | undefined;

    if (!terrainMesh) {
      console.error("Terrain mesh not found in the scene.");
      return;
    }

    terrainMesh.material = new MeshStandardMaterial({
      map: terrainTexture,
    });

    const pathMesh = scene.getObjectByName("riverside_path") as
      | Mesh
      | undefined;

    if (!pathMesh) {
      console.error("Path mesh not found in the scene.");
      return;
    }

    pathMesh.material = new MeshStandardMaterial({
      map: pathTexture,
    });
  }, [scene, terrainTexture, pathTexture]);

  return <primitive object={scene} />;
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

const Index = () => {
  const [sampler, setSampler] = useState<MeshSurfaceSampler | null>(null);

  const { performance } = useControls("Performance", {
    performance: false,
  });

  return (
    <div className="w-dvw h-dvh flex bg-gradient-to-b from-blue-300 to-white">
      <Canvas shadows className="w-full h-full">
        <OrbitControls />

        <Lights />
        <Terrain />

        {performance ? <Perf position="top-left" /> : null}
      </Canvas>
    </div>
  );
};

export const Route = createFileRoute("/experiences/riverside")({
  component: Index,
});
