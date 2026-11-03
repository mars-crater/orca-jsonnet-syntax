local lib = import 'demo.libsonnet';
local librarySource = importstr 'demo.libsonnet';
// importbin reads this text fixture as bytes; no binary asset is needed.
local libraryBytes = importbin 'demo.libsonnet';
local services = ['frontend', 'worker'];
local base = { labels: { managedBy: 'orca' } };

/* Comments, functions, object fields and comprehensions. */
base {
  local prefix = 'demo',
  assert std.length(services) > 0 : 'At least one service is required',
  services: [lib.service(name) for name in services],
  byName: { [name]: lib.service(name) for name in services if name != 'worker' },
  labels+: { environment: 'development' },
  inherited: super.labels,
  first: self.services[0],
  rootLabels: $.labels,
  slice: services[0:2:1],
  optional: null,
  scale: if std.length(services) > 1 then 1.5 else 1,
  exponent: 6.022e23,
  # Numeric separators require a Jsonnet implementation supporting that syntax.
  separated: 1_000_000,
  negative: -0.125e-2,
  comparison: (2 << 1) >= 4 && true,
  hidden:: 'not manifested',
  visible::: 'explicitly visible',
  callback: function(name, options = { enabled: true })
    if options.enabled then prefix + '-' + name else error 'Disabled',
  message: "Hello\nJsonnet",
  unicode: '\u0041 and \'quoted\'',
  verbatim: @'C:\configs\it''s-jsonnet',
  doubleVerbatim: @"say ""hello"" without escapes",
  multiline: 'first line
second line',
  script: |||
    echo 'hello from a text block'
    # This is string content, not a Jsonnet comment.
    ||| This fence is content because it has the content indentation.

    echo 'done'
  |||,
  stripped: |||-
    no final newline
  |||,
  sourceLength: std.length(librarySource),
  byteCount: std.length(libraryBytes),
}
