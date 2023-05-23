export type Provider = {
    metadata: {
        name: string
    },
    status: {
        conditions: {
            "type": string,
            "status": string,
            "lastTransitionTime": string,
            "reason": string
        }[]
    }
    spec: {
        package: string
        controllerConfigRef: {
            name: string
        }
    }
}

export type ProviderItems = {
    "items": Provider[]
}
