import {Claim, ItemList, K8sEvent, Provider, ProviderConfig} from "./types.ts";

class APIClient {
    constructor(
        protected readonly baseUrl: string,
    ) {
    }

    innterFetch = async (path: string) =>{
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

    getProviderEvents = async (name: string) => {
        const response = await this.innterFetch(`/api/${name}/events`); // TODO: unversal API or not
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

}

let baseURL = ""

// @ts-ignore
if (window["$RefreshReg$"] !== undefined) { // TODO: if anyone knows the better way to detect `npm run dev` - help out!
    baseURL = "http://localhost:8090"
}

const apiClient = new APIClient(baseURL);

export default apiClient;
