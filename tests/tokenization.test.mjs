import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { after, test } from 'node:test';
import textmate from 'vscode-textmate';
import oniguruma from 'vscode-oniguruma';

const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
const rawGrammar = JSON.parse(readFileSync(new URL('syntaxes/jsonnet.tmLanguage.json', root), 'utf8'));
const wasm = readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm'));
await oniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
const registry = new textmate.Registry({
  onigLib: Promise.resolve({
    createOnigScanner: (patterns) => new oniguruma.OnigScanner(patterns),
    createOnigString: (text) => new oniguruma.OnigString(text),
  }),
  loadGrammar: async (scope) => scope === rawGrammar.scopeName ? rawGrammar : null,
});
const grammar = await registry.loadGrammar('source.jsonnet');
assert.ok(grammar);
after(() => registry.dispose());

function tokenize(source, initialState = textmate.INITIAL) {
  const lines = source.split('\n');
  let state = initialState;
  const results = lines.map((line) => {
    // Match Orca's 50 ms line budget, including its retries for cold regex compilation.
    let result;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      result = grammar.tokenizeLine(line, state, 50);
      if (!result.stoppedEarly) break;
    }
    assert.equal(result.stoppedEarly, false, `tokenization exceeded budget: ${line.slice(0, 80)}`);
    state = result.ruleStack;
    return result;
  });
  return { lines, results, state };
}

function expectScope(document, line, fragment, scope, exact = false) {
  const source = document.lines[line];
  const start = source.indexOf(fragment);
  assert.notEqual(start, -1, `missing fixture fragment: ${fragment}`);
  const end = start + fragment.length;
  const tokens = document.results[line].tokens.filter((t) => t.startIndex < end && t.endIndex > start);
  assert.ok(tokens.length > 0);
  for (const token of tokens) {
    assert.ok(token.scopes.includes(scope),
      `${JSON.stringify(fragment)} at line ${line + 1}: expected ${scope}, got ${token.scopes.join(' ')}`);
  }
  if (exact) {
    assert.equal(tokens.length, 1, `split token: ${fragment}`);
    assert.equal(tokens[0].startIndex, start);
    assert.equal(tokens[0].endIndex, end);
  }
}

function expectNoScope(document, prefix) {
  for (const result of document.results) {
    for (const token of result.tokens) {
      assert.ok(!token.scopes.some((s) => s.startsWith(prefix)), token.scopes.join(' '));
    }
  }
}

test('all three comment forms isolate strings and keywords, and terminate correctly', () => {
  const doc = tokenize('// import "x"\n# true\n/* local\nstill a comment */ false');
  expectScope(doc, 0, '// import "x"', 'comment.line.double-slash.jsonnet');
  expectScope(doc, 1, '# true', 'comment.line.number-sign.jsonnet');
  expectScope(doc, 2, 'local', 'comment.block.jsonnet');
  expectScope(doc, 3, 'still a comment */', 'comment.block.jsonnet');
  expectScope(doc, 3, 'false', 'constant.language.jsonnet', true);
});

test('keywords win over function-looking expressions and preserve identifier boundaries', () => {
  const doc = tokenize('if (true) then error ("no") else assert (false);\nlocal x = [n for n in [1]]; x tailstrict\nlocal importbinary = functionish(1);');
  for (const keyword of ['if', 'then', 'error', 'else', 'assert']) {
    expectScope(doc, 0, keyword, 'keyword.control.jsonnet', true);
  }
  for (const keyword of ['for', 'in']) expectScope(doc, 1, keyword, 'keyword.control.jsonnet', true);
  expectScope(doc, 1, 'local', 'keyword.other.jsonnet', true);
  expectScope(doc, 1, 'tailstrict', 'keyword.other.jsonnet', true);
  expectScope(doc, 2, 'importbinary', 'variable.other.jsonnet', true);
  expectScope(doc, 2, 'functionish', 'entity.name.function.jsonnet', true);
});

test('all import forms are highlighted without resolving or reading imported files', () => {
  for (const keyword of ['import', 'importstr', 'importbin']) {
    const doc = tokenize(`${keyword} 'does-not-exist'`);
    expectScope(doc, 0, keyword, 'keyword.control.import.jsonnet', true);
    expectScope(doc, 0, 'does-not-exist', 'string.quoted.single.jsonnet');
  }
});

test('numeric literals are whole tokens, including fractions, exponents and separators', () => {
  for (const number of ['0', '42', '0.5', '1.25', '1e3', '1E+3', '1.2e-3', '1_000_000', '0.000_001', '6.022_140_76e2_3']) {
    const doc = tokenize(`[-${number}]`);
    expectScope(doc, 0, number, 'constant.numeric.jsonnet', true);
    expectScope(doc, 0, '-', 'keyword.operator.jsonnet', true);
  }
  for (const invalid of ['.5', '1.', '01', '1e', '1__0', '1_', '0_1', 'value123']) {
    expectNoScope(tokenize(invalid), 'constant.numeric');
  }
});

test('both quoted string forms accept every Jsonnet escape and hide comment markers', () => {
  const content = String.raw`hello \" \' \\ \/ \b \f \n \r \t \u0041 // # /*`;
  for (const [quote, scope] of [['"', 'string.quoted.double.jsonnet'], ["'", 'string.quoted.single.jsonnet']]) {
    const doc = tokenize(`${quote}${content}${quote} + true`);
    expectScope(doc, 0, content, scope);
    for (const escape of [String.raw`\"`, String.raw`\'`, String.raw`\\`, String.raw`\/`, String.raw`\b`, String.raw`\f`, String.raw`\n`, String.raw`\r`, String.raw`\t`, String.raw`\u0041`]) {
      expectScope(doc, 0, escape, 'constant.character.escape.jsonnet', true);
    }
    expectScope(doc, 0, 'true', 'constant.language.jsonnet', true);
    expectNoScope(doc, 'invalid');
    expectNoScope(doc, 'comment');
  }
});

test('invalid escapes are scoped without consuming the closing quote or later code', () => {
  const doc = tokenize(String.raw`"\q \u12Z \u" + false`);
  for (const escape of [String.raw`\q`, String.raw`\u12`]) {
    expectScope(doc, 0, escape, 'invalid.illegal.escape.jsonnet');
  }
  expectScope(tokenize(String.raw`"\u"`), 0, String.raw`\u`, 'invalid.illegal.escape.jsonnet', true);
  expectScope(doc, 0, 'false', 'constant.language.jsonnet', true);
});

test('ordinary and verbatim strings preserve state across newlines', () => {
  for (const [start, end, scope] of [
    ['"', '"', 'string.quoted.double.jsonnet'],
    ["'", "'", 'string.quoted.single.jsonnet'],
    ['@"', '"', 'string.quoted.double.verbatim.jsonnet'],
    ["@'", "'", 'string.quoted.single.verbatim.jsonnet'],
  ]) {
    const doc = tokenize(`${start}first\n# second\nthird${end} + null`);
    expectScope(doc, 1, '# second', scope);
    expectScope(doc, 2, 'third', scope);
    expectScope(doc, 2, 'null', 'constant.language.jsonnet', true);
  }
});

test('verbatim strings consume doubled quotes and treat backslashes literally', () => {
  for (const [quote, scope] of [['"', 'string.quoted.double.verbatim.jsonnet'], ["'", 'string.quoted.single.verbatim.jsonnet']]) {
    const content = `path\\n\\u1234\\q ${quote}${quote}quoted${quote}${quote}`;
    const doc = tokenize(`@${quote}${content}${quote} + true`);
    expectScope(doc, 0, content, scope);
    expectScope(doc, 0, quote + quote, 'constant.character.escape.jsonnet', true);
    expectScope(doc, 0, 'true', 'constant.language.jsonnet', true);
    expectNoScope(doc, 'invalid');
    expectNoScope(tokenize(`@${quote}\\n${quote}`), 'constant.character.escape');
  }
});

test('empty strings and runs of verbatim quotes close at the right quote', () => {
  for (const string of ['""', "''", '@""', "@''", '@""""', "@''''"]) {
    const doc = tokenize(`${string} + false`);
    expectScope(doc, 0, 'false', 'constant.language.jsonnet', true);
    assert.ok(doc.state.equals(tokenize('false').state));
  }
});

test('text blocks respect indentation, blank lines, literal fences and the strip marker', () => {
  for (const opener of ['|||', '|||-']) {
    const doc = tokenize(`{ text: ${opener}\n\n    # not a comment\n    ||| is content at this indent\n      deeper\n\n  |||, enabled: true }`);
    expectScope(doc, 0, opener, 'punctuation.definition.string.begin.jsonnet');
    expectScope(doc, 2, '# not a comment', 'string.unquoted.block.jsonnet');
    expectScope(doc, 3, '||| is content at this indent', 'string.unquoted.block.jsonnet');
    expectScope(doc, 4, 'deeper', 'string.unquoted.block.jsonnet');
    expectScope(doc, 6, '|||', 'punctuation.definition.string.end.jsonnet');
    expectScope(doc, 6, 'enabled', 'variable.other.property.jsonnet', true);
    expectScope(doc, 6, 'true', 'constant.language.jsonnet', true);
    assert.ok(doc.state.equals(tokenize('{}').state));
  }
});

test('CRLF and tab-indented text blocks carry the same multiline state', () => {
  const doc = tokenize('|||\r\n\t# content\r\n\t||| content\r\n|||\r\ntrue');
  expectScope(doc, 1, '# content', 'string.unquoted.block.jsonnet');
  expectScope(doc, 2, '||| content', 'string.unquoted.block.jsonnet');
  expectScope(doc, 4, 'true', 'constant.language.jsonnet', true);
});

test('functions, parameters and nested defaults retain their individual scopes', () => {
  const doc = tokenize('local service(name, replicas=2) = name;\n{ method(arg):: arg, lambda: function(x, y = [std.length([1]), {z: 2}], cb = function(n) n) x }');
  expectScope(doc, 0, 'service', 'entity.name.function.jsonnet', true);
  expectScope(doc, 0, 'name', 'variable.parameter.jsonnet', true);
  expectScope(doc, 0, 'replicas', 'variable.parameter.jsonnet', true);
  expectScope(doc, 0, '2', 'constant.numeric.jsonnet', true);
  expectScope(doc, 1, 'method', 'entity.name.function.jsonnet', true);
  expectScope(doc, 1, 'arg', 'variable.parameter.jsonnet', true);
  expectScope(doc, 1, 'function', 'storage.type.function.jsonnet', true);
  expectScope(doc, 1, 'x,', 'meta.function.parameters.jsonnet');
  expectScope(doc, 1, 'y', 'variable.parameter.jsonnet', true);
  expectScope(doc, 1, 'cb', 'variable.parameter.jsonnet', true);
  expectScope(doc, 1, 'z', 'variable.other.property.jsonnet', true);
  expectScope(doc, 1, 'length', 'support.function.jsonnet', true);
  assert.ok(doc.state.equals(tokenize('{}').state));
});

test('multiline anonymous parameters and defaults do not leak past the closing parenthesis', () => {
  const doc = tokenize('function(\n  x, // parameter\n  y = f(x, [1, 2]),\n  z = {a: true}\n) x + y');
  expectScope(doc, 1, 'x', 'variable.parameter.jsonnet', true);
  expectScope(doc, 2, 'y', 'variable.parameter.jsonnet', true);
  expectScope(doc, 2, 'x', 'variable.other.jsonnet', true);
  expectScope(doc, 3, 'z', 'variable.parameter.jsonnet', true);
  expectScope(doc, 4, 'x', 'variable.other.jsonnet', true);
  assert.ok(doc.state.equals(tokenize('x').state));
});

test('built-ins and calls are scoped without swallowing punctuation', () => {
  const doc = tokenize('std.length(self.items) + super.size + $.count + f(1) + obj.method(2)');
  expectScope(doc, 0, 'std', 'support.variable.jsonnet', true);
  expectScope(doc, 0, 'length', 'support.function.jsonnet', true);
  for (const builtin of ['self', 'super', '$']) expectScope(doc, 0, builtin, 'variable.language.jsonnet', true);
  expectScope(tokenize('f(1)'), 0, 'f', 'entity.name.function.jsonnet', true);
  expectScope(doc, 0, 'method', 'entity.name.function.jsonnet', true);
});

test('field visibility and additive operators remain separate from property names', () => {
  for (const operator of [':', '::', ':::', '+:', '+::', '+:::', '+ ::']) {
    const doc = tokenize(`{ field ${operator} 1, "quoted": 2, ["computed"]: 3 }`);
    expectScope(doc, 0, 'field', 'variable.other.property.jsonnet', true);
    expectScope(doc, 0, operator, 'keyword.operator.visibility.jsonnet', true);
    expectScope(doc, 0, 'quoted', 'string.quoted.double.jsonnet');
    expectScope(doc, 0, 'computed', 'string.quoted.double.jsonnet');
  }
});

test('slices do not mistake start/end expressions for object fields', () => {
  const doc = tokenize('{ result: values[start:end:step], nested: { field: 1 } }');
  for (const variable of ['start', 'end', 'step']) expectScope(doc, 0, variable, 'variable.other.jsonnet', true);
  expectScope(doc, 0, 'field', 'variable.other.property.jsonnet', true);
});

test('comprehensions and object inheritance retain nested expression scopes', () => {
  const doc = tokenize('local base = { hidden:: true };\nbase { items+: [n * 2 for n in [1, 2] if n > 0], map: { [k]: self[k] for k in ["a"] } }');
  expectScope(doc, 1, 'items', 'variable.other.property.jsonnet', true);
  for (const keyword of ['for', 'in', 'if']) expectScope(doc, 1, keyword, 'keyword.control.jsonnet', true);
  expectScope(doc, 1, 'self', 'variable.language.jsonnet', true);
  assert.ok(doc.state.equals(tokenize('{}').state));
});

test('multi-character operators are single tokens, including beside comments', () => {
  for (const operator of ['<<', '>>', '<=', '>=', '==', '!=', '&&', '||', '+', '-', '*', '/', '%', '&', '|', '^', '!', '~']) {
    const doc = tokenize(`a ${operator} b /* comment */`);
    expectScope(doc, 0, operator, 'keyword.operator.jsonnet', true);
    expectScope(doc, 0, '/* comment */', 'comment.block.jsonnet');
  }
});

test('unfinished constructs retain state and resume correctly when completed', () => {
  for (const [prefix, suffix, scope] of [
    ['"unfinished', 'continued" + true', 'string.quoted.double.jsonnet'],
    ["@'unfinished", "continued' + true", 'string.quoted.single.verbatim.jsonnet'],
    ['/* unfinished', 'continued */ true', 'comment.block.jsonnet'],
    ['|||\n  unfinished', '  continued\n|||\ntrue', 'string.unquoted.block.jsonnet'],
  ]) {
    const before = tokenize(prefix);
    const resumed = tokenize(suffix, before.state);
    expectScope(resumed, 0, 'continued', scope);
    expectScope(resumed, resumed.lines.length - 1, 'true', 'constant.language.jsonnet', true);
    assert.ok(resumed.state.equals(tokenize('true').state));
  }
});

test('representative adversarial lines within Orca limits finish without tokenizer timeouts', () => {
  for (const source of [
    '('.repeat(400) + '0' + ')'.repeat(400),
    'x('.repeat(250) + '0' + ')'.repeat(250),
    '"' + '\\'.repeat(900) + '"',
    '@"' + '""'.repeat(450) + '"',
    '1'.repeat(900),
    '/*' + '*'.repeat(900) + '/',
    '{ value: function(x = [' + '0,'.repeat(400) + '0]) x }',
  ]) {
    assert.ok(source.length <= 1000);
    tokenize(source);
  }
});

test('demo files tokenize without illegal scopes or unclosed multiline constructs', () => {
  const baseline = tokenize('null').state;
  for (const file of ['examples/demo.jsonnet', 'examples/demo.libsonnet']) {
    const doc = tokenize(readFileSync(new URL(file, root), 'utf8'));
    expectNoScope(doc, 'invalid');
    assert.ok(doc.state.equals(baseline), `${file}: unclosed tokenization state`);
  }
});
