// A small library for visual inspection; no private project data.
{
  service(name, replicas=2):: {
    name: name,
    replicas: replicas,
    enabled: true,
  },
}
