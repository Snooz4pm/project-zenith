/**
 * 🔓 ZENITHSCORES SECURITY UTILITIES
 * Core encryption and security helpers
 */

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-fallback-32-byte-key-here-!!!'; // Must be 32 chars
const IV_LENGTH = 16;

/**
 * Encrypt a sensitive string (e.g. API Key)
 * Uses AES-256-CBC
 */
export function encrypt(text: string): string {
    if (!text) return '';

    // Ensure key is 32 bytes
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypt a sensitive string
 */
export function decrypt(text: string): string {
    if (!text) return '';

    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');

        // Ensure key is 32 bytes
        const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();

        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (error) {
        console.error('Decryption failed:', error);
        return 'DECRYPTION_ERROR';
    }
}

/**
 * Sanitize user input for community feed
 */
export function sanitize(text: string): string {
    if (!text) return '';
    // Basic regex-based sanitization for prototype
    return text
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
        .replace(/[<>]/g, (tag) => ({
            '<': '&lt;',
            '>': '&gt;'
        }[tag as '<' | '>'] || tag));
}

/**
 * Mask an API key for safe display (e.g. "zen_...1234")
 */
export function maskKey(key: string): string {
    if (!key || key.length < 8) return '****';
    return key.substring(0, 4) + '...' + key.substring(key.length - 4);
}
