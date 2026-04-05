import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import pool from "./db";

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

async function getUserFromToken(token: string) {
  const result = await pool.query(
    `SELECT u.id, u.email, u.name, u.avatar
     FROM users u
     JOIN user_sessions s ON s.user_id = u.id
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token]
  );
  return result.rows[0] || null;
}

export function registerAuthRoutes(app: Express) {
  // Register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, name, password, avatar = "lotus", recoveryQuestion, recoveryAnswer } = req.body;

      if (!email || !name || !password) {
        return res.status(400).json({ error: "Email, name and password are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const answerHash = (recoveryQuestion && recoveryAnswer)
        ? await bcrypt.hash(recoveryAnswer.trim().toLowerCase(), 10)
        : null;

      const userResult = await pool.query(
        `INSERT INTO users (email, name, password_hash, avatar, recovery_question, recovery_answer_hash)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, name, avatar`,
        [email.toLowerCase(), name.trim(), passwordHash, avatar, recoveryQuestion || null, answerHash]
      );
      const user = userResult.rows[0];

      const token = generateToken();
      await pool.query(
        `INSERT INTO user_sessions (user_id, token) VALUES ($1, $2)`,
        [user.id, token]
      );

      return res.json({ user, token });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const result = await pool.query(
        "SELECT id, email, name, avatar, password_hash FROM users WHERE email = $1",
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "No account found with this email" });
      }

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: "Incorrect password" });
      }

      const token = generateToken();
      await pool.query(
        `INSERT INTO user_sessions (user_id, token) VALUES ($1, $2)`,
        [user.id, token]
      );

      const { password_hash, ...safeUser } = user;
      return res.json({ user: safeUser, token });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Login failed. Please try again." });
    }
  });

  // Get current user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) return res.status(401).json({ error: "No token" });

      const user = await getUserFromToken(token);
      if (!user) return res.status(401).json({ error: "Invalid or expired session" });

      return res.json({ user });
    } catch (err) {
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token) {
        await pool.query("DELETE FROM user_sessions WHERE token = $1", [token]);
      }
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Update profile
  app.put("/api/auth/profile", async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) return res.status(401).json({ error: "No token" });

      const user = await getUserFromToken(token);
      if (!user) return res.status(401).json({ error: "Invalid session" });

      const { name, avatar } = req.body;
      await pool.query(
        "UPDATE users SET name = COALESCE($1, name), avatar = COALESCE($2, avatar) WHERE id = $3",
        [name || null, avatar || null, user.id]
      );

      const updated = await pool.query(
        "SELECT id, email, name, avatar FROM users WHERE id = $1",
        [user.id]
      );

      return res.json({ user: updated.rows[0] });
    } catch (err) {
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Sync progress — upload
  app.post("/api/user/sync", async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) return res.status(401).json({ error: "No token" });

      const user = await getUserFromToken(token);
      if (!user) return res.status(401).json({ error: "Invalid session" });

      const { data } = req.body as { data: Record<string, string> };
      if (!data || typeof data !== "object") {
        return res.status(400).json({ error: "Invalid data" });
      }

      for (const [key, value] of Object.entries(data)) {
        await pool.query(
          `INSERT INTO user_progress (user_id, data_key, data_value, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id, data_key)
           DO UPDATE SET data_value = $3, updated_at = NOW()`,
          [user.id, key, typeof value === "string" ? value : JSON.stringify(value)]
        );
      }

      return res.json({ success: true });
    } catch (err) {
      console.error("Sync error:", err);
      return res.status(500).json({ error: "Sync failed" });
    }
  });

  // Sync progress — download
  app.get("/api/user/sync", async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) return res.status(401).json({ error: "No token" });

      const user = await getUserFromToken(token);
      if (!user) return res.status(401).json({ error: "Invalid session" });

      const result = await pool.query(
        "SELECT data_key, data_value FROM user_progress WHERE user_id = $1",
        [user.id]
      );

      const data: Record<string, string> = {};
      for (const row of result.rows) {
        data[row.data_key] = row.data_value;
      }

      return res.json({ data });
    } catch (err) {
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Get security question for an email (does not confirm account exists to prevent enumeration)
  app.get("/api/auth/security-question", async (req: Request, res: Response) => {
    try {
      const email = (req.query.email as string || "").toLowerCase().trim();
      if (!email) return res.status(400).json({ error: "Email is required" });

      const result = await pool.query(
        "SELECT recovery_question FROM users WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0 || !result.rows[0].recovery_question) {
        return res.status(404).json({ error: "No security question set for this account" });
      }

      return res.json({ question: result.rows[0].recovery_question });
    } catch (err) {
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Reset password using security answer
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, answer, newPassword } = req.body;

      if (!email || !answer || !newPassword) {
        return res.status(400).json({ error: "Email, answer and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const result = await pool.query(
        "SELECT id, recovery_answer_hash FROM users WHERE email = $1",
        [email.toLowerCase().trim()]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "No account found with this email" });
      }

      const user = result.rows[0];
      if (!user.recovery_answer_hash) {
        return res.status(400).json({ error: "No security question set for this account" });
      }

      const valid = await bcrypt.compare(answer.trim().toLowerCase(), user.recovery_answer_hash);
      if (!valid) {
        return res.status(401).json({ error: "Incorrect answer. Please try again." });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, user.id]);
      // Invalidate all existing sessions for security
      await pool.query("DELETE FROM user_sessions WHERE user_id = $1", [user.id]);

      return res.json({ success: true });
    } catch (err) {
      console.error("Reset password error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });
}
