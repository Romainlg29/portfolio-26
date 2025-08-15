import {
  OrbitControls,
  PerspectiveCamera,
  RoundedBox,
  useGLTF,
  useHelper,
  useTexture,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useControls } from "leva";
import { useEffect, useMemo, useRef, useState, type FC } from "react";
import {
  Box3,
  Color,
  DirectionalLight,
  DirectionalLightHelper,
  DoubleSide,
  Euler,
  Frustum,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  MeshToonMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";

// import vertex from "@/components/shaders/grass-vertex.glsl";
// import fragment from "@/components/shaders/grass-fragment.glsl";

import fragment from "@/components/shaders/csm/grass-fragment-csm.glsl?raw";
import vertex from "@/components/shaders/csm/grass-vertex-csm.glsl?raw";
import { Perf } from "r3f-perf";

// Default options for the grass shader
const grass_options = {
  // Colors
  uBaseColor: "#000000",
  uTipColor: "#589941",
  uWindTipColor: "#2e5f36",
  // Parameters
  uWindStrength: 1.8,
  uNoiseScale: 0.15,
  uMaxDistance: 20,
  uMaxDisplacementDistance: 15,
};

const terrain_options = {
  color: "#3b250e",
};

const lights_options = {
  helper: false,
};

const Grass: FC<{
  count: number;
  sampler: MeshSurfaceSampler | null;
  bounds?: {
    min: Vector3;
    max: Vector3;
  };
}> = ({ count, sampler, bounds }) => {
  // Load the grass model
  const { nodes } = useGLTF("/models/grass.glb", true);

  // Load the alpha texture for the grass
  const alpha = useTexture("/textures/vegetations/grass-alpha.webp");

  // Store the instanced mesh reference
  const instanceRef = useRef<InstancedMesh>(null!);

  // Create controls for the base color of the grass
  useControls("Grass instances", {
    uBaseColor: {
      value: grass_options.uBaseColor,
      label: "Base Color",
      onChange: (value) => {
        (
          instanceRef.current.material as ShaderMaterial
        ).uniforms.uBaseColor.value.set(value);
      },
    },
    uTipColor: {
      value: grass_options.uTipColor,
      label: "Tip Color",
      onChange: (value) => {
        (
          instanceRef.current.material as ShaderMaterial
        ).uniforms.uTipColor.value.set(value);
      },
    },
    uWindTipColor: {
      value: grass_options.uWindTipColor,
      label: "Tip Wind Color",
      onChange: (value) => {
        (
          instanceRef.current.material as ShaderMaterial
        ).uniforms.uWindTipColor.value.set(value);
      },
    },
    uWindStrength: {
      value: grass_options.uWindStrength,
      label: "Wind Strength",
      min: 0,
      max: 5,
      step: 0.01,
      onChange: (value) => {
        (
          instanceRef.current.material as ShaderMaterial
        ).uniforms.uWindStrength.value = value;
      },
    },
    uNoiseScale: {
      value: grass_options.uNoiseScale,
      label: "Noise Scale",
      min: 0.01,
      max: 5,
      step: 0.01,
      onChange: (value) => {
        (
          instanceRef.current.material as ShaderMaterial
        ).uniforms.uNoiseScale.value = value;
      },
    },
    uMaxDistance: {
      value: grass_options.uMaxDistance,
      label: "Max Distance",
      min: 0,
      max: 1000,
      step: 1,
      onChange: (value) => {
        (
          instanceRef.current.material as ShaderMaterial
        ).uniforms.uMaxDistance.value = value;
      },
    },
    uMaxDisplacementDistance: {
      value: grass_options.uMaxDisplacementDistance,
      label: "Max Displacement Distance",
      min: 0,
      max: 500,
      step: 1,
      onChange: (value) => {
        (
          instanceRef.current.material as ShaderMaterial
        ).uniforms.uMaxDisplacementDistance.value = value;
      },
    },
  });

  // Extract the geometry from the loaded model
  const geometry = useMemo(
    () => (nodes["grass"] as Mesh).geometry.clone().scale(10, 10, 10),
    [nodes]
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

  // Create a bounding box for the grass instances for instance culling
  const bbox = useMemo(() => {
    if (!bounds) return null;

    return new Box3(bounds.min.clone(), bounds.max.clone());
  }, [bounds]);

  // Use the surface sampler to generate positions for the grass instances
  useEffect(() => {
    if (!sampler || !instanceRef.current) return;

    const transforms = Array.from({ length: count }, () => {
      const position = new Vector3();

      // Sample a position from the surface sampler
      sampler.sample(position);

      // Compute a random rotation around the Y-axis
      const rotationY = Math.random() * Math.PI * 2;

      // Apply the rotation and position to the instance
      const matrix = new Matrix4();
      matrix.makeRotationFromEuler(new Euler(0, rotationY, 0));
      matrix.setPosition(position);

      return matrix;
    });

    // Set the matrices for the instanced mesh
    transforms.forEach((matrix, index) => {
      instanceRef.current.setMatrixAt(index, matrix);
    });

    // Mark the instance matrix as needing an update
    instanceRef.current.instanceMatrix.needsUpdate = true;
  }, [sampler, count]);

  useFrame(({ camera }, delta) => {
    if (!instanceRef.current) return;

    // Update the time uniform for the shader material
    (instanceRef.current.material as ShaderMaterial).uniforms.uTime.value +=
      delta;

    // Frustrum culling for bounds
    if (!bbox || !camera) return;

    const frustrum = new Frustum();
    const projectionMatrix = new Matrix4();

    // Create the frustum from the camera's projection matrix
    projectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );

    // Set the frustrum from the projection matrix
    frustrum.setFromProjectionMatrix(projectionMatrix);

    // Check if the bounding box intersects with the frustum
    const isVisible = frustrum.intersectsBox(bbox);
    instanceRef.current.visible = isVisible;
  });

  return (
    <instancedMesh
      ref={instanceRef}
      args={[geometry, material, count]}
      receiveShadow
    />
  );
};

const Terrain: FC<{
  setSampler: (sampler: MeshSurfaceSampler | null) => void;
}> = ({ setSampler }) => {
  const { nodes } = useGLTF("/models/grassfield.glb", true);

  // Create a mesh reference to use with the sampler
  const meshRef = useRef<Mesh>(null!);

  useControls("Terrain", {
    color: {
      value: terrain_options.color,
      label: "Terrain Color",
      onChange: (value) => {
        (meshRef.current.material as MeshStandardMaterial).color = new Color(
          value
        );
      },
    },
  });

  const bounds = useMemo(() => {
    if (!meshRef.current) return null;

    // Create a bounding box for the terrain mesh
    const box = new Box3();
    box.setFromObject(meshRef.current);

    return {
      min: [box.min.x, box.min.y, box.min.z],
      max: [box.max.x, box.max.y, box.max.z],
    };
  }, []);

  // Expose the sampler to the parent component
  useEffect(() => {
    if (!meshRef.current) return;

    // Create a new MeshSurfaceSampler using the transformed mesh
    const sampler = new MeshSurfaceSampler(meshRef.current).build();

    // Set the sampler in the parent component
    setSampler(sampler);

    // Clean up the sampler when the component unmounts
    return () => setSampler(null);
  }, [setSampler]);

  return (
    <>
      <primitive object={nodes["grassfield_near"]} ref={meshRef} />
      <primitive object={nodes["grassfield_medium"]} />
      <primitive object={nodes["grassfield_far"]} />
    </>
  );
};

const Lights = () => {
  const { helper } = useControls("Lights", lights_options);

  // Create a reference for the directional light
  const directionalLightRef = useRef<DirectionalLight>(null!);

  // Use the helper to visualize the directional light
  useHelper(helper && directionalLightRef, DirectionalLightHelper, 1, "red");

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        ref={directionalLightRef}
        position={[5, 5, 5]}
        intensity={1}
        castShadow
      />
    </>
  );
};

const Index = () => {
  const [sampler, setSampler] = useState<MeshSurfaceSampler | null>(null);

  const { performance, orbit } = useControls("Performance", {
    performance: false,
    orbit: true,
  });

  return (
    <div className="w-dvw h-dvh flex bg-gradient-to-b from-blue-300 to-white">
      <Canvas shadows className="w-full h-full">
        {orbit ? (
          <OrbitControls />
        ) : (
          <PerspectiveCamera makeDefault position={[0, 2.5, 100]} fov={50} />
        )}

        <Lights />

        <Terrain setSampler={setSampler} />
        <Grass count={25_000} sampler={sampler} />

        <RoundedBox position={[0, 0.5, 0]} castShadow receiveShadow />

        {performance ? <Perf position="top-left" /> : null}
      </Canvas>
    </div>
  );
};

export const Route = createLazyFileRoute("/experiences/grassfield")({
  component: Index,
});
