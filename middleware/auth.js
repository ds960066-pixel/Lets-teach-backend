// middleware/auth.js

exports.requireRole = (requiredRole) => {
  return (req, res, next) => {
    const role = req.headers["x-role"];
    const uid = req.headers["x-uid"];

    if (!role || !uid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing headers"
      });
    }

    if (role !== requiredRole) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Invalid role"
      });
    }

    req.user = { role, uid };
    next();
  };
};
