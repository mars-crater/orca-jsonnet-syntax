local lib = import 'demo.libsonnet';
local services = ['frontend', 'worker'];

/* Comments, functions, object fields and comprehensions. */
{
  services: [lib.service(name) for name in services],
  optional: null,
  scale: if std.length(services) > 1 then 1.5 else 1,
  message: "Hello\nJsonnet",
  script: |||
    echo 'hello from a text block'
  |||,
}
