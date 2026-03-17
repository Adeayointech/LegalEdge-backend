import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Manually inject VITE_ prefixed env vars into process.env
  // so Vite can expose them via import.meta.env
  Object.keys(env).forEach((key) => {
    if (key.startsWith('VITE_')) {
      process.env[key] = env[key];
    }
  });
  
  console.log('🔍 Vite build mode:', mode);
  console.log('🔍 VITE_API_URL from loadEnv:', env.VITE_API_URL);
  console.log('🔍 process.env.VITE_API_URL after injection:', process.env.VITE_API_URL);
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});
