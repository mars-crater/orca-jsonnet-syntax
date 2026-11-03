# Third-party notices

## Jsonnet TextMate grammar

`syntaxes/jsonnet.tmLanguage.json` is derived from
[grafana/vscode-jsonnet](https://github.com/grafana/vscode-jsonnet), commit
`3870b0259b75115898e3c809f4e2c71f4acfcaf9`, file
[`language/jsonnet.tmLanguage.json`](https://github.com/grafana/vscode-jsonnet/blob/3870b0259b75115898e3c809f4e2c71f4acfcaf9/language/jsonnet.tmLanguage.json).

Upstream credits the original grammar to
[heptio/vscode-jsonnet](https://github.com/heptio/vscode-jsonnet) and notes
modifications for additional standard-library functions. The grammar remains
under Apache-2.0; its complete license is in `licenses/vscode-jsonnet-LICENSE`.

### Modifications by mars-crater

The grammar has been modified for Orca's Jsonnet syntax plugin. Changes include:

- Verbatim strings with doubled-quote escapes, `importbin`, and `|||-` text blocks.
- Whole-token numeric matching, including fractions, exponents and numeric separators.
- Correct single-quote and hash-comment scopes, and both quote escapes in ordinary strings.
- Keyword precedence, function/parameter scopes, built-ins, object fields and compound operators.
- Nested expression contexts so array slices are not treated as object fields.
- Multiline and CRLF handling with token-level regression coverage.

These grammar modifications remain under Apache-2.0. The modified grammar carries
its own notice in the top-level `comment` field. Original project files are covered
by the root MIT `LICENSE`.

## Inspiration and references

- [Grafana's VS Code Jsonnet extension](https://github.com/grafana/vscode-jsonnet)
  and its contributors supplied the TextMate starting point. We also credit
  [Heptio's original VS Code Jsonnet extension](https://github.com/heptio/vscode-jsonnet),
  as acknowledged upstream.
- [Vladimir Varankin (narqo)'s Jsonnet extension for Zed](https://github.com/narqo/zed-jsonnet),
  reviewed at [`a95591c4afaaa995386a10a9fcd587848e694fdc`](https://github.com/narqo/zed-jsonnet/tree/a95591c4afaaa995386a10a9fcd587848e694fdc),
  inspired the distinction between fields, functions, parameters, built-ins and
  punctuation. Its Tree-sitter queries and extension code are not bundled or
  translated into this plugin. Zed's extension uses
  [Sourcegraph's tree-sitter-jsonnet](https://github.com/sourcegraph/tree-sitter-jsonnet).
- The [Jsonnet specification](https://jsonnet.org/ref/spec.html) is the lexical
  reference for strings, escapes, numbers, comments and keywords.
- [Microsoft's vscode-textmate](https://github.com/microsoft/vscode-textmate) and
  [vscode-oniguruma](https://github.com/microsoft/vscode-oniguruma) power the
  development-only token regression tests. Their packages retain their own licenses
  in `node_modules`; they are not shipped as plugin assets.

This is an independent community plugin, not an official Grafana, Zed, Microsoft,
or Orca project.
