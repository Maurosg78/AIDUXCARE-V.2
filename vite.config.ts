import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const enableFirebase = env.AIDUX_ENABLE_FIREBASE === "1";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@/integrations/firebase": path.resolve(
          __dirname,
          enableFirebase
            ? "src/integrations/firebase/real.ts"
            : "src/integrations/firebase/stub.ts"
        ),
      },
    },
  };
});
