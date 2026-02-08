import Rafale from "@/components/models/rafale";
import {
  Environment,
  MeshReflectorMaterial,
  OrbitControls,
  PerspectiveCamera,
  ScrollControls,
  useScroll,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useControls } from "leva";
import { lazy, Suspense, useMemo, useRef, type FC } from "react";
import { z } from "zod";
import {
  CatmullRomCurve3,
  Layers,
  Vector3,
  type PerspectiveCamera as ThreePerspectiveCamera,
} from "three";
import {
  AerialPerspective,
  Atmosphere,
  LightingMask,
  Sky,
  SkyLight,
  SunLight,
} from "@takram/three-atmosphere/r3f";
import { useApplyLocation } from "@/hooks/useApplyLocation";
import { EastNorthUpFrame } from "@takram/three-geospatial/r3f";
import { Geodetic, radians } from "@takram/three-geospatial";

// Lazy
const Perf = lazy(() => import("@/components/controls/perf"));

type IntroductionCameraProps = {
  onEnd: () => void;
};

const IntroductionCamera: FC<IntroductionCameraProps> = ({ onEnd }) => {
  // Get the scroll offset and delta
  const scroll = useScroll();

  // Store the camera ref
  const camRef = useRef<ThreePerspectiveCamera | null>(null);

  // Curve to animate the camera along
  const curve = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(0, 0.2, 3.25),
        new Vector3(0, 0.25, 1.5),
      ]),
    [],
  );

  useFrame(() => {
    if (!camRef.current) return;

    // Animate the camera along the curve based on the scroll offset
    const position = curve.getPoint(scroll.offset);
    camRef.current.position.copy(position);

    if (scroll.offset >= 0.95) {
      onEnd();
    }
  });

  return (
    <PerspectiveCamera
      ref={camRef}
      makeDefault
      position={[0, 0.2, 3.25]}
      fov={45}
    />
  );
};

const Introduction = () => {
  const navigate = useNavigate();

  return (
    <Suspense>
      {/* <OrbitControls makeDefault /> */}

      <ScrollControls pages={2}>
        <IntroductionCamera
          onEnd={() => navigate({ to: "/", search: { scene: "e" } })}
        />
      </ScrollControls>

      {/** Background and fog */}
      <color attach="background" args={["#0A0A0A"]} />
      <fog attach="fog" args={["#0A0A0A", 0, 3]} />

      {/** Environment */}
      <Environment preset="studio" />

      {/** Rafale */}
      <group
        scale={0.01}
        position={[0, 0.001, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <Rafale />
      </group>

      {/** Floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={2048}
          mixBlur={1}
          mixStrength={200}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#010101"
          metalness={0.9}
        />
      </mesh>

      <EffectComposer>
        <Bloom luminanceThreshold={1.2} />
      </EffectComposer>
    </Suspense>
  );
};

const h = 2_000;
const p = new Geodetic(radians(-4.48), radians(48.4), h);
const l = new Geodetic(radians(-4.48), radians(48.4), h + 100).toECEF();

const LIGHTING_MASK_LAYER = 10;
const layers = new Layers();
layers.enable(LIGHTING_MASK_LAYER);

const Experience = () => {
  const controlsRef = useApplyLocation({
    longitude: -4.48,
    latitude: 48.4,
    height: h,
  });

  return (
    <Suspense>
      <OrbitControls ref={controlsRef} makeDefault />

      <Atmosphere date={1770517657} correctAltitude>
        <ambientLight intensity={5} />
        <Sky />

        <group position={l}>
          <SkyLight />
          <SunLight />
        </group>

        <EastNorthUpFrame {...p}>
          <Suspense>
            <Rafale rotation={[Math.PI / 2, Math.PI / 2, 0]} layers={layers} />
          </Suspense>
        </EastNorthUpFrame>

        <EffectComposer enableNormalPass>
          <LightingMask selectionLayer={LIGHTING_MASK_LAYER} />
          <AerialPerspective skyLight sunLight />
        </EffectComposer>
      </Atmosphere>
    </Suspense>
  );
};

const Index = () => {
  // Use the search parameters to control the performance and orbit controls
  const search = useSearch({ from: "/" });

  const { performance } = useControls(
    "Performance",
    {
      performance: false,
    },
    {
      // Only render the performance controls if debug is set in the search params
      render: () => search.debug !== undefined,
    },
  );

  return (
    <div className="relative w-dvw h-dvh flex flex-col">
      <Canvas shadows className="w-full h-full">
        {/** Load the correct scene */}
        <Suspense>
          {search.scene === "i" ? <Introduction /> : <Experience />}
        </Suspense>

        {performance ? (
          // Only load when needed to reduce initial bundle size
          <Suspense>
            <Perf position="top-left" />
          </Suspense>
        ) : null}
      </Canvas>
    </div>
  );
};

const search_params = z.object({
  debug: z.any().optional(),
  scene: z.enum(["i", "e"]).default("i").optional(),
});

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: (search) => search_params.parse(search),
});
