import { fetchWithTimeout } from "./fetchWithTimeout";

export async function getClient() {
    try {
        const result = await fetchWithTimeout(`${process.env.repl}/getme`);
        console.log(result)
        if (result.data) {
            return result?.data
        } else {
            const client = await fetchWithTimeout(`${process.env.uptimeChecker}/clients/${process.env.clientId}`);
            console.log(client)
            return client?.data
        }
    } catch (error) {
        const client = await fetchWithTimeout(`${process.env.promoteChecker}/forward/clients/${process.env.clientId}`);
        console.log(client)
        return client?.data
    }
}