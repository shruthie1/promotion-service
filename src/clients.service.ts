import { fetchWithTimeout } from "./fetchWithTimeout";

export async function getClient() {
    try {
        const result = await fetchWithTimeout(`${process.env.repl}/getme`);
        if (result.data) {
            return result.data
        } else {
            const client = await fetchWithTimeout(`${process.env.uptimeChecker}/forward/clients/${process.env.clientId}`);
            return client.data
        }
    } catch (error) {
        const client = await fetchWithTimeout(`${process.env.promoteChecker}/clients/${process.env.clientId}`);
        return client.data
    }
}