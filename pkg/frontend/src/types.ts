export type ItemList<S> = {
    items: S[]
}

export type Metadata = {
    managedFields?: object[];
    name: string
    namespace?: string
    annotations?: { [key: string]: string; }
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

export type TypeReference = {
    kind: string
    apiVersion: string
}

export type K8sResource = {
    kind: string
    apiVersion: string
    metadata: Metadata,
    status?: Status
}

export type Provider = K8sResource & {
    spec: {
        package: string
        controllerConfigRef: Reference
    }
    status: Status
}

export type K8sEvent = K8sResource & {
    reason: string
    count: number
    message: string
    type: string
    firstTimestamp: string
    lastTimestamp: string
}

export type ProviderConfig = K8sResource

export type Claim = K8sResource & {
    spec: {
        compositionRef: Reference
        resourceRef: Reference
    }
    status: Status
    [key: string]: object
}

export type ClaimExtended = Claim & {
    managedResources: ManagedResource[]
    compositeResource: CompositeResource
    composition: Composition
}

export type ManagedResource = K8sResource & {
    spec: {
        providerConfigRef: Reference
    }
    status: Status
}

export type CompositeResource = K8sResource & {
    spec: {
        claimRef?: Reference
        compositionRef: Reference
        resourceRefs: Reference[]
    }
    status: Status
}

export type CompositeResourceExtended = CompositeResource & {
    managedResources: ManagedResource[]
    composition: Composition
    claim?: Claim
}

export type Composition = K8sResource & {
    spec: {
        compositeTypeRef: TypeReference
        resources: {
            name: string
            base: K8sResource
            patches: object[] // TODO
        }[]
    }
    status: never
}

export type Names = {
    kind: string
    plural: string
}

export type Version = {
    name: string
    schema: object
}

export type XRD = K8sResource & {
    spec: {
        group: string
        claimNames: Names
        names: Names
        versions: Version[]
    }
    status: Status
}
