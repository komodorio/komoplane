# <img src="pkg/frontend/src/assets/logo.svg" style="height: 1.5rem;" alt="logo"> komoplane

[Komodor's](https://komodor.com) Crosplane Tool is a project to experiment with
visualizing [Crossplane](https://www.crossplane.io/) resources. The goal is to help Crossplane users to understand the
structure of their control plane resources and speed up troubleshooting.

<kbd>[<img src="examples/screenshot1.png" style="width: 100%; border: 1px solid silver;" border="1" alt="Screenshot">](examples/screenshot1.png)</kbd>

## Installation

The primary way of installing _komoplane_ is by installing the corresponding Helm chart:

```shell
helm repo add komodorio https://helm-charts.komodor.io \
  && helm repo update komodorio \
  && helm upgrade --install komoplane komodorio/komoplane
```

After installing, publish port `8090` from _komoplane_ pod and open it in your web browser.

By default, _komoplane_ works on port `8090`, you can change that via `extraArgs` Helm value.

### Running Without Helm

It is possible to run _komoplane_ locally as a binary process. To do so, download standalone binary
from [Releases](releases). Use `KUBECONTEXT` env variable to point to different context of your kubeconfig.

## Roadmap

Milestone 1: Local helm install

help buttons in page header to explain and link to CP learning

Make event type be aligned better in event list

Decide on presentation approach: info drawer or dedicated pages

Detect crossplane is not installed and tell user to install it first

Refactor common code around drawer display => <ResourceListWithDrawer?/>

Refactor backend controller for cleaner arch

Make Relations the first tab

Make watcher-based resource tracker, to avoid re-reading all CRDs

For providerConfig nodes, add YAML modal

Standard troubleshooting problem: Secret References from various objects

### Claims

Add link to XRD to graph

### XRs

Add link to XRD to graph
Turn it into table

### MRs

Turn it into table

Show claim name

Show status at provider

Provider config ref available

### Providers

Improve provider configs display
Somehow display provider config and controller config YAMLs

### Compositions

Inline list of composed resource types, or expand it on click
Turn it into table

### XRDs

Filter of free-text search
Display as table
