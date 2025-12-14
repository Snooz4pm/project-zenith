// src/utils.js (Finalized Utilities Module for Protocol Zenith)

import { Redis } from '@upstash/redis'; 
import { env } from 'process';
import 'dotenv/config'; 

// --- 1. Redis Client Setup ---
// Uses the REDIS_URL and REDIS_TOKEN keys for the REST connection
const redisClient = new Redis({
    url: env.REDIS_URL, 
    token: env.REDIS_TOKEN,
});

// --- 2. Structured Logger ---
const logger = {
    info: (event, data = {}) => {
        if (env.NODE_ENV !== 'test') {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'INFO',
                event,
                ...data
            }));
        }
    },
    
    warn: (event, data = {}) => {
        console.warn(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'WARN',
            event,
            ...data
        }));
    },

    error: (event, error, context = {}) => {
        console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            event,
            error: error.message || String(error),
            stack: error.stack,
            ...context
        }));
    },

    metrics: (metrics) => {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'METRICS',
            ...metrics
        }));
    }
};

// --- 3. Export Utilities ---
export { 
    redisClient, 
    logger 
};
