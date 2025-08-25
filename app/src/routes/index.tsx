import Scene from "@/components/scene/base-scene";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { createFileRoute, redirect } from "@tanstack/react-router";

const Index = () => {
  return (
    <Scene stage>
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 1]}
        rotation-x={Math.PI / 12}
      />

      <OrbitControls />
    </Scene>
  );
};

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Redirect to grass field for now
    throw redirect({to: "/experiences/grassfield"})
  },
  component: Index,
});
