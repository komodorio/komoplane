# Roadmap

Decide on presentation approach: info drawer or dedicated pages

Refactor common code around drawer display => <ResourceListWithDrawer?/>

Make Relations the first tab in drawer (if we keep drawer)

For providerConfig nodes in graph, add YAML modal/drawer

Standard troubleshooting problem: Secret References from various objects

Make sure compositions of compositions are displayed properly

When we "open" resource (from diagram), it redirects to corresponding section and desorients user. Needs to stay
in-place. Probably whole navigation has to be re-thought because of this.

ArgoCD has the ability to load UI extensions. It would be amazing to have komoplane-style inspection of the crossplane
resources in argocd: https://argo-cd.readthedocs.io/en/latest/developer-guide/extensions/ui-extensions/, there is one
that does backend stuff as well: https://github.com/argoproj-labs/rollout-extension (by Blake Barnett)

For k8s-MRs, display actual k8s resources in graph

## Claims

Add link to XRD to graph

For unhealthy claim, get to the potential root cause and propagate it to the Claim (Victor)

## XRs

Add link to XRD to graph
Turn it into table

## MRs

Turn it into table

Show claim name

Show status at provider

Provider config ref available

## Providers

Improve provider configs display
Somehow display provider config and controller config YAMLs
Via additional button, display all resources that reference this provider. Can be long API call, but valuable.

## Compositions

Inline list of composed resource types, or expand it on click
Turn it into table

## XRDs

Filter of free-text search
Display as table

## Backend

Refactor backend controller for cleaner arch
Make watcher-based resource tracker in backend, to avoid re-reading all CRDs
