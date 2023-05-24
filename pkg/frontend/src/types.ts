export type Status = {
    conditions: {
        "type": string,
        "status": string,
        "lastTransitionTime": string,
        "reason": string
    }[]
}

export type Provider = {
    metadata: {
        name: string
    },
    status: Status
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
