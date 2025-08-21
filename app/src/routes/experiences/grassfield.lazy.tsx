import {
  OrbitControls,
  PerspectiveCamera,
  useHelper,
  useTexture,
} from "@react-three/drei";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useControls } from "leva";
import { useMemo, useRef, type FC } from "react";
import { DirectionalLight, DirectionalLightHelper, Mesh } from "three";
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

const Cloud: FC<
  {
    url: string;
    // Random seed for animation, default to a random number (0, 1)
    seed?: number;
  } & ThreeElements["mesh"]
> = ({ url, seed = Math.random(), ...props }) => {
  // Load the texture for the cloud
  const texture = useTexture(url);

  // Store the initial position of the cloud mesh for animation
  const initialPosition = useMemo<[number, number, number]>(
    () => (props.position as never) || [0, 0, 0],
    [props.position]
  );

  // Generate random animation parameters based on the seed
  const params = useMemo(() => {
    // Use seed to create reproducible random values
    const r1 = (Math.sin(seed * 12.9898) * 43758.5453) % 1;
    const r2 = (Math.sin(seed * 78.233) * 43758.5453) % 1;
    const r3 = (Math.sin(seed * 37.719) * 43758.5453) % 1;
    const r4 = (Math.sin(seed * 93.989) * 43758.5453) % 1;

    return {
      // Direction: -1 for left to right, 1 for right to left
      direction: r1 > 0.5 ? 1 : -1,
      // Speed multiplier
      speed: 0.3 + r2 * 0.8,
      // Amplitude: 50 to 200
      amplitude: 50 + r3 * 150,
      // Phase offset for variation
      phaseOffset: r4 * Math.PI * 2,
    };
  }, [seed]);

  // Store the mesh ref to make them move
  const ref = useRef<Mesh>(null!);

  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();

    // Calculate movement with randomized parameters
    const time = elapsed * params.speed + params.phaseOffset;
    const offset = Math.sin(time / 100) * params.amplitude * params.direction;

    // Apply the movement to the cloud
    ref.current.position.x = initialPosition[0] + offset;
  });

  return (
    <mesh {...props} ref={ref}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.5} />
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
  const { performance, orbit } = useControls("Performance", {
    performance: false,
    orbit: false,
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
          count={40}
          limit={[60, 5, 50]}
        />

        <Cloud
          url="/textures/skys/clouds/cloud_1.webp"
          position={[-100, 50, -200]}
          scale={[200, 100, 1]}
        />

        <Cloud
          url="/textures/skys/clouds/cloud_2.webp"
          position={[100, 55, -120]}
          scale={[100, 100, 1]}
        />

        {performance ? <Perf position="top-left" /> : null}
      </Canvas>
    </div>
  );
};

export const Route = createLazyFileRoute("/experiences/grassfield")({
  component: Index,
});
