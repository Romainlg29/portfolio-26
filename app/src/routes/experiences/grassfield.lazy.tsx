import { OrbitControls, PerspectiveCamera, useHelper } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useControls } from "leva";
import { useRef } from "react";
import { DirectionalLight, DirectionalLightHelper } from "three";
import { Perf } from "r3f-perf";
import Tile from "@/components/tiles/tile";
import GrassTile from "@/components/tiles/grass-tile";
import PoppiesTile from "@/components/tiles/poppies-tile";
import EverlastingTile from "@/components/tiles/everlasting-tile";
import PeriwinklesTile from "@/components/tiles/periwinkles-tile";
import SimpleParticles from "@/components/particles/SimpleParticles";
import BaseTerrain from "@/components/terrains/base-terrain";

const lights_options = {
  helper: false,
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
  const { performance, orbit } = useControls("Performance", {
    performance: false,
    orbit: true,
  });

  return (
    <div className="w-dvw h-dvh flex bg-gradient-to-b from-blue-300 to-white">
      <Canvas shadows className="w-full h-full">
        {orbit ? (
          <OrbitControls />
        ) : (
          <PerspectiveCamera makeDefault position={[0, 5, 100]} fov={50} />
        )}

        <Lights />

        <BaseTerrain url="/models/grassfield.glb">
          <Tile node="grassfield_near" color="#17640f">
            <GrassTile instances={2_000} size={20} />
            <PoppiesTile instances={200} size={0.025} />
            <EverlastingTile instances={200} size={0.01} />
            <PeriwinklesTile instances={200} size={0.01} />
          </Tile>
          <Tile node="grassfield_medium" color="#17640f">
            <GrassTile instances={1_500} size={30} />

            <PoppiesTile instances={50} size={0.03} />
            <EverlastingTile instances={50} size={0.02} />
            <PeriwinklesTile instances={50} size={0.02} />
          </Tile>
          <Tile node="grassfield_far" color="#17640f">
            <GrassTile instances={1_500} size={40} />

            <PoppiesTile instances={50} size={0.04} />
            <EverlastingTile instances={50} size={0.02} />
            <PeriwinklesTile instances={50} size={0.02} />
          </Tile>
        </BaseTerrain>

        <SimpleParticles
          position={[0, 5, 60]}
          texture={"/textures/animals/butterflies/butterfly_1.webp"}
          count={20}
          limit={[20, 5, 40]}
        />

        {performance ? <Perf position="top-left" /> : null}
      </Canvas>
    </div>
  );
};

export const Route = createLazyFileRoute("/experiences/grassfield")({
  component: Index,
});
