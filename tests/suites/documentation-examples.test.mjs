// Numerical examples in prose are executable contracts. This prevents a model
// change from leaving plausible-looking but obsolete values in Markdown.
import { readFileSync } from 'node:fs';
import {
  DOCUMENTED_EXAMPLE_TARGETS, renderDocumentedExampleBlocks,
} from '../../manual/model-examples.mjs';
import { section, check } from '../support/model.mjs';

section('Numerical examples quoted in the documentation');
{
  const blocks = renderDocumentedExampleBlocks();
  for (const target of DOCUMENTED_EXAMPLE_TARGETS) {
    const source = readFileSync(new URL(`../../${target.file}`, import.meta.url), 'utf8');
    for (const id of target.ids) {
      const expected = `<!-- BEGIN GENERATED: ${id} -->\n${blocks.get(id)}\n<!-- END GENERATED: ${id} -->`;
      check(`${target.file} / ${id} agrees with a fresh simulation`,
        source.includes(expected),
        'run npm run manual:examples to regenerate it');
    }
  }
}
