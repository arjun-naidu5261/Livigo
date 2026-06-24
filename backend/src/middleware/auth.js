import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { formatDoc } from "../utils/helpers.js";

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    req.userId = payload.sub;
    req.userRoles = payload.roles || [];
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const token = header.slice(7);
      const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
      req.userId = payload.sub;
      req.userRoles = payload.roles || [];
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const hasRole = roles.some((role) => req.userRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

export async function attachUser(req, _res, next) {
  if (!req.userId) return next();
  const user = await User.findById(req.userId);
  if (user) req.user = formatDoc(user);
  next();
}

export function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), roles: user.roles },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" }
  );
}
