import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div className="w-dvw h-dvh flex flex-col overflow-hidden">
      <Outlet />
    </div>
  ),
});
