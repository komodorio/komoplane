import {ProviderItems} from "./types.ts";

class APIClient {
    constructor(
        protected readonly baseUrl: string,
    ) {
    }

    getProviderList = async () => {
        const response = await fetch(`${this.baseUrl}/api/providers`);
        const data: ProviderItems = await response.json();
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
