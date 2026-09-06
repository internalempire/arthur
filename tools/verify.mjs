// One mandatory verification path for pull requests and the published commit.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
function run(command, args) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
function modules(directory) {
  return readdirSync(new URL(`../${directory}/`, import.meta.url), { withFileTypes: true })
    .flatMap(entry => entry.isDirectory() ? modules(`${directory}/${entry.name}`)
      : /\.m?js$/.test(entry.name) ? [`${directory}/${entry.name}`] : []);
}
for (const path of ['src', 'tests', 'tools'].flatMap(modules)) run(process.execPath, ['--check', path]);
for (const args of [
  ['tests/verification.test.mjs'], ['tests/ui-smoke.mjs'], ['tests/audit.mjs'],
  ['tests/run.mjs'], ['manual/tools/examples.mjs', '--check'],
  ['manual/tools/build.mjs'], ['manual/tools/lint.mjs'],
]) run(process.execPath, args);
run('git', ['diff', 'HEAD', '--exit-code']);
