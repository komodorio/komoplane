
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

export type Provider = {
    metadata: Metadata,
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

export type K8sEvent ={
    // type, age, reason, object, message
    metadata: Metadata,
    reason: string
    count: number
    message: string
    type: string
    firstTimestamp: string
    lastTimestamp: string
}

export type EventsItems = {
    "items": K8sEvent[]
}
