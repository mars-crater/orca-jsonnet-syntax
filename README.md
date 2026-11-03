# Jsonnet Syntax for Orca

Data-only syntax highlighting for `.jsonnet` and `.libsonnet` files in
[Orca](https://www.onorca.dev/), with comments, bracket matching and auto-closing pairs.
No worker, language server, runtime dependencies or privileged capabilities.

**Status:** development starter, not released or verified in Orca yet. The initial
TextMate grammar is vendored from Grafana's Jsonnet extension; token-level regression
tests and runtime verification remain before the first release. Formatting,
evaluation, completions and diagnostics are out of scope.

## Identity and compatibility

- Repository: `mars-crater/orca-jsonnet-syntax`
- Plugin ID: `jsonnet-syntax` (the `orca-` prefix is reserved in plugin IDs)
- Git/catalog install identity: `mars-crater.jsonnet-syntax`
- Local development identity: `local.jsonnet-syntax`
- Minimum Orca: **1.4.246**; manifest format **2**, execution **data**
- Publisher is derived from the repository owner, not declared in the manifest.

## Develop

With Node.js 22 or newer, run the dependency-free structural checks:

```sh
npm test
```

With a recent Orca CLI:

```sh
orca plugin validate .
orca plugin dev watch .
```

If the installed CLI reports `Unknown command: plugin`, update Orca before using
these commands. The CLI on the initial development host does not yet provide them.
Alternatively, validate from a compatible Orca source checkout with
`pnpm validate:plugin /absolute/path/to/orca-jsonnet-syntax`.

Open `examples/demo.jsonnet` and `examples/demo.libsonnet` for visual checks.
The plugin never evaluates Jsonnet or resolves its imports.

## Next development tasks

- Add real TextMate/Oniguruma tokenization tests, including multiline state.
- Check and improve upstream coverage for verbatim strings, `importbin`, numeric
  literals, object inheritance, hidden fields and malformed/incomplete input.
- Verify comments, bracket pairing, source/diff highlighting, light/dark themes
  and enable/disable behavior in Orca itself.
- Pass Orca's official plugin validator; structural or JSON-schema checks alone
  do not establish release readiness.
- Capture a representative screenshot for the directory, if useful.

## Release convention

The public repository has the `orca-plugin` topic. Once validation and runtime
checks pass, merge the work to `main`, update `version` in `orca-plugin.json`
and `package.json`, and push a matching `vX.Y.Z` tag. **No release tag has been
published for this starter.** Tagging triggers community directory discovery,
usually within an hour; untagged branch pushes do not publish a plugin release.

Status page: https://www.onorca.dev/plugins/mars-crater/orca-jsonnet-syntax

See Orca's [authoring guide](https://github.com/stablyai/orca/blob/main/docs/reference/plugin-authoring.md),
[syntax reference](https://github.com/stablyai/orca/blob/main/docs/reference/plugin-syntax.md)
and [listing requirements](https://www.onorca.dev/plugins/add).

## License

Project files: MIT. Vendored Jsonnet grammar: Apache-2.0, with attribution and
source revision in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
