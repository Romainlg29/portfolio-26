import { keyframes, type Keyframe } from "@/lib/constants";
import { useFrame } from "@react-three/fiber";
import { useState, useRef } from "react";
import { Color } from "three";

// Duration of each keyframe in seconds
const duration = 60;

const lerp = (a: number, b: number, t: number) => {
  // Linear interpolation between a and b
  return a + (b - a) * t;
};

const lerpColor = (a: string, b: string, t: number) => {
  // Create Color objects from input strings
  const colorA = new Color(a);
  const colorB = new Color(b);

  // Interpolate between the two colors
  colorA.lerp(colorB, t);

  // Return as CSS color string
  return colorA.getStyle();
};

const getKeyframeIndices = (
  elapsed: number,
  duration: number,
  keyframesLength: number
) => {
  // Total duration of the full cycle
  const total = keyframesLength * duration;

  // Time within the current cycle
  const time = elapsed % total;

  // Current keyframe index
  const idx = Math.floor(time / duration);

  // Next keyframe index (wraps around)
  const nextIdx = (idx + 1) % keyframesLength;

  // Interpolation factor between current and next keyframe
  const t = (time % duration) / duration;

  return { idx, nextIdx, t };
};

const interpolateKeyframes = (
  a: Keyframe,
  b: Keyframe,
  t: number
): Keyframe => {
  const k = {
    ambientLight: {
      color: lerpColor(a.ambientLight.color, b.ambientLight.color, t),
      intensity: lerp(a.ambientLight.intensity, b.ambientLight.intensity, t),
    },
    directionalLight: {
      color: lerpColor(a.directionalLight.color, b.directionalLight.color, t),
      intensity: lerp(
        a.directionalLight.intensity,
        b.directionalLight.intensity,
        t
      ),
    },
    clouds: {
      brightness: lerp(a.clouds.brightness, b.clouds.brightness, t),
    },
    mountains: {
      brightness: lerp(a.mountains.brightness, b.mountains.brightness, t),
    },
    sky: {
      color: lerpColor(a.sky.color, b.sky.color, t),
    },
  };

  // Update the sky css var
  document.documentElement.style.setProperty(
    "--color-sky-background",
    k.sky.color
  );

  return k;
};

export const useKeyframes = () => {
  const [state, setState] = useState<Keyframe>(keyframes[0]);
  const last = useRef<Keyframe>(keyframes[0]);

  useFrame(({ clock }) => {
    // Get the elapsed time
    const elapsed = clock.getElapsedTime();

    // Determine which keyframes to interpolate between and the interpolation factor
    const { idx, nextIdx, t } = getKeyframeIndices(
      elapsed,
      duration,
      keyframes.length
    );

    // Get the two keyframes
    const kfA = keyframes[idx];
    const kfB = keyframes[nextIdx];

    // Interpolate all properties between the two keyframes
    const lerped = interpolateKeyframes(kfA, kfB, t);

    // Only update state if the keyframe has changed
    setState(lerped);
    last.current = lerped;
  });

  return state;
};
