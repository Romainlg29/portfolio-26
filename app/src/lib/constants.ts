import type { Keyframe } from "@/stores/useKeyframesStore";

// Transition duration of each keyframe in seconds
export const KEYFRAME_TRANSITION_DURATION = 20;

// Duration to hold each keyframe in seconds
export const KEYFRAME_HOLD_DURATION = 20;

export const DAY_KEYFRAME: Keyframe = {
  ambientLight: {
    color: "#FFFFFF",
    intensity: 0.5,
  },
  directionalLight: {
    color: "#FFFFFF",
    intensity: 5.0,
  },
  clouds: {
    brightness: 1,
  },
  mountains: {
    brightness: 1,
  },
  sky: {
    color: "oklch(0.63 0.10 230)",
  },
  tent: {
    emissiveIntensity: 0,
  },
};

export const NIGHT_KEYFRAME: Keyframe = {
  ambientLight: {
    color: "#335577",
    intensity: 0.2,
  },
  directionalLight: {
    color: "#6CA0DC",
    intensity: 1,
  },
  clouds: {
    brightness: 0.05,
  },
  mountains: {
    brightness: 0.05,
  },
  sky: {
    color: "oklch(0.26 0.09 281)",
  },
  tent: {
    emissiveIntensity: 1.5,
  },
};
