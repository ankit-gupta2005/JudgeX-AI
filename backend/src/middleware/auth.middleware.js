const jwt = require("jsonwebtoken");
const User = require("../model/user.model");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access Denied: No Token Provided" });
    }

    const secretKey = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secretKey);
    
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User account not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or Expired Security Token" });
  }
};

module.exports = authenticateToken;