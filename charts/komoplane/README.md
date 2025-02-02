# Komoplane

A tool to visualize Crossplane, project by Komodor.com. Allows viewing the state of Crossplane resources for troubleshooting.

## TL;DR;

```bash
helm repo add komodorio https://helm-charts.komodor.io
helm repo update
helm upgrade --install komoplane komodorio/komoplane
```


### While testing from sources with Kind
```bash
docker build . -t komodorio/komoplane:unstable && kind load docker-image komodorio/komoplane:unstable && helm upgrade --install komoplane charts/komoplane --set image.tag=unstable
```