import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default [{
  input: 'src/kernel32.ts',
  output: {
    dir: 'dist',
    format: 'cjs',
    name: 'kernel32',
    sourcemap: true,
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: 'tsconfig.json',
    }),
  ],

  external: ['ntos-sdk', 'ntdll']
},
{
  input: ['src/kernel32.ts'],
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

  external: ['ntos-sdk', 'ntdll']
},
{
  input: ['src/types/kernel32.int.types.ts'],
  output: {
    file: 'dist/kernel32.int.js',
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

  external: ['ntos-sdk', 'ntdll']
},
{
  input: 'src/types/kernel32.int.types.ts',
  output: {
    file: 'dist/kernel32.int.d.ts',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true
  },
  plugins: [
    resolve(),
    commonjs(),
    dts()
  ],

  external: ['ntos-sdk', 'ntdll']
}
];

