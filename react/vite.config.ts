import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' lets the build work on GitHub Pages under any repo name
export default defineConfig({ base: './', plugins: [react()] });
