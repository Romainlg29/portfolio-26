import { useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type FC } from "react";
import { PointsMaterial, type BufferGeometry, type Points } from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import vertex from "@/components/shaders/csm/particles/particles-vertex-csm.glsl?raw";
import fragment from "@/components/shaders/csm/particles/particles-fragment-csm.glsl?raw";
import { useFrame } from "@react-three/fiber";

type SimpleParticlesProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];

  // Number of particles to create
  count: number;

  // Path to the texture for the particles
  texture: string;

  // Optional limits for particle positions
  limit?: [number, number, number];
};

const SimpleParticles: FC<SimpleParticlesProps> = ({
  position,
  rotation,
  count,
  texture,
  limit,
}) => {
  const POINTS = useMemo(() => count || 50, [count]);
  const POINTS_PER_TEXTURE = useMemo(() => Math.floor(POINTS / 3), [POINTS]);

  // Textures
  const colorMap = useTexture(texture, (t) => {
    t.flipY = false;
  });

  // Refs
  const [positions, setPositions] = useState<Float32Array>(
    new Float32Array(POINTS_PER_TEXTURE * 3)
  );
  const [rotations, setRotations] = useState<Float32Array>(
    new Float32Array(POINTS_PER_TEXTURE)
  );

  const [_, setOriginalPositions] = useState<Float32Array | null>(null);

  const geometry = useRef<BufferGeometry | null>(null);
  const points = useRef<Points | null>(null);

  useEffect(() => {
    if (!points.current || !geometry.current) return;

    // Create the custom material
    const material = new CustomShaderMaterial({
      baseMaterial: PointsMaterial,
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTime: { value: 0 },
        uColorMap: { value: colorMap },
      },
      alphaTest: 0.5,
      transparent: true,
      sizeAttenuation: true,
      size: 0.5,
    });

    // Apply
    points.current!.material = material;

    // Initialize positions and rotations
    const MIN_DISTANCE_FROM_CENTER = 5; // Minimum distance from the center

    // Initialize the positions array
    const arr = new Float32Array(3 * POINTS_PER_TEXTURE);

    // Generate random positions for the particles within the bounding box
    const limits = limit || [1, 1, 1]; // Default limits if not provided
    for (let i = 0; i < POINTS_PER_TEXTURE; i++) {
      let x, y, z;

      do {
        x = (Math.random() - 0.5) * limits[0];
        y = (Math.random() - 0.5) * limits[1];
        z = (Math.random() - 0.5) * limits[2];
      } while (Math.sqrt(x * x + y * y + z * z) < MIN_DISTANCE_FROM_CENTER);

      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }

    // Store original positions
    setOriginalPositions(new Float32Array(arr));
    setPositions(arr);

    // Initialize the rotations array
    const rotationsArr = new Float32Array(POINTS_PER_TEXTURE);

    for (let i = 0; i < POINTS_PER_TEXTURE; i++) {
      rotationsArr[i] = Math.random() * Math.PI * 2; // Random rotation around Y-axis
    }

    setRotations(rotationsArr);
  }, [colorMap, POINTS_PER_TEXTURE, limit]);

  // Animate the particles
  useFrame((_, delta) => {
    if (!points.current) return;

    (points.current.material as CustomShaderMaterial).uniforms.uTime.value +=
      delta / 3;
  });

  return (
    <points
      position={position || [0, 0, 0]}
      rotation={rotation || [0, 0, 0]}
      ref={points}
    >
      <bufferGeometry ref={geometry}>
        {/* @ts-expect-error ts error */}
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={POINTS_PER_TEXTURE}
          itemSize={3}
        />
        {/* @ts-expect-error ts error */}
        <bufferAttribute
          attach="attributes-rotation"
          array={rotations}
          count={POINTS_PER_TEXTURE}
          itemSize={1}
        />
      </bufferGeometry>
    </points>
  );
};

export default SimpleParticles;
