import express from "express";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { normalizeRole, queryOne } from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "gevents-unlimited-cricket-super-secret-key";
const SCORER_PHONE = "6360200382";
const SCORER_OTP = "1978";
const SCORER_EMAIL = "scorer@gevents.com";
const SCORER_NAME = "Official Scorer";

async function findUser({ email, phone }) {
  if (phone) {
    return queryOne("SELECT * FROM users WHERE phone = $1 LIMIT 1", [phone]);
  }

  return queryOne("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
}

async function createUser({ email, phone }) {
  const name = email ? email.split("@")[0] : `User_${phone}`;
  const role = normalizeRole(phone === SCORER_PHONE ? "scorer" : "team_manager");

  return queryOne(
    `
      INSERT INTO users (email, phone, name, password_hash, role)
      VALUES ($1, $2, $3, $4, $5::user_role)
      RETURNING *
    `,
    [email || `${phone}@gevents.com`, phone || null, name, "", role],
  );
}

async function ensureScorerUser() {
  let scorer = await findUser({ phone: SCORER_PHONE });
  if (scorer) {
    await queryOne(
      `
        UPDATE users
        SET email = $2, name = $3, role = 'scorer', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `,
      [scorer.id, SCORER_EMAIL, SCORER_NAME],
    );
    return findUser({ phone: SCORER_PHONE });
  }

  return queryOne(
    `
      INSERT INTO users (email, phone, name, password_hash, role)
      VALUES ($1, $2, $3, '', 'scorer')
      RETURNING *
    `,
    [SCORER_EMAIL, SCORER_PHONE, SCORER_NAME],
  );
}

async function handleOtpRequest(req, res) {
  try {
    const { email, phone } = req.body;
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: "Email or Phone number is required." });
    }

    let user = phone === SCORER_PHONE
      ? await ensureScorerUser()
      : await findUser({ email, phone });

    if (!user) {
      user = await createUser({ email, phone });
    }

    const otpCode = phone === SCORER_PHONE
      ? SCORER_OTP
      : phone
        ? Math.floor(1000 + Math.random() * 9000).toString()
        : Math.floor(10000 + Math.random() * 90000).toString();
    const otpExpiresAt = new Date(Date.now() + 600000).toISOString();

    await queryOne(
      `
        UPDATE users
        SET otp_code = $2, otp_expires_at = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `,
      [user.id, otpCode, otpExpiresAt],
    );

    console.log(`[SMTP/SMS MOCK GATEWAY] OTP for ${phone || email}: ${otpCode}`);

    return res.json({
      success: true,
      message: `OTP sent successfully to your registered ${phone ? "phone" : "email"}.`,
    });
  } catch (err) {
    console.error("[Auth] OTP request failed:", err);
    return res.status(500).json({ success: false, message: "Failed to request OTP." });
  }
}

async function handleOtpVerify(req, res) {
  try {
    const { email, phone, otp } = req.body;
    if ((!email && !phone) || !otp) {
      return res.status(400).json({ success: false, message: "Email/Phone and OTP are required." });
    }

    const user = phone === SCORER_PHONE
      ? await ensureScorerUser()
      : await findUser({ email, phone });

    const isOtpValid = user && user.otp_code === otp;

    if (!user || !isOtpValid) {
      return res.status(401).json({ success: false, message: "Invalid OTP or user credentials." });
    }

    await queryOne(
      `
        UPDATE users
        SET otp_code = NULL, otp_expires_at = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING id
      `,
      [user.id],
    );

    const token = jwt.sign(
      { userId: user.id, email: user.email, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[Auth] OTP verification failed:", err);
    return res.status(500).json({ success: false, message: "Failed to verify OTP." });
  }
}

router.post("/otp/request", handleOtpRequest);
router.post("/request-otp", handleOtpRequest);

router.post("/otp/verify", handleOtpVerify);
router.post("/verify-otp", handleOtpVerify);

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = await queryOne("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    if (user.password_hash) {
      const isMatch = bcryptjs.compareSync(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid credentials." });
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[Auth] Login failed:", err);
    return res.status(500).json({ success: false, message: "Login failed." });
  }
});

export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied. Token missing." });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid or expired token." });
    }
    req.user = decoded;
    next();
  });
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "You do not have permission to perform this action." });
    }
    next();
  };
}

export default router;
