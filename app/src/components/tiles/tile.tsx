import { useThree } from "@react-three/fiber";
import {
  createContext,
  useMemo,
  type FC,
  type ReactNode,
  use,
  useEffect,
} from "react";
import { Box3, Color, MeshStandardMaterial, type Mesh } from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/Addons.js";

type TileContextType = {
  node: string;
  sampler: MeshSurfaceSampler | null;
  box: Box3 | null;
};

// Create the context
const TileContext = createContext<TileContextType | null>(null);

// Hook to use the tile context
// eslint-disable-next-line react-refresh/only-export-components
export const useTile = () => {
  const context = use(TileContext);
  if (!context) {
    throw new Error("useTile must be used within a Tile component");
  }
  return context;
};

type TileProps = {
  // The node's name or identifier
  node: string;

  // The tile color
  color?: string;

  // If it should hide the node or not
  hide?: boolean;

  // Children consuming the context from this tile
  children?: ReactNode | ReactNode[];
};

const Tile: FC<TileProps> = ({ node, color, hide, children }) => {
  // Retrieve the scene to search for the node
  const scene = useThree((s) => s.scene);

  // Create a mesh surface sampler
  const sampler = useMemo(() => {
    const mesh = scene.getObjectByName(node) as Mesh | undefined;

    if (!mesh) {
      console.error(`Mesh with name ${node} not found in the scene.`);
      return null;
    }

    return new MeshSurfaceSampler(mesh).build();
  }, [node, scene]);

  // Create a bounding box for the tile
  const box = useMemo(() => {
    const mesh = scene.getObjectByName(node) as Mesh | undefined;

    if (!mesh) {
      console.error(`Mesh with name ${node} not found in the scene.`);
      return null;
    }

    const box = new Box3().setFromObject(mesh);
    return box;
  }, [node, scene]);

  // Memoize the context value
  const value = useMemo(
    () => ({
      node,
      sampler,
      box,
    }),
    [node, sampler, box]
  );

  useEffect(() => {
    const mesh = scene.getObjectByName(node) as Mesh | undefined;

    if (mesh) {
      // Change the color if needed
      mesh.material = new MeshStandardMaterial({
        color: new Color(color || "white"),
      });

      // Hide the node if the hide prop
      mesh.visible = !hide;
    } else {
      console.error(`Mesh with name ${node} not found in the scene.`);
    }
  }, [node, color, hide, scene]);

  return <TileContext.Provider value={value}>{children}</TileContext.Provider>;
};

export default Tile;
