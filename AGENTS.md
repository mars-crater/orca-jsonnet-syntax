# Orca Jsonnet Syntax

- This is the standalone public `mars-crater/orca-jsonnet-syntax` plugin, not an ABS project.
- Keep a root `orca-plugin.json`, manifest format 2, `execution: data`, and only `contributes.syntaxes`.
- Repository names may begin `orca-`; community manifest IDs must not. The plugin ID is `jsonnet-syntax`.
- Do not add a publisher field: Orca derives `mars-crater` from the GitHub owner. Minimum Orca is 1.4.246.
- Support `.jsonnet` and `.libsonnet`, scope `source.jsonnet`; do not claim generic JSON files.
- No worker, host API, capabilities, VS Code extension entrypoint or language server is needed.
- Preserve upstream provenance and Apache-2.0 license for the vendored grammar. Mark modifications if made.
- Run `npm ci --ignore-scripts` then `npm test` for structural and TextMate/Oniguruma token regression checks. `npm run test:structure` alone is dependency-free. Neither suite verifies runtime rendering in Orca.
- Before release, add token regression tests and verify the syntax in Orca source and diff views, light/dark themes, and after enabling/disabling the plugin.
- Run `orca plugin validate .` with a newer CLI, or `pnpm validate:plugin <plugin-path>` from a compatible Orca checkout. Schema checks alone do not replace it.
- Release only after validation: matching manifest version and `vX.Y.Z` tag, public repository, `orca-plugin` topic, licenses and no binary artifacts. Do not tag/publish without approval.
- References: https://github.com/stablyai/orca/blob/main/docs/reference/plugin-authoring.md and plugin-syntax.md in the same directory.
