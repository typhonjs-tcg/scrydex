import resolve             from '@rollup/plugin-node-resolve';
import typescript          from '@rollup/plugin-typescript';
import { generateDTS }     from '@typhonjs-build-test/esm-d-ts';
import { importsLocal }    from '@typhonjs-build-test/rollup-plugin-pkg-imports';

// Produce sourcemaps or not.
const s_SOURCEMAP = true;

const s_DTS_OPTIONS = { tsconfig: './tsconfig.json' };

const s_IMPORTS_OPTIONS = { importKeys: ['#scrydex/*'] };

const s_EXTERNAL = [/csv-/g, 'exceljs', 'sade', /stream-/g, /@typhonjs*/g];

// These bundles are for the Node distribution.
export default () =>
{
   return [
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
            importsLocal(s_IMPORTS_OPTIONS),
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
            importsLocal(s_IMPORTS_OPTIONS),
            resolve(),
            typescript({ include: ['src/commands/**/*'] }),
            generateDTS.plugin(s_DTS_OPTIONS)
         ]
      },
      {
         input: 'src/data/index.ts',
         external: s_EXTERNAL,
         output: [{
            file: `./dist-npm/data/index.js`,
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap: s_SOURCEMAP,
         }],
         plugins: [
            importsLocal(s_IMPORTS_OPTIONS),
            resolve(),
            typescript({ include: ['src/data/**/*'] }),
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
            importsLocal(s_IMPORTS_OPTIONS),
            resolve(),
            typescript({ include: ['src/data/import/**/*'] }),
            generateDTS.plugin(s_DTS_OPTIONS)
         ]
      },
      {
         input: 'src/data/scryfall/index.ts',
         external: s_EXTERNAL,
         output: [{
            file: `./dist-npm/data/scryfall/index.js`,
            format: 'es',
            generatedCode: { constBindings: true },
            sourcemap: s_SOURCEMAP,
         }],
         plugins: [
            importsLocal(s_IMPORTS_OPTIONS),
            resolve(),
            typescript({ include: ['src/data/scryfall/**/*'] }),
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
            importsLocal(s_IMPORTS_OPTIONS),
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
            importsLocal(s_IMPORTS_OPTIONS),
            resolve(),
            typescript({ include: ['src/util/**/*'] }),
            generateDTS.plugin(s_DTS_OPTIONS)
         ]
      }
   ];
};
