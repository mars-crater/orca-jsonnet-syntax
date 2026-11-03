import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const manifest = readJson('orca-plugin.json');
const syntax = manifest.contributes.syntaxes[0];
const grammar = readJson(syntax.path);

test('uses the data-only Orca v2 convention and community identity', () => {
  assert.equal(manifest.manifestVersion, 2);
  assert.equal(manifest.execution, 'data');
  assert.equal(manifest.id, 'jsonnet-syntax');
  assert.equal(manifest.publisher, undefined);
  assert.equal(manifest.engines.orca, '>=1.4.246');
  assert.equal(manifest.main, undefined);
  assert.equal(manifest.pluginApi, undefined);
  assert.deepEqual(manifest.capabilities ?? [], []);
  assert.deepEqual(Object.keys(manifest.contributes), ['syntaxes']);
  assert.equal(manifest.version, readJson('package.json').version);
});

test('claims only Jsonnet and Libsonnet files with the matching grammar scope', () => {
  assert.equal(manifest.contributes.syntaxes.length, 1);
  assert.deepEqual(syntax.extensions, ['.jsonnet', '.libsonnet']);
  assert.equal(syntax.scopeName, 'source.jsonnet');
  assert.equal(grammar.scopeName, syntax.scopeName);
  assert.ok(grammar.patterns.length > 0);
  assert.ok(readFileSync(new URL(syntax.path, root)).length <= 1024 * 1024);
});

test('every grammar include resolves within the bundled grammar', () => {
  function visit(value) {
    if (value === null || typeof value !== 'object') return;
    if (typeof value.include === 'string') {
      const include = value.include;
      if (include.startsWith('#')) {
        assert.ok(Object.hasOwn(grammar.repository, include.slice(1)), include);
      } else {
        assert.ok(['$self', '$base', syntax.scopeName].includes(include), include);
      }
    }
    for (const child of Object.values(value)) visit(child);
  }
  visit(grammar);
});

test('configures comments, brackets and string pairs without runtime code', () => {
  const config = readJson(syntax.configuration);
  assert.equal(config.comments.lineComment, '//');
  assert.deepEqual(config.comments.blockComment, ['/*', '*/']);
  assert.deepEqual(config.brackets, [['{', '}'], ['[', ']'], ['(', ')']]);
  for (const quote of ['"', "'"]) {
    assert.ok(config.autoClosingPairs.some((pair) =>
      pair.open === quote && pair.close === quote && pair.notIn.includes('string')));
  }
  assert.ok(readFileSync(new URL(syntax.configuration, root)).length <= 64 * 1024);
});

test('ships project and third-party licenses with upstream provenance', () => {
  assert.match(readFileSync(new URL('LICENSE', root), 'utf8'), /MIT License/);
  assert.match(readFileSync(new URL('licenses/vscode-jsonnet-LICENSE', root), 'utf8'), /Apache License/);
  assert.match(readFileSync(new URL('THIRD_PARTY_NOTICES.md', root), 'utf8'), /3870b0259b75115898e3c809f4e2c71f4acfcaf9/);
});
