// Numerical examples in prose are executable contracts. This prevents a model
// change from leaving plausible-looking but obsolete values in Markdown.
import { readFileSync } from 'node:fs';
import {
  DOCUMENTED_EXAMPLE_TARGETS, renderDocumentedExampleBlocks,
} from '../../manual/model-examples.mjs';
import { section, check } from '../support/model.mjs';
import { consistencyErrors } from '../../manual/tools/consistency.mjs';

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

section('Cross-page contradiction lint');
{
  const aligned = new Map([
    ['one.md', '<!-- CONSISTENCY: example -->12<!-- /CONSISTENCY -->'],
    ['two.md', '<!-- CONSISTENCY: example -->12<!-- /CONSISTENCY -->'],
  ]);
  const contradictory = new Map(aligned);
  contradictory.set('two.md', '<!-- CONSISTENCY: example -->13<!-- /CONSISTENCY -->');
  check('matching visible facts agree with their model anchor',
    consistencyErrors(aligned, { example: '12' }).length === 0);
  check('a cross-page disagreement is rejected',
    consistencyErrors(contradictory, { example: '12' })
      .some((message) => message.includes('disagrees')));
  check('a repeated but stale fact is rejected against its model source',
    consistencyErrors(aligned, { example: '14' })
      .some((message) => message.includes('model source')));
}
