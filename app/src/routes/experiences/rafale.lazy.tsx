import {
  AccumulativeShadows,
  CameraControls,
  Environment,
  Html,
  MeshReflectorMaterial,
  OrbitControls,
  PerspectiveCamera,
  PointerLockControls,
  RandomizedLight,
  useHelper,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useControls } from "leva";
import { Perf } from "r3f-perf";
import Rafale from "@/components/models/rafale";
import {
  useEffect,
  useMemo,
  useRef,
  type FC,
  type Ref,
  type RefObject,
} from "react";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import {
  Vector3,
  type PerspectiveCamera as ThreePerspectiveCamera,
} from "three";
import { useRafaleStore } from "@/stores/use-rafale-store";
import { motion, AnimatePresence } from "motion/react";

type CameraProps = {
  camRef: RefObject<ThreePerspectiveCamera | null>;
};

const Camera: FC<CameraProps> = ({ camRef }) => {
  // Subscribe to the Rafale store to get the lookAtTarget and fov
  const store = useRafaleStore((s) => ({
    position: s.position,
    offset: s.offset,
    lookAtTarget: s.lookAtTarget,
    fov: s.fov,
    setLookAtTarget: s.setLookAtTarget,
  }));

  const previousFov = useRef<number>(75);

  // Store the delta
  const start = useRef<number | null>(null);

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

      currentLookAt.lerp(target, 0.6);
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
        near={0.00001}
        fov={75}
        position={store.position}
        rotation={[0, -Math.PI / 2, 0]}
      />
    ),
    [],
  );
};

const Cursor: FC = () => {
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

const Index = () => {
  const { performance } = useControls("Performance", {
    performance: false,
  });

  const store = useRafaleStore((s) => ({
    setCursor: s.setCursor,
    setLookAtTarget: s.setLookAtTarget,
    setFov: s.setFov,
    setOffset: s.setOffset,
  }));

  // Store a ref to the camera
  const camRef = useRef<ThreePerspectiveCamera>(null);

  return (
    <div className="relative w-dvw h-dvh flex bg-black">
      <Cursor />

      <Canvas shadows className="w-full h-full">
        <Camera camRef={camRef} />
        <PointerLockControls makeDefault />

        <Environment preset="studio" />

        <color attach="background" args={["#0A0A0A"]} />
        <fog attach="fog" args={["#0A0A0A", 0, 3]} />

        <group scale={0.01} position={[0, 0.001, 0]} rotation={[0, Math.PI, 0]}>
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
          />
        </group>

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
            metalness={0.5}
          />
        </mesh>

        {performance ? <Perf position="top-left" /> : null}

        <EffectComposer>
          <Bloom luminanceThreshold={1.2} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export const Route = createLazyFileRoute("/experiences/rafale")({
  component: Index,
});
