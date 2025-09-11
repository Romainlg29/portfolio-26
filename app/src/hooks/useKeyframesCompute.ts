import { lerpColor, lerpOklch } from "@/lib/colors";
import {
  KEYFRAME_HOLD_DURATION,
  KEYFRAME_TRANSITION_DURATION,
} from "@/lib/constants";
import { lerp } from "@/lib/math";
import { useKeyframeStore, type Keyframe } from "@/stores/useKeyframesStore";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useAnalytics } from "./useAnalytics";

const getKeyframeIndices = (
  elapsed: number,
  transitionDuration: number,
  keyframeDuration: number,
  keyframesLength: number
) => {
  // Total duration per keyframe cycle (transition + hold)
  const cycleDuration = transitionDuration + keyframeDuration;

  // Total duration of the full cycle
  const total = keyframesLength * cycleDuration;

  // Time within the current cycle
  const time = elapsed % total;

  // Current keyframe index
  const idx = Math.floor(time / cycleDuration);

  // Next keyframe index (wraps around)
  const nextIdx = (idx + 1) % keyframesLength;

  // Time within the current keyframe cycle
  const cycleTime = time % cycleDuration;

  // Interpolation factor between current and next keyframe
  let t: number;
  if (cycleTime <= keyframeDuration) {
    // We're in the hold phase - stay at current keyframe
    t = 0;
  } else {
    // We're in the transition phase - interpolate to next keyframe
    const transitionTime = cycleTime - keyframeDuration;
    t = transitionTime / transitionDuration;
  }

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
      color:
        a.sky.color.startsWith("oklch") && b.sky.color.startsWith("oklch")
          ? lerpOklch(a.sky.color, b.sky.color, t)
          : lerpColor(a.sky.color, b.sky.color, t),
    },
    tent: {
      emissiveIntensity: lerp(
        a.tent.emissiveIntensity,
        b.tent.emissiveIntensity,
        t
      ),
    },
  };

  // Update the sky css var
  document.documentElement.style.setProperty(
    "--color-sky-background",
    k.sky.color
  );

  return k;
};

export const useKeyframesCompute = () => {
  const [state, setState, frames] = useKeyframeStore((s) => [
    s.frame,
    s.setFrame,
    s.keyframes,
  ]);

  const analytics = useAnalytics();

  const last = useRef<Keyframe>(state);
  const lastIdx = useRef<number>(-1);

  useFrame(({ clock }) => {
    // Get the elapsed time
    const elapsed = clock.getElapsedTime();

    // Determine which keyframes to interpolate between and the interpolation factor
    const { idx, nextIdx, t } = getKeyframeIndices(
      elapsed,
      KEYFRAME_TRANSITION_DURATION,
      KEYFRAME_HOLD_DURATION,
      frames.length
    );

    // Check if we've completed a cycle (moved from last keyframe back to first)
    if (lastIdx.current === frames.length - 1 && idx === 0) {
      // Count a completed day cycle
      analytics.event("day-cycle-complete", {
        category: "environment",
        label: "Day cycle",
      });
    }

    lastIdx.current = idx;

    // Get the two keyframes
    const kfA = frames[idx];
    const kfB = frames[nextIdx];

    // Interpolate all properties between the two keyframes
    const lerped = interpolateKeyframes(kfA, kfB, t);

    // Only update state if the keyframe has changed
    setState(lerped);
    last.current = lerped;
  });

  return state;
};
