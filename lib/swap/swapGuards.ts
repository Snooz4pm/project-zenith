export function canQuote(from?: string, to?: string) {
    if (!from || !to) return false
    if (from === to) return false
    return true
}
