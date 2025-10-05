/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User management APIs
 *
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: false
 *         schema:
 *           type: string
 *         description: If provided, returns a single user by id
 *       - in: query
 *         name: accountType
 *         required: false
 *         schema:
 *           type: string
 *           enum: [buyer, seller, superAdmin]
 *         description: Filter users by account type
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 - $ref: '#/components/schemas/User'
 *
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - accountType
 *               - phoneNumber
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               accountType:
 *                 type: string
 *                 enum: [buyer, seller, superAdmin]
 *               phoneNumber:
 *                 type: string
 *               password:
 *                 type: string
 *               companyName:
 *                 type: string
 *               brandImage:
 *                 type: string
 *               companyInfo:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 *
 *   put:
 *     summary: Update a user by ID
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: false
 *         schema:
 *           type: string
 *         description: User id to update (can also be provided in body)
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               accountType:
 *                 type: string
 *                 enum: [buyer, seller, superAdmin]
 *               phoneNumber:
 *                 type: string
 *               password:
 *                 type: string
 *               companyName:
 *                 type: string
 *               brandImage:
 *                 type: string
 *               companyInfo:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended]
 *               subscriptionStatus:
 *                 type: string
 *                 enum: [Active, Expired, Pending]
 *               subscriptionExpiry:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: false
 *         schema:
 *           type: string
 *         description: User id to delete (can also be provided in body)
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: User deleted
 */

import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

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
  } catch (err) {
    throw new Error("Invalid request body. Ensure valid JSON or form data.");
  }
}

export async function GET(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const accountType = searchParams.get("accountType");
    
    if (id) {
      const user = await User.findById(id).select("-password");
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }
      return NextResponse.json(
        { message: "User fetched successfully", user },
        { status: 200 }
      );
    }
    
    // Build query based on filters
    let query = {};
    if (accountType) {
      query.accountType = accountType;
    }
    
    const users = await User.find(query).select("-password");
    return NextResponse.json(
      { message: "Users fetched successfully", users },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to fetch users" },
      { status: 400 }
    );
  }
}

export async function POST(req) {
  await connectDB();
  try {
    const body = await parseRequestBody(req);
    console.log("Received body in API:", body); // Debug log
    const user = new User(body);
    await user.save();
    const safeUser = user.toJSON();
    return NextResponse.json(
      { message: "User created successfully", user: safeUser },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error creating user:", error); // Debug log
    return NextResponse.json(
      { message: error.message || "Failed to create user" },
      { status: 400 }
    );
  }
}

export async function PUT(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get("id");
    const body = await parseRequestBody(req);
    const {
      id: bodyId,
      firstName,
      lastName,
      email,
      accountType,
      phoneNumber,
      password,
      companyName,
      brandImage,
      companyInfo,
      status,
      subscriptionStatus,
      subscriptionExpiry,
    } = body;

    const id = queryId || bodyId;
    if (!id) {
      return NextResponse.json({ message: "Missing user id" }, { status: 400 });
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (accountType !== undefined) updateData.accountType = accountType;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (password !== undefined) updateData.password = password;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (brandImage !== undefined) updateData.brandImage = brandImage;
    if (companyInfo !== undefined) updateData.companyInfo = companyInfo;
    if (status !== undefined) updateData.status = status;
    if (subscriptionStatus !== undefined) updateData.subscriptionStatus = subscriptionStatus;
    if (subscriptionExpiry !== undefined) updateData.subscriptionExpiry = subscriptionExpiry;

    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select("-password");
    return NextResponse.json(
      { message: "User updated successfully", user },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to update user" },
      { status: 400 }
    );
  }
}

export async function DELETE(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");
    if (!id) {
      try {
        const body = await parseRequestBody(req);
        id = body?.id;
      } catch (_) {}
    }
    if (!id) {
      return NextResponse.json({ message: "Missing user id" }, { status: 400 });
    }
    await User.findByIdAndDelete(id);
    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to delete user" },
      { status: 400 }
    );
  }
}
