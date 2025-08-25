import { useGLTF, useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef, type FC } from "react";
import {
  Color,
  DoubleSide,
  MeshToonMaterial,
  type InstancedMesh,
  type Matrix4,
  type Mesh,
} from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import fragment from "@/components/shaders/csm/grass-fragment-csm.glsl?raw";
import vertex from "@/components/shaders/csm/grass-vertex-csm.glsl?raw";
import { useFrame } from "@react-three/fiber";

// Default options for the grass shader
const grass_options = {
  // Colors
  uBaseColor: "#000000",
  uTipColor: "#589941",
  uWindTipColor: "#2e5f36",
  // Parameters
  uWindStrength: 0.6,
  uNoiseScale: 0.01,
  uMaxDistance: 250,
  uMaxDisplacementDistance: 75,
};

type InstancedGrassProps = {
  // The number of instances to render
  instances: number;

  // The size of each instance
  size: number;

  // The transorms for each instance
  transforms: Matrix4[];

  // If the instances should be hidden
  hidden?: boolean;
};

const InstancedGrass: FC<InstancedGrassProps> = ({
  instances,
  size,
  transforms,
}) => {
  // Load the grass model
  const { nodes } = useGLTF("/models/grass.glb", true);

  // Load the alpha texture for the grass
  const alpha = useTexture("/textures/vegetations/grass-alpha.webp");

  // Store the instanced mesh reference
  const instanceRef = useRef<InstancedMesh>(null!);

  // Extract the geometry from the loaded model
  const geometry = useMemo(
    () => (nodes["grass"] as Mesh).geometry.clone().scale(size, size, size),
    [nodes, size]
  );

  // Material for the grass instances
  const material = useMemo(() => {
    const texture = alpha.clone();
    texture.flipY = false;

    return new CustomShaderMaterial({
      baseMaterial: MeshToonMaterial,
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTime: { value: 0 },

        uBaseColor: { value: new Color(grass_options.uBaseColor) },
        uTipColor: { value: new Color(grass_options.uTipColor) },
        uWindTipColor: { value: new Color(grass_options.uWindTipColor) },
        uWindStrength: { value: grass_options.uWindStrength },
        uNoiseScale: { value: grass_options.uNoiseScale },

        uMaxDistance: { value: grass_options.uMaxDistance },
        uMaxDisplacementDistance: {
          value: grass_options.uMaxDisplacementDistance,
        },
      },

      transparent: true,
      alphaTest: 0.5,
      side: DoubleSide,

      alphaMap: texture,
    });
  }, [alpha]);

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
    if (instanceRef.current) {
      material.uniforms.uTime.value += 0.01;
    }
  });

  // Do not always re-render
  return useMemo(
    () => (
      <instancedMesh
        ref={instanceRef}
        args={[geometry, material, instances]}
        receiveShadow
      />
    ),
    [geometry, material, instances]
  );
};

export default InstancedGrass;
