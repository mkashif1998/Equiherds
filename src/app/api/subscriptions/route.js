/**
 * @swagger
 * tags:
 *   - name: Subscription
 *     description: Subscription management APIs
 *
 * /api/subscriptions:
 *   get:
 *     summary: Get all subscriptions
 *     tags: [Subscription]
 *     responses:
 *       200:
 *         description: List of subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subscription'
 *
 *   post:
 *     summary: Create a new subscription
 *     tags: [Subscription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - duration
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Premium Plan"
 *               price:
 *                 type: number
 *                 example: 99.99
 *               discount:
 *                 type: number
 *                 example: 10
 *               duration:
 *                 type: number
 *                 example: 30
 *               description:
 *                 type: object
 *                 example: {"total horses": 5, "quantity": 5}
 *     responses:
 *       201:
 *         description: Subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *
 */

import connectDB from "@/lib/db";
import Subscription from "@/models/Subscription";
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
    const subscriptions = await Subscription.find();
    
    // Get user counts for each subscription plan
    const subscriptionsWithUserCount = await Promise.all(
      subscriptions.map(async (subscription) => {
        // Count users who have this subscription in their payments
        const userCount = await User.countDocuments({
          'payments.subscriptionId': subscription._id
        });
        
        return {
          ...subscription.toObject(),
          userCount
        };
      })
    );
    
    return NextResponse.json(
      { message: "Subscriptions fetched successfully", subscriptions: subscriptionsWithUserCount },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to fetch subscriptions" },
      { status: 400 }
    );
  }
}

export async function POST(req) {
  await connectDB();
  try {
    const body = await parseRequestBody(req);
    console.log("Received body in API:", body); // Debug log
    
    // Validate required fields
    const { name, price, duration } = body;
    if (!name || !price || !duration) {
      return NextResponse.json(
        { message: "Missing required fields: name, price, and duration are required" },
        { status: 400 }
      );
    }
    
    // Validate data types
    if (typeof price !== "number" || price < 0) {
      return NextResponse.json(
        { message: "Price must be a positive number" },
        { status: 400 }
      );
    }
    
    if (typeof duration !== "number" || duration <= 0) {
      return NextResponse.json(
        { message: "Duration must be a positive number" },
        { status: 400 }
      );
    }
    
    if (body.discount && (typeof body.discount !== "number" || body.discount < 0)) {
      return NextResponse.json(
        { message: "Discount must be a positive number" },
        { status: 400 }
      );
    }
    
    // Validate description if provided
    if (body.description && typeof body.description !== "object") {
      return NextResponse.json(
        { message: "Description must be a valid JSON object" },
        { status: 400 }
      );
    }
    
    const subscription = new Subscription(body);
    await subscription.save();
    
    return NextResponse.json(
      { message: "Subscription created successfully", subscription },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error creating subscription:", error); // Debug log
    return NextResponse.json(
      { message: error.message || "Failed to create subscription" },
      { status: 400 }
    );
  }
}

