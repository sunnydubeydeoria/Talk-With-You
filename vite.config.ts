import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: true,
      },
    },
    plugins: [
      react({
        // Enable Fast Refresh in development
        fastRefresh: isDevelopment,
        // Optimize React builds
        jsxImportSource: '@emotion/react',
      }),
      isDevelopment && componentTagger(),
    ].filter(Boolean),

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        // Add aliases for commonly used libraries for better tree shaking
        "react": path.resolve(__dirname, "./node_modules/react"),
        "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      },
    },

    build: {
      // Optimize build for production
      minify: 'terser',
      sourcemap: isDevelopment,
      cssCodeSplit: true,

      // Chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks for third-party libraries
            'vendor-react': ['react', 'react-dom'],
            'vendor-router': ['react-router-dom'],
            'vendor-ui': ['@radix-ui/react-slot', '@radix-ui/react-toast', '@radix-ui/react-avatar'],
            'vendor-query': ['@tanstack/react-query'],
            'supabase': ['@supabase/supabase-js'],
            'utils': ['date-fns', 'zod', 'clsx', 'tailwind-merge', 'lucide-react'],
          },

          // Optimize chunk naming for better caching
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `js/${facadeModuleId}-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            const extType = assetInfo.name?.split('.').pop() || '';
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name || '')) {
              return `images/[name]-[hash][extname]`;
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
              return `fonts/[name]-[hash][extname]`;
            }
            if (extType === 'css') {
              return `css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        },
      },

      // Set reasonable chunk size warning limit
      chunkSizeWarningLimit: 1000,

      // Target modern browsers for better optimization
      target: 'esnext',
    },

    optimizeDeps: {
      // Pre-bundle dependencies for faster development
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        '@supabase/supabase-js',
        'date-fns',
        'zod',
        'lucide-react',
        'clsx',
        'tailwind-merge',
        'dompurify',
        '@types/dompurify',
      ],

      // Exclude certain dependencies from pre-bundling if needed
      exclude: [],
    },

    define: {
      // Environment variables
      __DEV__: isDevelopment,
      __PROD__: isProduction,
    },

    // CSS optimizations
    css: {
      devSourcemap: isDevelopment,
      postcss: {
        plugins: isProduction ? [
          // Add any PostCSS plugins for production optimization
          require('autoprefixer'),
          require('cssnano')({
            preset: 'default',
          }),
        ] : [require('autoprefixer')],
      },
    },

    // Preview server configuration for production testing
    preview: {
      port: 4173,
      host: true,
    },

    // Experimental features for better performance
    experimental: {
      renderBuiltUrl(filename: string, { hostType }: { hostType: string }) {
        if (hostType === 'js') {
          return { js: `/${filename}` };
        } else {
          return { relative: true };
        }
      },
    },

    // Environment specific configurations
    ...(isProduction && {
      // Production specific optimizations
      esbuild: {
        // Drop console and debugger in production
        drop: ['console', 'debugger'],
        // Minify identifiers
        minifyIdentifiers: true,
        // Minify syntax
        minifySyntax: true,
        // Minify whitespace
        minifyWhitespace: true,
      },
    }),

    ...(isDevelopment && {
      // Development specific configurations
      define: {
        // Enable React DevTools in development
        __REACT_DEVTOOLS_GLOBAL_HOOK__: 'true',
      },
    }),
  };
});
