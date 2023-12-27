import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default [{
  input: 'src/ntdll.ts',
  output: {
    dir: 'dist',
    format: 'iife',
    sourcemap: true,
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: 'tsconfig.json',
    }),
  ],

  external: ['ntos-sdk']
},
{
  input: ['src/ntdll.ts'],
  output: {
    dir: 'dist',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    resolve(),
    commonjs(),
    dts()
  ],

  external: ['ntos-sdk']
},
{
  input: ['src/types/ntdll.int.types.ts'],
  output: {
    file: 'dist/ntdll.int.js',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: 'tsconfig.json',
    }),
  ],

  external: ['ntos-sdk']
},
{
  input: 'src/types/ntdll.int.types.ts',
  output: {
    file: 'dist/ntdll.int.d.ts',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true
  },
  plugins: [
    resolve(),
    commonjs(),
    dts()
  ],

  external: ['ntos-sdk']
}
];

