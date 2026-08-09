const rateLimitWindow = 60 * 1000; 
const maxRequestsPerWindow = 30;   

const ipCache = new Map();

const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const currentTime = Date.now();

  if (!ipCache.has(ip)) {
    ipCache.set(ip, []);
  }

  let requestTimestamps = ipCache.get(ip);


  requestTimestamps = requestTimestamps.filter(
    (timestamp) => currentTime - timestamp < rateLimitWindow
  );

  if (requestTimestamps.length >= maxRequestsPerWindow) {
    return res.status(429).json({
      message: "Too many requests. Please slow down and try again in a minute.",
    });
  }

  requestTimestamps.push(currentTime);
  ipCache.set(ip, requestTimestamps);

  next();
};


setInterval(() => {
  const currentTime = Date.now();
  for (const [ip, timestamps] of ipCache.entries()) {
    const freshTimestamps = timestamps.filter(
      (timestamp) => currentTime - timestamp < rateLimitWindow
    );
    if (freshTimestamps.length === 0) {
      ipCache.delete(ip);
    } else {
      ipCache.set(ip, freshTimestamps);
    }
  }
}, 10 * 60 * 1000);

module.exports = rateLimiter;