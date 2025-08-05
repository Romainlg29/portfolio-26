import { OrbitControls, useHelper, useTexture } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useControls } from "leva";
import { useMemo, useRef, type FC } from "react";
import {
  BufferAttribute,
  Color,
  DirectionalLight,
  DirectionalLightHelper,
  DoubleSide,
  MeshToonMaterial,
  PlaneGeometry,
  Spherical,
  Vector2,
  Vector3,
} from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import { Perf } from "r3f-perf";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import fragment from "@/components/shaders/csm/vegetation/bush-fragment-csm.glsl?raw";
import vertex from "@/components/shaders/csm/vegetation/bush-vertex-csm.glsl?raw";

const lights_options = {
  helper: false,
};

const Bush: FC = () => {
  const alpha = useTexture("/textures/vegetations/bush-alpha.webp");

  // Create a custom geometry for the bush
  // https://www.youtube.com/watch?v=cesPK0kYkyE&ab_channel=BrunoSimon
  const geometry = useMemo(() => {
    const count = 200;
    const planes = [];

    for (let i = 0; i < count; i++) {
      // Create a plane geometry for each bush instance
      const plane = new PlaneGeometry(1, 1);

      // Create a random position for the plane
      const spherical = new Spherical(
        1 - Math.pow(Math.random(), 3),
        Math.PI * 2 * Math.random(),
        Math.PI * Math.random()
      );

      // Compute the position from spherical coordinates
      const position = new Vector3().setFromSpherical(spherical);

      // Rotate the plane randomly
      plane.rotateX(Math.random() * 1000);
      plane.rotateY(Math.random() * 1000);
      plane.rotateZ(Math.random() * 1000);

      // Set the position of the plane
      plane.translate(position.x, position.y, position.z);

      // Make the normal facing outward
      const normal = position.clone().normalize();
      const narr = new Float32Array(12);

      // Set the normal for each vertex of the plane
      for (let j = 0; j < 4; j++) {
        const j3 = j * 3;

        const position = new Vector3(
          plane.attributes.position.array[j3],
          plane.attributes.position.array[j3 + 1],
          plane.attributes.position.array[j3 + 2]
        );

        // Mix the position with the normal to create a more natural look
        const mixed = position.lerp(normal, 0.4);

        narr[j3] = mixed.x;
        narr[j3 + 1] = mixed.y;
        narr[j3 + 2] = mixed.z;
      }

      // Set the normal attribute
      plane.setAttribute("normal", new BufferAttribute(narr, 3));

      // Add the plane to the array
      planes.push(plane);
    }

    // Merge all the plane geometries into one
    return mergeGeometries(planes);
  }, []);

  // Create a custom shader material for the bush
  const material = useMemo(() => {
    // Do not flip the alpha texture
    alpha.flipY = false;

    return new CustomShaderMaterial({
      baseMaterial: MeshToonMaterial,
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uInsideColor: { value: new Color("#4CAF50") },
        uOutsideColor: { value: new Color("#2E7D32") },
        uTime: { value: 0 },
        uWindDirection: { value: new Vector2(1, 0) },
        uWindStrength: { value: 0.2 },
      },
      alphaMap: alpha,
      transparent: true,
      alphaTest: 0.8,
      side: DoubleSide,
    });
  }, [alpha]);

  useFrame((_, delta) => {
    // Update the time uniform for the shader
    if (material.uniforms.uTime) {
      material.uniforms.uTime.value += delta;
    }
  });

  return <mesh geometry={geometry} material={material} />;
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
  const { performance } = useControls("Performance", {
    performance: false,
  });

  return (
    <div className="w-dvw h-dvh flex bg-gradient-to-b from-blue-300 to-white">
      <Canvas shadows className="w-full h-full">
        <OrbitControls />

        <Lights />

        <Bush />

        {performance ? <Perf position="top-left" /> : null}
      </Canvas>
    </div>
  );
};

export const Route = createLazyFileRoute("/experiences/bush")({
  component: Index,
});
