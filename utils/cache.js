import redisClient from "../config/redis.js";

const CACHE_TTL = 60;

export const getAnalyticsCacheKeys = (userId) => ({
  total: `analytics:total:${userId}`,
  category: `analytics:category:${userId}`,
  monthly: `analytics:monthly:${userId}`,
});

export const getCache = async (key) => {
  if (!redisClient.isReady) return null;
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.error("Cache read failed:", err.message);
    return null;
  }
};

export const setCache = async (key, data) => {
  if (!redisClient.isReady) return;
  try {
    await redisClient.setEx(key, CACHE_TTL, JSON.stringify(data));
  } catch (err) {
    console.error("Cache write failed:", err.message);
  }
};

export const invalidateAnalyticsCache = async (userId) => {
  if (!redisClient.isReady) return;
  try {
    const keys = getAnalyticsCacheKeys(userId);
    await redisClient.del([keys.total, keys.category, keys.monthly]);
  } catch (err) {
    console.error("Cache delete failed:", err.message);
  }
};