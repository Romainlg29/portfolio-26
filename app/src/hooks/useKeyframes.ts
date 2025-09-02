import { keyframes, type Keyframe } from "@/lib/constants";
import { useFrame } from "@react-three/fiber";
import { useState, useRef } from "react";
import { Color } from "three";

// Duration of each keyframe in seconds
const duration = 20;

const lerp = (a: number, b: number, t: number) => {
  // Linear interpolation between a and b
  return a + (b - a) * t;
};

const lerpColor = (a: string, b: string, t: number) => {
  // Fallback: linear RGB interpolation using three.js
  const colorA = new Color(a);
  const colorB = new Color(b);
  colorA.lerp(colorB, t);
  return colorA.getStyle();
};

// TODO: Use https://culorijs.org/ instead
// Minimal oklch parser: accepts oklch(l c h) or oklch(l c h / a)
function parseOklch(str: string) {
  // Remove 'oklch(' and ')' and split
  const match = str.match(/oklch\(([^)]+)\)/);
  if (!match) throw new Error("Invalid oklch string: " + str);
  const parts = match[1].split("/")[0].trim().split(/\s+/);
  return {
    l: parseFloat(parts[0]),
    c: parseFloat(parts[1]),
    h: parseFloat(parts[2]),
  };
}

function formatOklch({ l, c, h }: { l: number; c: number; h: number }) {
  // Clamp values for safety
  l = Math.max(0, Math.min(1, l));
  c = Math.max(0, c);
  // h can wrap
  return `oklch(${l} ${c} ${h})`;
}

function lerpOklch(a: string, b: string, t: number) {
  const ca = parseOklch(a);
  const cb = parseOklch(b);
  // Interpolate l, c, h (hue wraps around 360)
  const l = lerp(ca.l, cb.l, t);
  const c = lerp(ca.c, cb.c, t);
  let dh = cb.h - ca.h;
  if (Math.abs(dh) > 180) dh -= Math.sign(dh) * 360;
  const h = (ca.h + dh * t + 360) % 360;
  return formatOklch({ l, c, h });
}

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
      color:
        a.sky.color.startsWith("oklch") && b.sky.color.startsWith("oklch")
          ? lerpOklch(a.sky.color, b.sky.color, t)
          : lerpColor(a.sky.color, b.sky.color, t),
    },
    tent: {
      emissiveIntensity: lerp(a.tent.emissiveIntensity, b.tent.emissiveIntensity, t),
    }
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
