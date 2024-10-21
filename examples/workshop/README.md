# All Aboard Crossplane

Workshop for KDC UK 2024.

The goal is to go over Crossplane concepts in practice and gain understanding how to work with it.

## Understanding Use Case for Crossplane

- Infrastructures of large organizations.
- Infrastructures with a lot of changes and many clusters.
- Internal Developer Platform engine.

## Learning Concepts of Crossplane

- Management Cluster vs Destination Cluster
- Custom Control Plane, working on custom resources
- Provider and ProviderConfig/ControllerConfig
- Managed Resource (MR)
- Composition and Composite Resource Definition (XRD)
- Composite Resource
- Claim

## Prerequisites

It is assumed you are the top expert of K8s in your company, creating and managing the IDP abstraction.

- *Nix Shell to run commands
- a clean Kubernetes cluster for playground,
    - maybe https://kind.sigs.k8s.io/ for “local kubernetes cluster” (requires Docker)
- Helm is required
- kubectl is required
- [k9s](https://k9scli.io/), [helm-dashboard](https://github.com/komodorio/helm-dashboard) and [komoplane](https://github.com/komodorio/komoplane) are desirable

Whole excersise will be done using single cluster, although IRL the management cluster and managed clusters would be
different. We use k8s and helm providers as hermetic playground, avoiding AWS/GCP because of time constraints.

## Installing Crossplane

Installs empty Custom Control Plane.

```bash
helm repo add crossplane-stable https://charts.crossplane.io/stable
helm repo update
helm upgrade --install --create-namespace -n crossplane-system crossplane crossplane/crossplane
```

Preparation step applying [00-pre-setup-sa.yaml](00-pre-setup-sa.yaml).
Creates Service Account, Cluster Role and binding for in-cluster access.

```bash
kubectl apply -f 00-pre-setup-sa.yaml
```

## Installing First Provider: Kubernetes

https://marketplace.upbound.io/providers
https://marketplace.upbound.io/providers/crossplane-contrib/provider-kubernetes

Create Provider object. It creates some CRDs as a result, and also starts the "controller" pod, watching CRs of its
kind.

```bash
kubectl apply -f 01-k8s-step1-provider.yaml
```

Next step is to configure the access of Provider to a "Destination Cluster". We'll use a small "in-cluster" access
config.

```bash
kubectl apply -f 02-k8s-step2-providerconfig.yaml
```

## Creading Managed Resources Directly

The file [03-k8s-step3-mr.yaml](03-k8s-step3-mr.yaml) contains definitions of two Managed Resources (MRs) of kind
`Object`: one is namespace `workshop-provider-k8s`, another is a Pod in that namespace called `stray-pod`.

```bash
kubectl apply -f 03-k8s-step3-mr.yaml
```

Browse created Pod in k8s via k9s/kubectl:

```bash
kubectl get namespace workshop-provider-k8s
kubectl -n workshop-provider-k8s get pods
```

Browse created Pod in k8s via k9s/kubectl:

```bash
kubectl get Objects
```

### Reconciliation (self-healing) Excercise

Let's delete the resulting namespace. It will also cause `stray-pod` to be deleted.

```bash
kubectl delete namespace workshop-provider-k8s
```

In 10 minutes the control plane will auto-restore resource from corresponding `Object` (let's not wait for it, will
revise later that it has restored).

Any k8s resource can be created and reconciliated like that.

## Installing Second Provider: Helm

Let's repeat similar steps to install Helm provider, to add variety to our experiment.

```bash
kubectl apply -f 04-helm-step1-provider.yaml
```

We have to create Provider Config separately, because it expects CRD from previous step to be created. In case of large
provider like AWS the creation of CRDs may take a while.

```bash
kubectl apply -f 05-helm-step2-providerconfig.yaml
```

Now, to validate the provider is operational, we'll create a `Release` resource. Control plane will make sure the
corresponding Helm chart is installed.

```bash
kubectl apply -f 06-helm-step3-mr.yaml
```

Validate that Helm chart was installed:

```bash
helm ls -n workshop-provider-helm
```

Optional drift reconcile excercise: Open Helm Dashboard and edit values and version, so it has drifted and in 10min
reconciled back to match the MR. Also editing the MR would reflect into Helm release changes.

## Defining Composite Resources

The true power of Crossplane reveals when we start to compose resources into conglomerates that are managed as single
entity. This is supposed to be the main concern of plarform engineer - to create and maintain these definitions, so
users use those as abstractions on a higher level of granilarity.

First resource composition we'll do is two Komodor OSS helm charts to be installed at once.
To organize resource composition, we need two components: `XRD` and `Composition`.
Composite Resource Definition (XRD) is like a config format description, defines the k8s CRD that will be claimed or
created by users.

```bash
kubectl apply -f 07-composite-step1-define-xrd.yaml
```

Composition defines which MRs to create and maps configuration from XRD into fields of MR.
```bash
kubectl apply -f 08-composite-step2-define-composition.yaml
```

Take a bit of time to review source YAMLs of XRD and Composition, to understand the elements of configuration.

## Utilizing Composite Resources

Two ways to utilize the created definitions. First is cluster-scoped direct creation of Composite Resource (XR).
```bash
kubectl apply -f 09-composite-step3-use-direct.yaml
```

You can validate two Helm releases were created at once:
```bash
helm ls -n komodor
```

Second way to create the composite resource is via `Claim`, which is an intermediate _namespaced_ resource. The following YAML creates two composite resources in different namespaces, resulting in 4 Helm releases.
```bash
kubectl apply -f 10-composite-step4-use-claim.yaml
```
Intentionally,the second claim has problem, to be investigated via [komoplane](https://github.com/komodorio/komoplane) visualizer tool.

As a result of investigation, edit the YAML and re-apply it. Observe in Komoplane that MR is fine and Helm release has been created.

## Advanced Use: Compositions of Compositions

Real-life compositions sometimes include tens of different resource types, with complex relations between them. To allow for more manageable structure, you can have tree-like structure of compositions, referencing XRs from compositions.

We'll define a composition that references all 3 learned types of custom resources: k8s resource, Helm Release and
Composite Resource. 
```bash
kubectl apply -f 11-mega-step1-define.yaml
```

An illustration of how this complexity is hidden from the consumer, via very simple YAML of resource:
```bash
kubectl apply -f 12-mega-step2-claim.yaml
```

Investigate it with Komoplane after applying.