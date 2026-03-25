// lib/rate-limit.ts

/**
 * Sliding Window Rate Limiter (In-Memory)
 * Note: For production scalability across multiple serverless instances, 
 * use a Redis-based solution like Upstash Ratelimit.
 */

interface RateLimitData {
    timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitData>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
if (typeof global !== 'undefined' && !(global as any)._rateLimitCleanup) {
    (global as any)._rateLimitCleanup = setInterval(() => {
        const now = Date.now();
        for (const [key, data] of rateLimitStore.entries()) {
            // If the last timestamp is older than 5 minutes, delete the entry
            if (data.timestamps.length === 0 || now - data.timestamps[data.timestamps.length - 1] > 300000) {
                rateLimitStore.delete(key);
            }
        }
    }, 300000);
}

/**
 * Checks if a request should be rate-limited.
 * @param key Unique identifier for the client (e.g., IP or User ID)
 * @param limit Maximum number of requests allowed in the window
 * @param windowMs Time window in milliseconds (default: 1 minute)
 * @returns true if rate-limited (blocked), false if allowed.
 */
export async function isRateLimited(key: string, limit: number, windowMs: number = 60000): Promise<boolean> {
    const now = Date.now();
    const data = rateLimitStore.get(key) || { timestamps: [] };

    // Filter out timestamps older than the current window
    const recentTimestamps = data.timestamps.filter(ts => now - ts < windowMs);

    if (recentTimestamps.length >= limit) {
        // Update the store with the cleaned up timestamps even if blocked
        rateLimitStore.set(key, { timestamps: recentTimestamps });
        return true;
    }

    // Add current timestamp and save
    recentTimestamps.push(now);
    rateLimitStore.set(key, { timestamps: recentTimestamps });
    
    return false;
}

// Backward compatibility for existing placeholder (if any)
export async function checkRateLimit(ip: string): Promise<boolean> {
    const limited = await isRateLimited(ip, 60); // Default 60 requests/min
    return !limited;
}
