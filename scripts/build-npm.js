import commonjs            from '@rollup/plugin-commonjs';
import resolve             from '@rollup/plugin-node-resolve';
import typescript          from '@rollup/plugin-typescript';
import { generateDTS }     from '@typhonjs-build-test/esm-d-ts';
import { importsLocal }    from '@typhonjs-build-test/rollup-plugin-pkg-imports';

// Produce sourcemaps or not.
const s_SOURCEMAP = false;

const s_DTS_OPTIONS = { tsconfig: './tsconfig.json' };

const s_EXTERNAL = [/csv-/g, 'node:stream', 'sade', /@typhonjs*/g];

// These bundles are for the Node distribution.
export default () =>
{
   return [
      {
         input: 'src/index.ts',
         external: s_EXTERNAL,
         output: [{
            file: `./dist-npm/index.js`,
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap: s_SOURCEMAP,
         }],
         plugins: [
            importsLocal(),
            resolve(),
            typescript({ include: ['src/*.ts'] }),
            generateDTS.plugin(s_DTS_OPTIONS)
         ]
      },
      {
         input: 'src/cli/index.ts',
         external: s_EXTERNAL,
         output: [{
            file: `./dist-npm/cli/index.js`,
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap: s_SOURCEMAP,
         }],
         plugins: [
            importsLocal(),
            resolve(),
            typescript({ include: ['src/cli/**/*'] }),
            generateDTS.plugin(s_DTS_OPTIONS)
         ]
      },
      {
         input: 'src/commands/index.ts',
         external: s_EXTERNAL,
         output: [{
            file: `./dist-npm/commands/index.js`,
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap: s_SOURCEMAP,
         }],
         plugins: [
            importsLocal(),
            resolve(),
            typescript({ include: ['src/commands/**/*'] }),
            generateDTS.plugin(s_DTS_OPTIONS)
         ]
      },
      {
         input: 'src/data/db/index.ts',
         external: s_EXTERNAL,
         output: [{
            file: `./dist-npm/data/db/index.js`,
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap: s_SOURCEMAP,
         }],
         plugins: [
            importsLocal(),
            resolve({ preferBuiltins: true }),
            commonjs(),
            typescript({ include: ['src/data/db/**/*'] }),
            generateDTS.plugin(s_DTS_OPTIONS)
         ]
      },
      {
         input: 'src/data/export/excel/index.ts',
         external: s_EXTERNAL,
         output: [{
            file: `./dist-npm/data/export/excel/index.js`,
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap: s_SOURCEMAP,
         }],
         plugins: [
            importsLocal(),
            resolve({ preferBuiltins: true }),
            commonjs({
               strictRequires: true,
               transformMixedEsModules: true
            }),
            typescript({ include: ['src/data/export/excel/**/*'] }),
            generateDTS.plugin(s_DTS_OPTIONS)
         ],
         treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false,
            tryCatchDeoptimization: false
         }
      },
      {
         input: 'src/data/export/llm/index.ts',
         external: s_EXTERNAL,
         output: [{
            file: `./dist-npm/data/export/llm/index.js`,
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap: s_SOURCEMAP,
         }],
         plugins: [
            importsLocal(),
            resolve(),
            typescript({ include: ['src/data/export/llm/**/*'] }),
            generateDTS.plugin(s_DTS_OPTIONS)
         ]
      },
      {
         input: 'src/data/import/index.ts',
         external: s_EXTERNAL,
         output: [{
            file: `./dist-npm/data/import/index.js`,
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap: s_SOURCEMAP,
         }],
         plugins: [
            importsLocal(),
            resolve(),
            typescript({ include: ['src/data/import/**/*'] }),
            generateDTS.plugin(s_DTS_OPTIONS)
         ]
      },
      {
         input: 'src/data/sort/index.ts',
         external: s_EXTERNAL,
         output: [{
            file: `./dist-npm/data/sort/index.js`,
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap: s_SOURCEMAP,
         }],
         plugins: [
            importsLocal(),
            resolve(),
            typescript({ include: ['src/data/sort/**/*'] }),
            generateDTS.plugin(s_DTS_OPTIONS)
         ]
      },
      {
         input: 'src/util/index.ts',
         external: s_EXTERNAL,
         output: [{
            file: `./dist-npm/util/index.js`,
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap: s_SOURCEMAP,
         }],
         plugins: [
            importsLocal(),
            resolve(),
            typescript({ include: ['src/util/**/*'] }),
            generateDTS.plugin(s_DTS_OPTIONS)
         ]
      }
   ];
};
