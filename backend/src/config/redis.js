const IORedis = require("ioredis");

const redisConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisConnection.on("connect", () => {
  console.log("Redis Uplink: Connected successfully...");
});

redisConnection.on("error", (err) => {
  console.error("Redis Uplink Error:", err.message);
});

module.exports = redisConnection;
