/**
 * NUCLEAR SAFETY UTILITIES
 * 
 * These functions NEVER throw and always return safe values.
 * Use them when dealing with external data that may be malformed.
 */

/**
 * Strips undefined, null, and primitives from an array.
 * NEVER throws. Returns empty array on any input error.
 */
export function nukeArray<T>(input: any): T[] {
    if (!Array.isArray(input)) return [];

    const out: T[] = [];

    for (let i = 0; i < input.length; i++) {
        const v = input[i];
        if (v && typeof v === 'object') {
            out.push(v);
        }
    }

    return out;
}

/**
 * Safely get a string property from an object.
 * Returns fallback if property doesn't exist or isn't a string.
 */
export function safeString(obj: any, key: string, fallback: string = ''): string {
    if (!obj || typeof obj !== 'object') return fallback;
    const val = obj[key];
    return typeof val === 'string' ? val : fallback;
}

/**
 * Safely get a number property from an object.
 * Returns fallback if property doesn't exist or isn't a number.
 */
export function safeNumber(obj: any, key: string, fallback: number = 0): number {
    if (!obj || typeof obj !== 'object') return fallback;
    const val = Number(obj[key]);
    return isNaN(val) ? fallback : val;
}

/**
 * Safely get an array property from an object.
 * Returns empty array if property doesn't exist or isn't an array.
 */
export function safeArray<T>(obj: any, key: string): T[] {
    if (!obj || typeof obj !== 'object') return [];
    const val = obj[key];
    return Array.isArray(val) ? val : [];
}
