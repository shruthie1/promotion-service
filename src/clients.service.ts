import { fetchWithTimeout } from "./fetchWithTimeout";

export async function getClient(clientId: string) {
    const result = await fetchWithTimeout(`${process.env.uptimeChecker}/clients/${clientId}`);
    return result.data
}