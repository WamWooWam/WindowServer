import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import rewriteImports from '../../build/rewrite-imports.mjs';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/notepad.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
    sourcemap: true,
    inlineDynamicImports: true
  },
  plugins: [
    rewriteImports(),
    resolve(),
    commonjs(),
    typescript({
      tsconfig: 'tsconfig.json',
    }),
  ],
  external: ['ntos-sdk', 'ntdll', 'user32', 'kernel32', 'gdi32']
};
