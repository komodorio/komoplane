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
    users?: number
    conditions?: Condition[]
}

export type Reference = {
    name: string
}

export type K8sResource = {
    kind: string
    apiVersion: string
    metadata: Metadata,
    status: Status
    spec: any
}

export type Provider = K8sResource & {
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

export type ProviderConfig = K8sResource & {
}

export type Claim = K8sResource & {
    spec: {
        compositionRef: Reference
        resourceRef: Reference
    }
}

export type ClaimExtended = Claim & {
    managedResources: K8sResource[]
    compositeResource: K8sResource
    composition: K8sResource
}