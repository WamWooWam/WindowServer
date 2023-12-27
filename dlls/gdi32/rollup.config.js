import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default [{
  input: 'src/gdi32.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
    sourcemap: true,
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: 'tsconfig.json',
    }),
  ],

  external: ['ntos-sdk', 'ntdll', 'kernel32']
},
{
  input: ['src/gdi32.ts'],
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

  external: ['ntos-sdk', 'ntdll', 'kernel32']
},
{
  input: ['src/types/gdi32.int.types.ts'],
  output: {
    file: 'dist/gdi32.int.js',
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

  external: ['ntos-sdk', 'ntdll', 'kernel32']
},
{
  input: 'src/types/gdi32.int.types.ts',
  output: {
    file: 'dist/gdi32.int.d.ts',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true
  },
  plugins: [
    resolve(),
    commonjs(),
    dts()
  ],

  external: ['ntos-sdk', 'ntdll', 'kernel32']
}
];

