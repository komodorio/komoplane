import {
    Claim,
    ClaimExtended,
    CompositeResource,
    Composition,
    ItemList,
    K8sEvent,
    ManagedResource,
    Provider,
    ProviderConfig,
    XRD
} from "./types.ts";

class APIClient {
    constructor(
        protected readonly baseUrl: string,
    ) {
    }

    innterFetch = async (path: string) => {
        const response = await fetch(`${this.baseUrl}${path}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch data from API. Status code: ${response.status}`);
        }
        return response
    };

    getProviderList = async () => {
        const response = await this.innterFetch(`/api/providers`);
        const data: ItemList<Provider> = await response.json();
        return data;
    };


    getProvider = async (name: string) => {
        const response = await this.innterFetch(`/api/providers/${name}`);
        const data: Provider = await response.json();
        return data;
    };

    getEvents = async (path: string) => {
        const response = await this.innterFetch(`/api/events/${path}`);
        const data: ItemList<K8sEvent> = await response.json();
        return data;
    };

    getProviderConfigs = async (name: string) => {
        const response = await this.innterFetch(`/api/providers/${name}/configs`);
        const data: ItemList<ProviderConfig> = await response.json();
        return data;
    };

    getClaimList = async () => {
        const response = await this.innterFetch(`/api/claims`);
        const data: ItemList<Claim> = await response.json();
        return data;
    };

    getClaim = async (group?: string, version?: string, kind?: string, namespace?: string, name?: string) => {
        const response = await this.innterFetch(`/api/claims/` + group + "/" + version + "/" + kind + "/" + namespace + "/" + name + "?full=1");
        const data: ClaimExtended = await response.json();
        return data;
    };

    getManagedResourcesList = async () => {
        const response = await this.innterFetch(`/api/managed`);
        const data: ItemList<ManagedResource> = await response.json();
        return data;
    };

    getCompositeResourcesList = async () => {
        const response = await this.innterFetch(`/api/composite`);
        const data: ItemList<CompositeResource> = await response.json();
        return data;
    };

    getCompositeResource = async (group?: string, version?: string, kind?: string, name?: string) => {
        const response = await this.innterFetch(`/api/composite/` + group + "/" + version + "/" + kind + "/" + name + "?full=1");
        const data: ClaimExtended = await response.json();
        return data;
    };

    getCompositionsList = async () => {
        const response = await this.innterFetch(`/api/compositions`);
        const data: ItemList<Composition> = await response.json();
        return data;
    };

    getXRDsList = async () => {
        const response = await this.innterFetch(`/api/xrds`);
        const data: ItemList<XRD> = await response.json();
        return data;
    };
}

let baseURL = ""

if (import.meta.env.DEV) {
    baseURL = "http://localhost:8090"
}

const apiClient = new APIClient(baseURL);

export default apiClient;
