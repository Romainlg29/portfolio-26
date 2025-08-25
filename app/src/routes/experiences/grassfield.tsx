import { OrbitControls, useHelper, useTexture } from "@react-three/drei";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { createFileRoute, useSearch } from "@tanstack/react-router";
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
import { z } from "zod";
import { useAmbientSound } from "@/hooks/useAmbientSound";

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
  // Use the search parameters to control the performance and orbit controls
  const search = useSearch({ from: "/experiences/grassfield" });

  const { helper } = useControls("Lights", lights_options, {
    // Only render the performance controls if debug is set in the search params
    render: () => search.debug !== undefined,
  });

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

import { useEffect, useState } from "react";
import { PerspectiveCamera as DreiPerspectiveCamera } from "@react-three/drei";
import { PerspectiveCamera as ThreePerspectiveCamera } from "three";
const Camera = () => {
  // Use the search parameters to control the performance and orbit controls
  const search = useSearch({ from: "/experiences/grassfield" });

  const { orbit } = useControls(
    "Camera",
    {
      orbit: false,
    },
    {
      // Only render the performance controls if debug is set in the search params
      render: () => search.debug !== undefined,
    }
  );

  // Store the pointer position
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });

  // Camera ref
  const cameraRef = useRef<ThreePerspectiveCamera>(null!);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent | TouchEvent) => {
      let x = 0.5;
      let y = 0.5;

      // Mobile
      if ("touches" in e && e.touches.length > 0) {
        x = e.touches[0].clientX / window.innerWidth;
        y = e.touches[0].clientY / window.innerHeight;
      }

      // Desktop
      else if ("clientX" in e && typeof e.clientX === "number") {
        x = e.clientX / window.innerWidth;
        y = e.clientY / window.innerHeight;
      }

      // Update the pointer position
      setPointer({ x, y });
    };

    // Listen for pointer events on the global window
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("touchmove", onPointerMove);

    // Clean up
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
    };
  }, []);

  // Default camera position
  const defaultPos = [0, 5, 100];
  // How much the camera can move from the center
  const maxOffset = { x: 5, y: 1.2 };

  // Smoothly interpolate camera position
  useFrame(() => {
    if (!cameraRef.current) return;

    // Calculate offset from pointer (centered at 0.5,0.5)
    const dx = (0.5 - pointer.x) * 2 * maxOffset.x;

    // Invert y: positive pointer.y moves camera up
    const dy = (pointer.y - 0.5) * 2 * maxOffset.y;

    // Target position
    const target = [defaultPos[0] + dx, defaultPos[1] + dy, defaultPos[2]] as [
      number,
      number,
      number,
    ];

    // Smooth lerp
    cameraRef.current.position.lerp(
      { x: target[0], y: target[1], z: target[2] },
      0.08
    );

    cameraRef.current.lookAt(0, 0, 0);
  });

  if (orbit) return <OrbitControls />;

  return (
    <DreiPerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={defaultPos as [number, number, number]}
      fov={50}
    />
  );
};

const Index = () => {
  // Use the search parameters to control the performance and orbit controls
  const search = useSearch({ from: "/experiences/grassfield" });

  const { performance } = useControls(
    "Performance",
    {
      performance: false,
    },
    {
      // Only render the performance controls if debug is set in the search params
      render: () => search.debug !== undefined,
    }
  );

  useAmbientSound("/sounds/ambient/grassfield.wav", { volume: 0.2 });

  return (
    <div className="w-dvw h-dvh flex bg-gradient-to-b from-blue-300 to-white">
      <Canvas shadows className="w-full h-full">
        <Camera />
        <Lights />

        <BaseTerrain url="/models/grassfield_v2.glb">
          <Tile node="grassfield_verynear" color="#17640f">
            <GrassTile instances={500} size={20} />

            <PoppiesTile instances={50} size={0.025} />
            <EverlastingTile instances={50} size={0.01} />
            <PeriwinklesTile instances={50} size={0.01} />
          </Tile>

          <Tile node="grassfield_near" color="#17640f">
            <GrassTile instances={500} size={20} />

            <PoppiesTile instances={100} size={0.025} />
            <EverlastingTile instances={100} size={0.01} />
            <PeriwinklesTile instances={100} size={0.01} />
          </Tile>

          <Tile node="grassfield_medium" color="#17640f">
            <GrassTile instances={500} size={30} />

            <PoppiesTile instances={50} size={0.03} />
            <EverlastingTile instances={50} size={0.02} />
            <PeriwinklesTile instances={50} size={0.02} />
          </Tile>

          <Tile node="grassfield_far" color="#17640f">
            <GrassTile instances={1000} size={45} />

            <PoppiesTile instances={50} size={0.05} />
            <EverlastingTile instances={50} size={0.03} />
            <PeriwinklesTile instances={50} size={0.03} />
          </Tile>

          <Tile node="grassfield_far001" color="#17640f">
            <GrassTile instances={800} size={50} />
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
          position={[100, 70, -280]}
          scale={[125, 125, 1]}
        />

        {performance ? <Perf position="top-left" /> : null}
      </Canvas>
    </div>
  );
};

const search_params = z.object({
  debug: z.any().optional(),
});

export const Route = createFileRoute("/experiences/grassfield")({
  component: Index,
  validateSearch: (search) => search_params.parse(search),
});
