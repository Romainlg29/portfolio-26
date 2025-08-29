import {
  useHelper,
  useTexture,
  PerspectiveCamera as DreiPerspectiveCamera,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame, type ThreeElements } from "@react-three/fiber";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useControls } from "leva";
import {
  useMemo,
  useRef,
  useEffect,
  useState,
  type FC,
  Suspense,
  lazy,
} from "react";
import {
  DirectionalLight,
  DirectionalLightHelper,
  Mesh,
  PerspectiveCamera as ThreePerspectiveCamera,
} from "three";
import Tile from "@/components/tiles/tile";
import GrassTile from "@/components/tiles/grass-tile";
import PoppiesTile from "@/components/tiles/poppies-tile";
import EverlastingTile from "@/components/tiles/everlasting-tile";
import PeriwinklesTile from "@/components/tiles/periwinkles-tile";
import SimpleParticles from "@/components/particles/SimpleParticles";
import BaseTerrain from "@/components/terrains/base-terrain";
import { z } from "zod";
import { useAmbientSound } from "@/hooks/useAmbientSound";
import { useDeviceOrientationPermission } from "@/hooks/useDeviceOrientationPermission";

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

const Mountains: FC<
  { url: string; aspect?: number } & ThreeElements["mesh"]
> = ({ url, aspect = 1, ...props }) => {
  const texture = useTexture(url);

  return (
    <mesh {...props}>
      <planeGeometry args={[aspect, 1]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.5} />
    </mesh>
  );
};

const Tent: FC<ThreeElements["group"]> = (props) => {
  const { nodes } = useGLTF("/models/objects/tent-transformed.glb", true);

  return (
    <group {...props}>
      <primitive object={nodes["tent"]}>
        <meshStandardMaterial color="#ff0000" />
      </primitive>
      <primitive object={nodes["tent_entrance"]}>
        <meshStandardMaterial color="brown" />
      </primitive>
    </group>
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

const Headline: FC = () => {
  return (
    <div className="absolute top-0 left-0 z-10 w-full h-full grid grid-cols-12 pointer-events-none">
      <div className="col-span-10 col-start-2 md:col-span-4 md:col-start-8 grid grid-rows-12">
        <div className="row-span-4 row-start-7 md:row-start-4 flex flex-col justify-center">
          <h1 className="text-4xl font-bold font-borel text-white animate-fade-in-bottom">
            Hi, I'm Romain.
          </h1>

          <p className="text-2xl mt-2 font-ropa text-white animate-fade-in-bottom animation-delay-800 apply-fill-mode-backwards">
            I'm a software engineer based in Brest, France.
          </p>

          <div className="mt-8 flex gap-2">
            <a
              href="https://linkedin.com/in/romainlg29/"
              target="_blank"
              className="pointer-events-auto"
            >
              <button className="px-4 py-1 mt-2 bg-[#0a66c2]/50 hover:bg-[#0a66c2]/60 backdrop-blur-[2px] border border-[#0a66c2]/60 rounded-3xl text-lg font-ropa text-white animate-fade-in-bottom animation-delay-1600 apply-fill-mode-backwards transition-colors cursor-pointer">
                Linkedin
              </button>
            </a>
            <a
              href="https://github.com/Romainlg29"
              target="_blank"
              className="pointer-events-auto"
            >
              <button className="px-4 py-1 mt-2 bg-[#333]/50 hover:bg-[#333]/60 backdrop-blur-[2px] border border-[#333]/60 rounded-3xl text-lg font-ropa text-white animate-fade-in-bottom animation-delay-2000 apply-fill-mode-backwards transition-colors cursor-pointer">
                GitHub
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrbitControls = lazy(
  () => import("@/components/controls/orbit-controls")
);

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
    // Use pointer for desktop, gyroscope for mobile
    const onPointerMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      // Only update if not on mobile
      if (!window.matchMedia("(pointer: coarse)").matches) {
        setPointer({ x, y });
      }
    };

    // Gyroscope for mobile
    const onDeviceOrientation = (e: DeviceOrientationEvent) => {
      // gamma: left/right (-90 to 90), beta: up/down (-180 to 180)
      // We'll map gamma to x, beta to y
      // Clamp to [-10, 10] for high sensitivity
      const gamma = Math.max(-10, Math.min(10, e.gamma ?? 0));
      const beta = Math.max(-10, Math.min(10, e.beta ?? 0));
      // Map gamma [-10, 10] to x [0, 1]
      const x = 0.5 + gamma / 20;
      // Map beta [-10, 10] to y [0, 1]
      const y = 0.5 + beta / 20;
      // Clamp x/y to [0,1] just in case
      const xClamped = Math.max(0, Math.min(1, x));
      const yClamped = Math.max(0, Math.min(1, y));

      // Only update if on mobile
      if (window.matchMedia("(pointer: coarse)").matches) {
        setPointer({ x: xClamped, y: yClamped });
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("deviceorientation", onDeviceOrientation);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("deviceorientation", onDeviceOrientation);
    };
  }, []);

  // Ask for device orientation permission on IOS
  useDeviceOrientationPermission();

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

  if (orbit)
    // Lazy load orbit controls to reduce the initial bundle size
    return (
      <Suspense>
        <OrbitControls />
      </Suspense>
    );

  return (
    <DreiPerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={defaultPos as [number, number, number]}
      fov={50}
    />
  );
};

// Lazy
const Perf = lazy(() => import("@/components/controls/perf"));

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
    <div className="relative w-dvw h-dvh flex bg-gradient-to-b from-blue-300 to-white">
      <Canvas shadows className="w-full h-full">
        <Camera />
        <Lights />

        <BaseTerrain url="/models/grassfield_v2-transformed.glb">
          <Tile node="grassfield_verynear" color="#17640f">
            <GrassTile instances={500} size={20} />

            <Suspense>
              <PoppiesTile instances={50} size={0.025} />
              <EverlastingTile instances={50} size={0.01} />
              <PeriwinklesTile instances={50} size={0.01} />
            </Suspense>
          </Tile>

          <Tile node="grassfield_near" color="#17640f">
            <GrassTile instances={500} size={20} />

            <Suspense>
              <PoppiesTile instances={100} size={0.025} />
              <EverlastingTile instances={100} size={0.01} />
              <PeriwinklesTile instances={100} size={0.01} />
            </Suspense>
          </Tile>

          <Tile node="grassfield_medium" color="#17640f">
            <GrassTile instances={500} size={30} />

            <Suspense>
              <PoppiesTile instances={50} size={0.03} />
              <EverlastingTile instances={50} size={0.02} />
              <PeriwinklesTile instances={50} size={0.02} />
            </Suspense>
          </Tile>

          <Tile node="grassfield_far" color="#17640f">
            <GrassTile instances={1000} size={45} />

            <Suspense>
              <PoppiesTile instances={50} size={0.05} />
              <EverlastingTile instances={50} size={0.03} />
              <PeriwinklesTile instances={50} size={0.03} />
            </Suspense>
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

        <Suspense>
          <Cloud
            url="/textures/skys/clouds/cloud_1.webp"
            position={[-150, 45, -290]}
            scale={[100, 50, 1]}
          />
        </Suspense>

        <Suspense>
          <Cloud
            url="/textures/skys/clouds/cloud_2.webp"
            position={[200, 70, -310]}
            scale={[125, 125, 1]}
          />
        </Suspense>

        <Suspense>
          <Tent
            scale={10}
            rotation={[0, Math.PI / 4, 0]}
            position={[-15, 0, 10]}
          />
        </Suspense>

        <Suspense>
          <Mountains
            url="/textures/skys/mountains/mountains.webp"
            aspect={3.82}
            position={[0, 10, -300]}
            scale={200}
          />
        </Suspense>

        {performance ? (
          // Only load when needed to reduce initial bundle size
          <Suspense>
            <Perf position="top-left" />
          </Suspense>
        ) : null}
      </Canvas>

      <Headline />
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
