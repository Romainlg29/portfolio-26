import { useGLTF } from "@react-three/drei";
import { useEffect, useState, type FC, type ReactNode } from "react";

type BaseTerrainProps = {
  url: string;

  children?: ReactNode | ReactNode[];
};

const BaseTerrain: FC<BaseTerrainProps> = ({ url, children }) => {
  // State to track if the terrain model is ready
  const [isReady, setIsReady] = useState<boolean>(false);

  // Load the GLTF model using the provided URL
  const { scene } = useGLTF(url, true);

  useEffect(() => {
    if (!scene || Object.keys(scene).length === 0) {
      console.error("Terrain model not loaded or empty.");
      setIsReady(false);
      return;
    }

    // Set the terrain as ready when the model is loaded
    setIsReady(true);
  }, [scene, setIsReady]);

  return (
    <>
      <primitive object={scene} dispose={null} />

      {
        // Render children when loaded
        isReady ? children : null
      }
    </>
  );
};

export default BaseTerrain;
