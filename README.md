# Komodor Crosplane Tool

Experiment with visualizing Crossplane resources

## Installation

_Helm installation will be the primary way_

### Running Without Helm

Download standalone binary from Releases. Use `KUBECONTEXT` env variable to point to different context.

## Roadmap

Milestone 1: Local helm install, images in registry, user analytics, update check

help buttons to explain and link to CP learning

Make event type be aligned better in event list

Decide on presentation approach: info drawer or dedicated pages

Detect crossplane is not installed and tell user to install it first

Refactor common code around drawer display => <ResourceListWithDrawer?/>

Refactor backend controller for cleaner arch

Make Relations the first tab

Make watcher-based resource tracker, to avoid re-reading all CRDs

For providerConfig nodes, add YAML modal

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
