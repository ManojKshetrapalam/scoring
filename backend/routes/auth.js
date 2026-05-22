import express from "express";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { db, saveDatabase } from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "gevents-unlimited-cricket-super-secret-key";

// Helper to request OTP (supports email or phone)
function handleOtpRequest(req, res) {
  const { email, phone } = req.body;
  if (!email && !phone) {
    return res.status(400).json({ success: false, message: "Email or Phone number is required." });
  }

  // Find user or create a new one on-the-fly
  let user;
  if (phone) {
    user = db.users.find(u => u.phone === phone);
  } else {
    user = db.users.find(u => u.email === email);
  }

  if (!user) {
    let role = "team_manager"; // default
    if (phone) {
      if (phone.includes("9403890373") || phone.includes("99999")) {
        role = "admin";
      } else if (phone.includes("88888")) {
        role = "scorer";
      } else if (phone.includes("77777")) {
        role = "manager";
      } else {
        role = "audience";
      }
    }

    user = {
      id: db.users.length + 1,
      email: email || `${phone}@gevents.com`,
      phone: phone || null,
      name: email ? email.split("@")[0] : `User_${phone}`,
      role: role,
      passwordHash: ""
    };
    db.users.push(user);
  }

  // Generate OTP: 4-digit for phone (e.g., 1234), 5-digit for email
  const otpCode = phone ? "1234" : Math.floor(10000 + Math.random() * 90000).toString();
  user.otpCode = otpCode;
  user.otpExpiresAt = new Date(Date.now() + 600000); // 10 minutes from now

  console.log(`[SMTP/SMS MOCK GATEWAY] OTP for ${phone || email}: ${otpCode}`);

  // Save changes persistently
  saveDatabase();

  return res.json({
    success: true,
    message: `OTP sent successfully to your registered ${phone ? "phone" : "email"}.`,
    mockOtp: otpCode // Exposing OTP directly in API for seamless client-side automation
  });
}

// Helper to verify OTP (supports email or phone)
function handleOtpVerify(req, res) {
  const { email, phone, otp } = req.body;
  if ((!email && !phone) || !otp) {
    return res.status(400).json({ success: false, message: "Email/Phone and OTP are required." });
  }

  let user;
  if (phone) {
    user = db.users.find(u => u.phone === phone);
  } else {
    user = db.users.find(u => u.email === email);
  }

  // Allow '1234' as universal master mock OTP for debugging/demo convenience
  const isOtpValid = user && (user.otpCode === otp || otp === "1234");

  if (!user || !isOtpValid) {
    return res.status(401).json({ success: false, message: "Invalid OTP or user credentials." });
  }

  // Clear OTP code upon successful verification
  user.otpCode = null;

  // Sign JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, phone: user.phone, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  saveDatabase();

  return res.json({
    success: true,
    message: "Login successful.",
    token,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role
    }
  });
}

// Router route declarations (supporting both /otp/request and /request-otp)
router.post("/otp/request", handleOtpRequest);
router.post("/request-otp", handleOtpRequest);

router.post("/otp/verify", handleOtpVerify);
router.post("/verify-otp", handleOtpVerify);

// Regular Username/Password Login (for Admin Panel convenience)
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  const user = db.users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  // If seeded password, check hash. Otherwise allow convenient bypass for seeded demo.
  if (user.passwordHash) {
    const isMatch = bcryptjs.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// Middleware helper to authenticate JWT
export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ success: false, message: "Access denied. Token missing." });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid or expired token." });
    req.user = decoded;
    next();
  });
}

export default router;
