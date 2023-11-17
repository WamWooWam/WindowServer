export async function NtAwait<T>(t : T | Promise<T>): Promise<T> {
    if (t && typeof t === 'object' && 'then' in t && typeof t.then === 'function')
        return await t;
    else
        return t;
}