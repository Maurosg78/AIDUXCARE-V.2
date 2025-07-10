import { defineConfig, ConfigEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv) => ({
  plugins: [
    [react()],
    [basicSsl()]
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    },
    copyPublicDir: true
  },
  server: {
    https: {
      key: './localhost-key.pem',
      cert: './localhost.pem'
    },
    host: 'localhost',
    port: 5174
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  }
}));
