import {ProviderList} from "./types.ts";

class APIClient {
    constructor(
        protected readonly baseUrl: string,
    ) {
    }

    getProviderList = async () => {
        const response = await fetch(`${this.baseUrl}/status`);
        const data: ProviderList = await response.json();
        return data;
    };
}

let baseURL = ""

// @ts-ignore
if (window["$RefreshSet$"] !== undefined) { // TODO: if anyone knows the better way to detect `npm dev` - help out!
    baseURL = "http://localhost:8090"
}

const apiClient = new APIClient(baseURL);

export default apiClient;
