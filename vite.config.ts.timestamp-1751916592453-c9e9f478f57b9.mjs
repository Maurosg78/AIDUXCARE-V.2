// vite.config.ts
import { defineConfig } from "file:///Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2/node_modules/vite/dist/node/index.js";
import react from "file:///Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import tailwindcss from "file:///Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2/node_modules/tailwindcss/lib/index.js";
import autoprefixer from "file:///Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2/node_modules/autoprefixer/lib/autoprefixer.js";
var __vite_injected_original_dirname = "/Users/mauriciosobarzo/Desktop/AIDUXCARE-V.2";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  // Configuración del servidor de desarrollo
  server: {
    port: 5174,
    host: "0.0.0.0",
    strictPort: true
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer
      ]
    }
  },
  // Optimización del build
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1e3,
    minify: "esbuild",
    target: "esnext"
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbWF1cmljaW9zb2JhcnpvL0Rlc2t0b3AvQUlEVVhDQVJFLVYuMlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL21hdXJpY2lvc29iYXJ6by9EZXNrdG9wL0FJRFVYQ0FSRS1WLjIvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL21hdXJpY2lvc29iYXJ6by9EZXNrdG9wL0FJRFVYQ0FSRS1WLjIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAndGFpbHdpbmRjc3MnO1xuaW1wb3J0IGF1dG9wcmVmaXhlciBmcm9tICdhdXRvcHJlZml4ZXInO1xuXG4vLyBDb25maWd1cmFjaVx1MDBGM24gc2ltcGxpZmljYWRhIGRlIFZpdGUgcGFyYSBQaG9lbml4IE1WUFxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIC8vIENvbmZpZ3VyYWNpXHUwMEYzbiBkZWwgc2Vydmlkb3IgZGUgZGVzYXJyb2xsb1xuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTc0LFxuICAgIGhvc3Q6ICcwLjAuMC4wJyxcbiAgICBzdHJpY3RQb3J0OiB0cnVlLFxuICB9LFxuICBjc3M6IHtcbiAgICBwb3N0Y3NzOiB7XG4gICAgICBwbHVnaW5zOiBbXG4gICAgICAgIHRhaWx3aW5kY3NzLFxuICAgICAgICBhdXRvcHJlZml4ZXIsXG4gICAgICBdXG4gICAgfVxuICB9LFxuICAvLyBPcHRpbWl6YWNpXHUwMEYzbiBkZWwgYnVpbGRcbiAgYnVpbGQ6IHtcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcbiAgICBtaW5pZnk6ICdlc2J1aWxkJyxcbiAgICB0YXJnZXQ6ICdlc25leHQnXG4gIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFzVCxTQUFTLG9CQUFvQjtBQUNuVixPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sa0JBQWtCO0FBSnpCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUVBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxFQUNkO0FBQUEsRUFDQSxLQUFLO0FBQUEsSUFDSCxTQUFTO0FBQUEsTUFDUCxTQUFTO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBRUEsT0FBTztBQUFBLElBQ0wsV0FBVztBQUFBLElBQ1gsdUJBQXVCO0FBQUEsSUFDdkIsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLEVBQ1Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
