import { useMemo } from "react";

export const useAnalytics = () => useMemo(() => window.rybbit, []);
