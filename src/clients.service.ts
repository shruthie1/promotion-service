import { fetchWithTimeout } from "./fetchWithTimeout";

export async function getClient() {
    const result = await fetchWithTimeout(`${process.env.repl}/getme`);
    return result.data
}