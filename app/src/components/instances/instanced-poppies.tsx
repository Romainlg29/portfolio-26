import { useGLTF, useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef, type FC } from "react";
import {
  DoubleSide,
  MeshToonMaterial,
  Texture,
  Vector2,
  type InstancedMesh,
  type Matrix4,
  type Mesh,
} from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import vertex from "@/components/shaders/csm/vegetation/sway-vertex-csm.glsl?raw";
import { useFrame } from "@react-three/fiber";

type InstancedPoppiesProps = {
  // The number of instances to render
  instances: number;

  // The size of each instance
  size: number;

  // The transorms for each instance
  transforms: Matrix4[];

  // If the instances should be hidden
  hidden?: boolean;
};

const InstancedPoppies: FC<InstancedPoppiesProps> = ({
  instances,
  size,
  transforms,
}) => {
  // Load the grass model
  const { nodes } = useGLTF("/models/natures/poppies.glb", true);

  // Load the textures
  const color = useTexture("/textures/vegetations/poppy/T_vmcobd0ja_1K_B.jpg");

  // Store the instanced mesh reference
  const instanceRef = useRef<InstancedMesh>(null!);

  // Extract the geometry from the loaded model
  const geometry = useMemo(
    () =>
      (nodes["SM_vmcobd0ja_VarA_LOD1"] as Mesh).geometry
        .clone()
        .scale(size, size, size),
    [nodes, size]
  );

  // Material for the grass instances
  const material = useMemo(() => {
    const m = new CustomShaderMaterial({
      baseMaterial: MeshToonMaterial,
      vertexShader: vertex,
      uniforms: {
        uTime: { value: 0 },
        uWindDirection: { value: new Vector2(1, 0) },
        uWindStrength: { value: 1 },
      },
      side: DoubleSide,
    });

    (m as typeof m & { map: Texture }).map = color;
    (m as typeof m & { map: Texture }).map.flipY = false;

    return m;
  }, [color]);

  // Apply the transforms to the instances
  useEffect(() => {
    // If the instance reference is not set, return early
    if (!instanceRef.current) return;

    transforms.forEach((transform, index) => {
      instanceRef.current.setMatrixAt(index, transform);
    });

    // Mark the instance matrix as needing an update
    instanceRef.current.instanceMatrix.needsUpdate = true;
  }, [transforms]);

  // Update the time uniform for the shader
  useFrame(() => {
    if (!instanceRef.current) return;

    material.uniforms.uTime.value += 0.03;
  });

  // Do not always re-render
  return useMemo(
    () => (
      <instancedMesh ref={instanceRef} args={[geometry, material, instances]} />
    ),
    [geometry, material, instances]
  );
};

export default InstancedPoppies;
