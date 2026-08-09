const { Queue } = require("bullmq");
const redisConnection = require("../config/redis");

const submissionQueue = new Queue("executeCode", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

module.exports = submissionQueue;