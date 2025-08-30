export type Keyframe = {
  ambientLight: {
    color: string;
    intensity: number;
  };

  directionalLight: {
    color: string;
    intensity: number;
  };

  clouds: {
    brightness: number;
  };

  mountains: {
    brightness: number;
  };

  sky: {
    color: string;
  };
};

export const keyframes: Keyframe[] = [
  // Mid-day
  {
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
      color: "oklch(0.83 0.10 230)",
    },
  },
  // Sunset
  {
    ambientLight: {
      color: "#FFD1A1",
      intensity: 0.38,
    },
    directionalLight: {
      color: "#FF8C42",
      intensity: 2.0,
    },
    clouds: {
      brightness: 0.4,
    },
    mountains: {
      brightness: 0.4,
    },
    sky: {
      color: "oklch(0.72 0.17 13)",
    },
  },
  // Night
  {
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
  },
  // Sunrise
  {
    ambientLight: {
      color: "#FFE4B2",
      intensity: 0.45,
    },
    directionalLight: {
      color: "#FFD580",
      intensity: 2.5,
    },
    clouds: {
      brightness: 0.4,
    },
    mountains: {
      brightness: 0.4,
    },
    sky: {
      color: "oklch(0.42 0.18 266)",
    },
  },
];
