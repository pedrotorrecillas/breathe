import type { GlobalProvider } from "@ladle/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

import "@/app/globals.css";

export const Provider: GlobalProvider = ({ children }) => {
  return (
    <AppRouterContext.Provider
      value={{
        back: () => {},
        forward: () => {},
        prefetch: async () => {},
        push: () => {},
        refresh: () => {},
        replace: () => {},
      }}
    >
      <div className="brand-stage bg-background text-foreground min-h-screen">
        {children}
      </div>
    </AppRouterContext.Provider>
  );
};
