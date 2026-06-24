import { Router } from "express";
import { User } from "../models/User.js";
import { authenticate, signToken } from "../middleware/auth.js";
import { formatDoc } from "../utils/helpers.js";

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const { email, password, full_name, role = "tenant" } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!["tenant", "owner", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const user = await User.create({
      email,
      password,
      full_name: full_name || null,
      roles: [role],
    });

    const token = signToken(user);
    const formatted = formatDoc(user);

    res.status(201).json({
      token,
      user: {
        id: formatted.id,
        email: formatted.email,
        full_name: formatted.full_name,
        phone: formatted.phone,
        avatar_url: formatted.avatar_url,
        roles: formatted.roles,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user);
    const formatted = formatDoc(user);

    res.json({
      token,
      user: {
        id: formatted.id,
        email: formatted.email,
        full_name: formatted.full_name,
        phone: formatted.phone,
        avatar_url: formatted.avatar_url,
        roles: formatted.roles,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const formatted = formatDoc(user);
    res.json({
      user: {
        id: formatted.id,
        email: formatted.email,
        full_name: formatted.full_name,
        phone: formatted.phone,
        avatar_url: formatted.avatar_url,
        roles: formatted.roles,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/profile", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (req.body.fullName !== undefined) user.full_name = req.body.fullName;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    await user.save();

    const formatted = formatDoc(user);
    res.json({
      user: {
        id: formatted.id,
        email: formatted.email,
        full_name: formatted.full_name,
        phone: formatted.phone,
        avatar_url: formatted.avatar_url,
        roles: formatted.roles,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
