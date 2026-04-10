import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Force a single instance of Three.js and R3F.
    // mind-ar bundles its own copy of Three.js internally; without this,
    // two separate Three.js instances end up in the page and R3F hooks
    // throw "Hooks can only be used within the Canvas component!".
    dedupe: ['three', '@react-three/fiber'],
  },
  server: {
    host: true,
  },
});
