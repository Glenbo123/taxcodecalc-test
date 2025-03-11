import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import path from 'path';

  export default defineConfig({
    plugins: [react()],
    server: {
      port: 3000, // Change this if needed
      hmr: {
        overlay: true,
      },
      host: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      },
    },
    clearScreen: false,
    logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
    build: {
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': ['@headlessui/react', '@heroicons/react'],
            'chart-vendor': ['recharts'],
            'i18n-vendor': ['i18next', 'react-i18next'],
            'utils': ['lodash', 'decimal.js'],
          },
        },
      },
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'i18next', 'lodash'],
      exclude: [],
    },
  });