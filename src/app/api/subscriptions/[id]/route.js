/**
 * @swagger
 * tags:
 *   - name: Subscription
 *     description: Subscription management APIs
 *
 * /api/subscriptions/{id}:
 *   get:
 *     summary: Get a subscription by ID
 *     tags: [Subscription]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *       404:
 *         description: Subscription not found
 *
 *   put:
 *     summary: Update a subscription by ID
 *     tags: [Subscription]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Premium Plan Updated"
 *               price:
 *                 type: number
 *                 example: 129.99
 *               discount:
 *                 type: number
 *                 example: 15
 *               duration:
 *                 type: number
 *                 example: 60
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *       404:
 *         description: Subscription not found
 *
 *   delete:
 *     summary: Delete a subscription by ID
 *     tags: [Subscription]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Subscription not found
 */

import connectDB from "@/lib/db";
import Subscription from "@/models/Subscription";
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

export async function GET(req, { params }) {
  await connectDB();
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ message: "Missing subscription id" }, { status: 400 });
    }
    
    const subscription = await Subscription.findById(id);
    
    if (!subscription) {
      return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { message: "Subscription fetched successfully", subscription },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to fetch subscription" },
      { status: 400 }
    );
  }
}

export async function PUT(req, { params }) {
  await connectDB();
  try {
    const { id } = params;
    const body = await parseRequestBody(req);
    const { name, price, discount, duration } = body;

    if (!id) {
      return NextResponse.json({ message: "Missing subscription id" }, { status: 400 });
    }

    // Validate data types if provided
    if (price !== undefined && (typeof price !== "number" || price < 0)) {
      return NextResponse.json(
        { message: "Price must be a positive number" },
        { status: 400 }
      );
    }
    
    if (duration !== undefined && (typeof duration !== "number" || duration <= 0)) {
      return NextResponse.json(
        { message: "Duration must be a positive number" },
        { status: 400 }
      );
    }
    
    if (discount !== undefined && (typeof discount !== "number" || discount < 0)) {
      return NextResponse.json(
        { message: "Discount must be a positive number" },
        { status: 400 }
      );
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (discount !== undefined) updateData.discount = discount;
    if (duration !== undefined) updateData.duration = duration;

    const subscription = await Subscription.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!subscription) {
      return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { message: "Subscription updated successfully", subscription },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to update subscription" },
      { status: 400 }
    );
  }
}

export async function DELETE(req, { params }) {
  await connectDB();
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ message: "Missing subscription id" }, { status: 400 });
    }
    
    const subscription = await Subscription.findByIdAndDelete(id);
    
    if (!subscription) {
      return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
    }
    
    return NextResponse.json(
      { message: "Subscription deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to delete subscription" },
      { status: 400 }
    );
  }
}
