import Rafale from "@/components/models/rafale";
import {
  Environment,
  MeshReflectorMaterial,
  OrbitControls,
  PerspectiveCamera,
  PointerLockControls,
  ScrollControls,
  Sky,
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
import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type RefObject,
} from "react";
import { z } from "zod";
import {
  CatmullRomCurve3,
  Vector3,
  type PerspectiveCamera as ThreePerspectiveCamera,
} from "three";
import { useRafaleStore } from "@/stores/use-rafale-store";
import { AnimatePresence, motion } from "motion/react";
import tunnel from "tunnel-rat";
import { ArrowRightIcon } from "lucide-react";

// Lazy
const Perf = lazy(() => import("@/components/controls/perf"));

const t = tunnel();

type IntroductionCameraProps = {
  onProgress: (p: number) => void;
};

const IntroductionCamera: FC<IntroductionCameraProps> = ({ onProgress }) => {
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

    //
    onProgress(scroll.offset);
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

const IntroductionHint: FC = () => {
  // State to control the visibility of the hint
  const [visible, setVisible] = useState<boolean>(false);

  // Store the timeout ref to clear it on unmount
  const to = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onWheel = () => {
      if (to.current) {
        clearTimeout(to.current);
        to.current = null;
      }

      setVisible(false);
    };

    // Listen for scroll events to hide the hint
    window.addEventListener("wheel", onWheel);

    // Add a timeout on mount to show the hint
    to.current = setTimeout(() => {
      setVisible(true);
    }, 5000);

    return () => {
      if (to.current) {
        clearTimeout(to.current);
        to.current = null;
      }

      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.p
        className="absolute top-5/6 left-1/2 -translate-x-1/2 -translate-y-5/6 z-10 text-sm text-gray-400"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        Hint: scroll down to take off
      </motion.p>
    </AnimatePresence>
  );
};

type IntroductionProps = {
  onReady: () => void;
};

const Introduction: FC<IntroductionProps> = ({ onReady }) => {
  // State to control the call to action visibility
  const [cta, setCta] = useState(false);

  return (
    <Suspense>
      <t.In>
        <IntroductionHint />

        <AnimatePresence>
          <motion.button
            className="absolute top-5/6 left-1/2 -translate-x-1/2 -translate-y-5/6 z-10 px-6 py-3 bg-white rounded-full flex items-center gap-2 text-sm font-medium cursor-pointer"
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{
              scale: cta ? 1 : 0,
              opacity: cta ? 1 : 0,
              y: cta ? 0 : 20,
            }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            whileHover={{ scale: 1.1 }}
            transition={{
              type: "spring",
              bounce: 0.5,
              velocity: 0.5,
            }}
            onClick={onReady}
          >
            Take off
            <ArrowRightIcon className="size-4" />
          </motion.button>
        </AnimatePresence>
      </t.In>

      <ScrollControls pages={2}>
        <IntroductionCamera onProgress={(p) => setCta(p >= 0.8)} />
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

type ExperienceCameraProps = {
  camRef: RefObject<ThreePerspectiveCamera | null>;
};

const ExperienceCamera: FC<ExperienceCameraProps> = ({ camRef }) => {
  // Subscribe to the Rafale store to get the lookAtTarget and fov
  const store = useRafaleStore((s) => ({
    position: s.position,
    offset: s.offset,
    lookAtTarget: s.lookAtTarget,
    fov: s.fov,
    setLookAtTarget: s.setLookAtTarget,
    setFov: s.setFov,
  }));

  const previousFov = useRef<number>(75);

  // Store the delta
  const start = useRef<number | null>(null);

  // Listen for scroll wheel events to zoom in and out
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      // If the user scrolls up, zoom in. If they scroll down, zoom out
      if (e.deltaY < 0) {
        // Zoom in
        store.setFov((fov) => Math.max(30, fov - 2.5));
      } else {
        // Zoom out
        store.setFov((fov) => Math.min(75, fov + 2.5));
      }
    };

    window.addEventListener("wheel", onWheel);

    return () => {
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  // Update the camera rotation based on the mouse position
  useFrame(({ pointer, clock }) => {
    if (!camRef.current) return;

    // Interpolate the FOV if it has changed
    if (store.fov !== previousFov.current) {
      // Interpolate the FOV towards the target FOV
      camRef.current.fov += ((store.fov || 75) - camRef.current.fov) * 0.05;

      // Update the previous FOV to the current FOV
      previousFov.current = camRef.current.fov;

      // Update the projection matrix after changing the FOV
      camRef.current.updateProjectionMatrix();
    }

    // Interpolate the camera position
    const target = new Vector3(
      store.position.x + store.offset.x,
      store.position.y + store.offset.y,
      store.position.z + store.offset.z,
    );

    // Smoothly lerp camera position to target
    camRef.current.position.x += (target.x - camRef.current.position.x) * 0.05;
    camRef.current.position.y += (target.y - camRef.current.position.y) * 0.05;
    camRef.current.position.z += (target.z - camRef.current.position.z) * 0.05;

    // If there's a lookAt target, interpolate the camera's lookAt towards it + the mouse position
    if (store.lookAtTarget) {
      // Initialize start time for delta calculation
      if (start.current === null) {
        start.current = clock.getElapsedTime();
      }

      // If we're past the duration
      if (clock.getElapsedTime() - start.current > 1) {
        // Reset start time to stop accumulating
        start.current = null;

        // Clear the lookAt target to stop the camera from updating
        store.setLookAtTarget(null);

        return;
      }

      // Get current look-at position
      const currentLookAt = new Vector3();
      camRef.current.getWorldDirection(currentLookAt);
      currentLookAt.add(camRef.current.position);

      // Create target with parallax offset
      const target = new Vector3().copy(store.lookAtTarget);
      target.z += (pointer.x * 0.25) / 10; // Change x to z for horizontal
      target.y += (pointer.y * 0.25) / 10;

      currentLookAt.lerp(target, 0.05);
      camRef.current.lookAt(currentLookAt);
    }

    // Reset start time if there's no lookAt target to stop the camera from updating
    if (!store.lookAtTarget) {
      start.current = null;
    }
  });

  return useMemo(
    () => (
      <PerspectiveCamera
        ref={camRef}
        makeDefault
        near={0.1}
        fov={75}
        position={store.position}
        rotation={[0, Math.PI / 2, 0]}
      />
    ),
    [],
  );
};

const ExperienceCursor: FC = () => {
  const cursor = useRafaleStore((s) => s.cursor);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] size-1.5 rounded-full bg-gray-300 pointer-events-none"
        initial={{ scale: 0 }}
        animate={{ scale: cursor ? 2 : 1 }}
        exit={{ scale: 0 }}
      />
    </AnimatePresence>
  );
};

const Experience = () => {
  const store = useRafaleStore((s) => ({
    setCursor: s.setCursor,
    setLookAtTarget: s.setLookAtTarget,
    setFov: s.setFov,
    setOffset: s.setOffset,
  }));

  // Store a ref to the camera
  const camRef = useRef<ThreePerspectiveCamera>(null);

  return (
    <Suspense>
      <t.In>
        <ExperienceCursor />
      </t.In>

      {/* <OrbitControls makeDefault /> */}
      <PointerLockControls makeDefault />

      <ambientLight intensity={2} />
      <Environment
        background
        // files="/textures/hdrs/sunflowers_puresky_2k.hdr"
        files="/textures/hdrs/qwantani_afternoon_puresky_2k.hdr"
      />

      <Suspense>
        <Rafale
          onFocus={() => store.setCursor(true)}
          onFocusEnd={() => store.setCursor(false)}
          onLongFocus={(vec, options) => {
            store.setLookAtTarget(vec);

            // Set the FOV
            store.setFov(options?.fov || 55);

            // Apply offset if provided
            if (options?.offset) {
              store.setOffset(options.offset);
            }
          }}
          onLongFocusEnd={() => {
            store.setFov(75);
            store.setLookAtTarget(null);

            // Reset offset when long focus ends
            store.setOffset(new Vector3(0, 0, 0));
          }}
        >
          <ExperienceCamera camRef={camRef} />
        </Rafale>
      </Suspense>
    </Suspense>
  );
};

const Index = () => {
  // Use the search parameters to control the performance
  const search = useSearch({ from: "/" });

  // Ready to transition from the introduction to the experience
  const [ready, setReady] = useState<boolean>(false);

  //
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
      <t.Out />

      <Canvas shadows className="w-full h-full">
        {/** Load the correct scene */}
        <Suspense>
          {ready ? (
            <Experience />
          ) : (
            <Introduction onReady={() => setReady(true)} />
          )}
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
});

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: (search) => search_params.parse(search),
});
