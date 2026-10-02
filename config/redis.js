import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: { reconnectStrategy: (retries) => Math.min(retries * 200, 3000) },
});

redisClient.on("error", (err) => console.error("Redis error ->", err.message));

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Redis connected");
  } catch (err) {
    console.error("Redis connection failed:", err.message);
  }
};

export default redisClient;