# How to Contribute

## Finding What to Contribute

[Roadmap](Roadmap.md) document contains some notes and ideas on what can be done to improve the project. Those may be not very clear, that's how OSS ideas start. Raise the question in Slack about particular item that attracked your attention to get more explanation.

## Setting Up For Local Development

You will need Golang 1.20+ and NodeJS 18+. Also, you will need a working Kubernetes cluster with Crossplane Helm chart installed into it. It is advisable to apply example Crossplane objects from `examples` folder. 

First you need to build frontend (the API backend won't compile without that). To do so, run `npm run build` inside `pkg/frontend` directory.

To build API backend, run `go build -o bin/komoplane .` in the project root.

For frontend development, start API backend with command `bin/komoplane`, then run `npm run dev` inside `pkg/frontend`. Open the suggested URL in your browser.