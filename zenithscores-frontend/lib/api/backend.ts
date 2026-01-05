const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!;

export async function getQuote(params: URLSearchParams) {
    return fetch(`${BACKEND}/quote?${params.toString()}`).then(r => r.json());
}

export async function swap(body: any) {
    return fetch(`${BACKEND}/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }).then(r => r.json());
}

export async function getTokens() {
    return fetch(`${BACKEND}/token-list`).then(r => r.json());
}
