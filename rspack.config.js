import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from '@rspack/cli';

// Create equivalents for __dirname and __filename in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  entry: {
    index: './src/index.ts',
    // Add direct exports for tree shaking
    hashRouter: './src/core/hashRouter.ts',
    hashNavigation: './src/core/hashNavigation.ts',
    ClientRouter: './src/react/ClientRouter.tsx',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: {
      type: 'module',
    },
    clean: true,
  },
  experiments: {
    outputModule: true,
  },
  target: ['web', 'es2020'],
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
              },
              target: 'es2020',
            },
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  externals: [
    '@preact/signals', 
    '@preact/signals-react', 
    '@preact/signals-react/runtime', 
    'react', 
    'react-dom'
  ],
});
