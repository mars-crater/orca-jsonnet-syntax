# Jsonnet Syntax for Orca

Data-only syntax highlighting for `.jsonnet` and `.libsonnet` files in
[Orca](https://www.onorca.dev/), with comments, bracket matching and auto-closing pairs.
No worker, language server, runtime dependencies or privileged capabilities.

**Status:** unreleased. Structural and real TextMate/Oniguruma token regression
tests pass, as do Orca's official source validator and the Orca 1.4.247 CLI validator.
Desktop checks have been reported successful except for `importbin` highlighting,
which remains under investigation. See the verification notes below before release.
Formatting, evaluation, completions and diagnostics are out of scope.

## Highlighting

- Jsonnet keywords, including `import`, `importstr` and `importbin`.
- `//`, `#` and `/* ... */` comments.
- Single/double-quoted strings, escapes, multiline strings, verbatim `@'...'` and
  `@"..."` strings with doubled quotes, and indentation-aware `|||` / `|||-` blocks.
- Numbers with fractions, exponents and numeric separators; booleans and `null`.
- Functions, simple parameter declarations, object fields and visibility/additive
  operators (`:`, `::`, `:::`, `+:`, `+::`, `+:::`).
- `self`, `super`, `$`, `std` and standard-library calls, plus nested objects,
  arrays, comprehensions, slices and object inheritance.

Scopes follow TextMate conventions and Orca's theme mapping; the active theme decides
the colors. This is lexical highlighting: it does not resolve bindings or distinguish
a shadowed `std`. Complex/multiline named-function signatures fall back to ordinary
function/expression scopes. Numeric separators and `|||-` follow the current
[Jsonnet specification](https://jsonnet.org/ref/spec.html); older evaluators may
not accept them.

## Identity and compatibility

- Repository: `mars-crater/orca-jsonnet-syntax`
- Plugin ID: `jsonnet-syntax` (the `orca-` prefix is reserved in plugin IDs)
- Git/catalog install identity: `mars-crater.jsonnet-syntax`
- Local development identity: `local.jsonnet-syntax`
- Minimum Orca: **1.4.246**; manifest format **2**, execution **data**
- Publisher is derived from the repository owner, not declared in the manifest.

## Develop

With Node.js 22 or newer:

```sh
npm ci --ignore-scripts
npm test
```

`npm run test:structure` runs dependency-free manifest/configuration/provenance
checks. `npm run test:tokens` runs the grammar through TextMate and Oniguruma,
checking token boundaries, scopes, multiline state, unfinished input and representative
long/nested lines within Orca's per-line limits. The test dependencies are development
tools only; Orca loads the JSON grammar directly and needs no npm installation.

With a recent Orca CLI:

```sh
orca plugin validate .
orca plugin dev watch .
```

Use your Orca IDE's CLI executable (`orca-ide` on standalone Linux installations;
bare `orca` can be the unrelated GNOME screen reader). If it reports
`Unknown command: plugin`, update Orca before using these commands. Alternatively,
validate from a compatible
Orca source checkout with `pnpm validate:plugin /absolute/path/to/orca-jsonnet-syntax`.

The development host now runs 1.4.247 and passes `plugin validate`. Its headless
runtime reports that the plugin service is unavailable: offline validation does not
mean a plugin is loaded. Load the plugin on the desktop client for visual checks.

CI runs the test suites and Orca's unmodified `validate-plugin-files.mjs` entry point
from pinned revision `572fbc8a2a0e84ba5471cc75a16cabb266af220b`, with only its required
validation dependencies. This is the official validator behind `pnpm validate:plugin`,
including artifact checks, not just JSON-schema validation. The same source validator
passed locally. Update the pinned revision and dependency versions together when
adopting changes to Orca's plugin contract.

Open `examples/demo.jsonnet` and `examples/demo.libsonnet` for visual checks.
The plugin never evaluates Jsonnet or resolves its imports.

## Desktop verification before release

User-reported desktop results:

- Source highlighting and text blocks: working, except for `importbin` below.
- Light/dark themes and diff highlighting: passed.
- Comment toggling and bracket/quote pairing: passed.
- Disabling/re-enabling changes highlighting: passed.

**Open issue:** `importbin` was reported unhighlighted even though the inspected
grammar contains its rule. Its token regression passes and gives it the same scope
as `import` and `importstr`. The active installed copy and a screenshot of the affected
line still need checking; the cause is not yet confirmed.

Use this checklist for release verification. Ordinary `.json` behavior, development
grammar hot reload and a clean plugin error card have not yet been confirmed.
Automated token tests do not replace these checks:

1. Load the development folder with `orca plugin dev watch .` and open both demo files
   in Source. Check strings, comments, numbers, imports, fields and functions.
2. Edit representative lines and inspect both sides of their diff. Repeat in light
   and dark themes; verify ordinary `.json` files retain Orca's built-in language.
3. Exercise line/block comment toggling, bracket matching, quote/bracket auto-closing
   and surrounding selected text. Orca's configuration accepts `{ open, close }`
   pairs but currently drops VS Code's `notIn` restrictions; do not assume pairs are
   suppressed inside comments/strings.
4. With the files still open, disable and re-enable the plugin, then edit/save the
   development grammar. Confirm highlighting updates without reopening the files.
5. Confirm the plugin card has no errors. Capture real source/diff screenshots if
   adding directory images.

## Release convention

The public repository has the `orca-plugin` topic. Once validation and runtime
checks pass, merge the work to `main`, update `version` in `orca-plugin.json`
and `package.json` (including `package-lock.json`), and, with maintainer approval,
push a matching `vX.Y.Z` tag. **This plugin has not been released.**
Keep `node_modules`, generated output and binary artifacts out of the committed
release tree. Tagging triggers community directory discovery,
usually within an hour; untagged branch pushes do not publish a plugin release.

Status page: https://www.onorca.dev/plugins/mars-crater/orca-jsonnet-syntax

See Orca's [authoring guide](https://github.com/stablyai/orca/blob/main/docs/reference/plugin-authoring.md),
[syntax reference](https://github.com/stablyai/orca/blob/main/docs/reference/plugin-syntax.md)
and [listing requirements](https://www.onorca.dev/plugins/add).

## Credits and inspiration

- **[Grafana's VS Code Jsonnet extension](https://github.com/grafana/vscode-jsonnet)**
  supplied the Apache-2.0 TextMate grammar on which ours is based. Thank you to its
  contributors and **[Heptio's original extension](https://github.com/heptio/vscode-jsonnet)**,
  credited by upstream.
- **[Vladimir Varankin (narqo)'s Jsonnet extension for Zed](https://github.com/narqo/zed-jsonnet)**
  inspired our treatment of fields, functions, parameters, built-ins and punctuation.
  Its Tree-sitter queries were a design reference; this plugin uses TextMate and does
  not bundle Zed's code or its [Sourcegraph Tree-sitter parser](https://github.com/sourcegraph/tree-sitter-jsonnet).
- **[Microsoft's TextMate](https://github.com/microsoft/vscode-textmate)** and
  **[Oniguruma](https://github.com/microsoft/vscode-oniguruma)** bindings make the token
  regression tests possible.

This is an independent community plugin. Full provenance, reviewed revisions and
our modifications are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## License

Project files: MIT. Adapted Jsonnet grammar: Apache-2.0, with attribution and
source revision in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
