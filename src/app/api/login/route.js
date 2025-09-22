/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication APIs
 *
 * /api/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: JWT token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid email or password
 */
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET;
  if (!secret || typeof secret !== "string" || secret.trim().length === 0) {
    throw new Error("Missing JWT secret. Set JWT_SECRET in .env.local");
  }
  return secret;
}

async function parseRequestBody(req) {
  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      return await req.json();
    }
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await req.formData();
      const data = {};
      for (const [key, value] of form.entries()) {
        data[key] = typeof value === "string" ? value : value.name || "";
      }
      return data;
    }
    const raw = await req.text();
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    throw new Error("Invalid request body. Ensure valid JSON or form data.");
  }
}

export async function POST(req) {
  await connectDB();
  try {
    const body = await parseRequestBody(req);
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // First, check if the email matches any user
    if (!user) {
      return NextResponse.json(
        { message: "Email not found" },
        { status: 401 }
      );
    }

    // Then, check if the password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Incorrect password" },
        { status: 401 }
      );
    }

    const secret = getJwtSecret();

    // Add all user info (except password) to the token
    const { _id, firstName, lastName, email: userEmail, accountType, phoneNumber, companyName, brandImage, companyInfo } = user;
    const tokenPayload = {
      id: _id.toString(),
      firstName,
      lastName,
      email: userEmail,
      accountType,
      phoneNumber,
      companyName,
      brandImage,
      companyInfo,
    };

    const token = jwt.sign(tokenPayload, secret, { expiresIn: "7d" });

    return NextResponse.json(
      {
        message: "Login successful",
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error?.message || "Login failed";
    return NextResponse.json({ message }, { status: 400 });
  }
}
