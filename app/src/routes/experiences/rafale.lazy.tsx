import {
  AccumulativeShadows,
  OrbitControls,
  RandomizedLight,
  // useHelper,
} from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useControls } from "leva";
// import { useRef } from "react";
// import { DirectionalLight, DirectionalLightHelper } from "three";
import { Perf } from "r3f-perf";
import Rafale from "@/components/models/rafale";

// const lights_options = {
//   helper: false,
// };

// const Lights = () => {
//   const { helper } = useControls("Lights", lights_options);

//   // Create a reference for the directional light
//   const directionalLightRef = useRef<DirectionalLight>(null!);

//   // Use the helper to visualize the directional light
//   useHelper(helper && directionalLightRef, DirectionalLightHelper, 1, "red");

//   return (
//     <>
//       <ambientLight intensity={1.5} />
//       <directionalLight
//         ref={directionalLightRef}
//         position={[80, 100, 40]}
//         intensity={2}
//         castShadow
//         shadow-mapSize-width={1024}
//         shadow-mapSize-height={1024}
//         shadow-camera-near={0.1}
//         shadow-camera-far={500}
//         shadow-camera-left={-100}
//         shadow-camera-right={100}
//         shadow-camera-top={100}
//         shadow-camera-bottom={-100}
//       />
//     </>
//   );
// };

const Index = () => {
  const { performance } = useControls("Performance", {
    performance: false,
  });

  return (
    <div className="w-dvw h-dvh flex bg-black">
      <Canvas shadows className="w-full h-full">
        <OrbitControls />

        {/* <Lights /> */}
        <ambientLight intensity={2.5} />

        <AccumulativeShadows
          temporal
          frames={100}
          scale={10}
          color="#f0f0f0"
          position={[0, 0.05, 0]}
        >
          <RandomizedLight
            castShadow
            amount={8}
            position={[200, 100, 200]}
            size={500}
          />
        </AccumulativeShadows>

        <Rafale />

        <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial color="white" />
        </mesh>

        {performance ? <Perf position="top-left" /> : null}
      </Canvas>
    </div>
  );
};

export const Route = createLazyFileRoute("/experiences/rafale")({
  component: Index,
});
