// lib/utils.js - Utilities for frontend API routes

import { Redis } from '@upstash/redis';

// Initialize Redis client (server-side only)
export const redisClient = new Redis({
    url: process.env.REDIS_URL,
    token: process.env.REDIS_TOKEN,
});

// Simple structured logger
export const logger = {
    info: (message, data = {}) => {
        console.log(`[INFO] ${message}`, JSON.stringify(data));
    },
    warn: (message, data = {}) => {
        console.warn(`[WARN] ${message}`, JSON.stringify(data));
    },
    error: (message, data = {}) => {
        console.error(`[ERROR] ${message}`, JSON.stringify(data));
    },
};
