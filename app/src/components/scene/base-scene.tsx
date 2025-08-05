import { Stage } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { FC, ReactNode } from "react";

type SceneProps = {
  children?: ReactNode | ReactNode[];
  stage?: boolean;
};

const Scene: FC<SceneProps> = ({ children, stage }) => {
  return (
    <Canvas shadows className="w-full h-full">
      {stage ? (
        <Stage shadows environment={"apartment"}>
          {children}
        </Stage>
      ) : (
        children
      )}
    </Canvas>
  );
};

export default Scene;
