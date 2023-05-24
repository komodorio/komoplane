import {Provider, ProviderItems} from "./types.ts";

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
        const data: ProviderItems = await response.json();
        return data;
    };

    getProvider = async (name: string) => {
        const response = await this.innterFetch(`/api/providers/${name}`);
        const data: Provider = await response.json();
        return data;
    };
}

let baseURL = ""

// @ts-ignore
if (window["$RefreshReg$"] !== undefined) { // TODO: if anyone knows the better way to detect `npm dev` - help out!
    baseURL = "http://localhost:8090"
}

const apiClient = new APIClient(baseURL);

export default apiClient;
