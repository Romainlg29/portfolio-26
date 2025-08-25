import { useEffect } from "react";

export const useDeviceOrientationPermission = () => {
  return useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined = undefined;

    // Request permission for device orientation
    const request = () => {
      // Typing is incorrect
      type DeviceOrientationEventWithPermission =
        typeof DeviceOrientationEvent & {
          requestPermission: () => Promise<void>;
        };

      if (
        window.DeviceOrientationEvent &&
        typeof (
          window.DeviceOrientationEvent as DeviceOrientationEventWithPermission
        ).requestPermission === "function"
      ) {
        (
          window.DeviceOrientationEvent as DeviceOrientationEventWithPermission
        ).requestPermission();
      }
    };

    const onVisibility = () => {
      // If the user has interacted with the page, ask for permission
      if (navigator.userActivation.hasBeenActive) {
        request();
        return;
      }

      // Check every seconds it the user has interacted with the page to ask the permission
      if (!navigator.userActivation.hasBeenActive) {
        interval = setInterval(() => {
          if (document.hidden) {
            return;
          }

          if (!navigator.userActivation.hasBeenActive) {
            return;
          }

          request();

          clearInterval(interval);
        }, 1000);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    // Run once on start to trigger the interval
    onVisibility();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);

      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);
};
