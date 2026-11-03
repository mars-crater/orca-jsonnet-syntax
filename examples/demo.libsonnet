// A small library for visual inspection; no private project data.
{
  service(name, replicas=2):: {
    name: name,
    replicas: replicas,
    enabled: true,
    labels: { app: name },
  },
  extend(service):: service {
    labels+: { extended: 'true' },
    replicas: super.replicas + 1,
  },
  hiddenConfig+:: { debug: false },
  visibleConfig+::: { public: true },
}
