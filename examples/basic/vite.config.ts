import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // mind-ar bundles its own Three.js — dedupe forces a single instance
    // so R3F hooks work correctly.
    dedupe: ['three', '@react-three/fiber'],
  },
  server: {
    host: true,
  },
});
