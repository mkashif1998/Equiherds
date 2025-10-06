/**
 * @swagger
 * tags:
 *   - name: User Payments
 *     description: User payment management APIs
 *
 * /api/users/payments:
 *   post:
 *     summary: Add a new payment record to user
 *     tags: [User Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - paymentId
 *               - amount
 *               - currency
 *               - status
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to add payment to
 *               paymentId:
 *                 type: string
 *                 description: Stripe payment intent ID
 *               amount:
 *                 type: number
 *                 description: Payment amount in cents
 *               currency:
 *                 type: string
 *                 description: Payment currency
 *               status:
 *                 type: string
 *                 description: Payment status
 *               subscriptionId:
 *                 type: string
 *                 description: Associated subscription ID
 *               subscriptionStatus:
 *                 type: string
 *                 description: Subscription status
 *               subscriptionExpiry:
 *                 type: string
 *                 description: Subscription expiry date
 *     responses:
 *       200:
 *         description: Payment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
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

export async function POST(req) {
  await connectDB();
  try {
    const body = await parseRequestBody(req);
    const {
      userId,
      paymentId,
      amount,
      currency,
      status,
      subscriptionId,
      subscriptionStatus,
      subscriptionExpiry
    } = body;

    // Validate required fields
    if (!userId || !paymentId || !amount || !currency || !status) {
      return NextResponse.json(
        { message: "Missing required fields: userId, paymentId, amount, currency, status" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Create payment record
    const paymentRecord = {
      paymentId,
      date: new Date(),
      amount,
      currency,
      status,
      subscriptionId: subscriptionId || null,
      subscriptionStatus: subscriptionStatus || null,
      subscriptionExpiry: subscriptionExpiry || null
    };

    // Add payment to user's payments array (don't replace, just add)
    user.payments.push(paymentRecord);

    // Update subscription status if provided
    if (subscriptionStatus) {
      user.subscriptionStatus = subscriptionStatus;
    }
    if (subscriptionExpiry) {
      user.subscriptionExpiry = subscriptionExpiry;
    }

    // Ensure user has a status (required field)
    if (!user.status) {
      user.status = 'active';
    }

    // Save the updated user
    await user.save();

    // Return updated user without password
    const safeUser = user.toJSON();
    return NextResponse.json(
      { 
        message: "Payment added successfully", 
        user: safeUser 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding payment:", error);
    return NextResponse.json(
      { message: error.message || "Failed to add payment" },
      { status: 400 }
    );
  }
}
