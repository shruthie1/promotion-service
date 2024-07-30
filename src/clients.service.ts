import { fetchWithTimeout } from "./fetchWithTimeout";

export async function getClient() {
    const result = await fetchWithTimeout(`https://checker-production-8f93.up.railway.app/forward/clients/${process.env.clientId}`);
    return result.data
}