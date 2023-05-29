export type ItemList<S> = {
    items: S[]
}

export type Metadata = {
    name: string
    namespace: string
}

export type Condition = {
    "type": string,
    "status": string,
    "lastTransitionTime": string,
    "reason": string
}

export type Status = {
    conditions: Condition[]
}

export type Reference = {
    name: string
}

export type Provider = {
    metadata: Metadata,
    status: Status
    spec: {
        package: string
        controllerConfigRef: Reference
    }
}


export type K8sEvent = {
    // type, age, reason, object, message
    metadata: Metadata,
    reason: string
    count: number
    message: string
    type: string
    firstTimestamp: string
    lastTimestamp: string
}

export type ProviderConfig = {
    metadata: Metadata,
}

export type Claim = {
    kind: string
    apiVersion: string
    metadata: Metadata
    spec: {
        compositionRef: Reference
    }
    status: Status
}