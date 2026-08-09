const requireOrgAccess = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }


    if (req.user.role === "super_admin") {
      return next();
    }


    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: "Forbidden: You do not have permission to execute this operation" 
      });
    }


    if (req.user.role === "org_admin" && (!req.user.organizations || req.user.organizations.length === 0)) {
      return res.status(400).json({ 
        message: "Bad Request: User profile is not linked to an active organization workspace" 
      });
    }

    next();
  };
};

module.exports = requireOrgAccess;