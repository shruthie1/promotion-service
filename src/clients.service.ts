import { fetchWithTimeout } from "./fetchWithTimeout";

export async function getClient() {
    const url = `${process.env.repl}/getme`;
    try {
        const result = await fetchWithTimeout(url);
        console.log(result.data)
        if (result.data) {
            return result?.data
        } else {
            const client = await fetchWithTimeout(`${process.env.tgcms}/forward?url=${url}`);
            console.log(client.data)
            return client?.data
        }
    } catch (error) {
        const client = await fetchWithTimeout(`${process.env.promoteChecker}/bridge/forward?url=${url}`);
        console.log(client.data)
        return client?.data
    }
}