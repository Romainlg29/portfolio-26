import { useMemo, type FC } from "react";
import { useTile } from "./tile";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import InstancedEverlasting from "../instances/instanced-everlasting";

type EverlastingTileProps = {
  // The number of instances to render
  instances: number;

  // The size of each instance
  size: number;
};

const EverlastingTile: FC<EverlastingTileProps> = ({ instances, size }) => {
  // Retrieve the tile context
  const { sampler, box } = useTile();

  // Create the transforms for the grass instances
  const transforms = useMemo(() => {
    if (!sampler) return [];

    return Array.from({ length: instances }, () => {
      const position = new Vector3();
      const normal = new Vector3();

      // Sample a position from the sampler
      sampler.sample(position, normal);

      // Compute a random rotation around the Y-axis
      const rotationY = Math.random() * Math.PI * 2;

      // Create rotation matrix that aligns with surface normal
      const matrix = new Matrix4();

      // Calculate the rotation to align with the surface normal
      const up = new Vector3(0, 1, 0);
      const quaternion = new Quaternion();
      quaternion.setFromUnitVectors(up, normal);

      // Apply the surface alignment rotation
      matrix.makeRotationFromQuaternion(quaternion);

      // Apply additional Y-axis rotation for variation
      const yRotationMatrix = new Matrix4();
      yRotationMatrix.makeRotationY(rotationY);
      matrix.multiply(yRotationMatrix);

      // Apply X rotation by 90°
      const xRotation = new Euler(Math.PI / 2, 0, 0, "XYZ");
      const xRotationMatrix = new Matrix4();
      xRotationMatrix.makeRotationFromEuler(xRotation);
      matrix.multiply(xRotationMatrix);

      // Set the position
      matrix.setPosition(position);
      return matrix;
    });
  }, [sampler, instances]);

  if (transforms.length === 0) {
    return null; // No instances to render
  }

  return (
    <InstancedEverlasting
      instances={instances}
      size={size}
      transforms={transforms}
    />
  );
};

export default EverlastingTile;
