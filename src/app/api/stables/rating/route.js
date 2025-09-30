/**
 * @swagger
 * tags:
 *   - name: Stables
 *     description: Stable listings and booking slots
 *
 * /api/stables/rating:
 *   post:
 *     summary: Update stable rating
 *     tags: [Stables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stableId
 *               - rating
 *             properties:
 *               stableId:
 *                 type: string
 *                 description: The ID of the stable to update rating
 *               rating:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 5
 *                 description: The new rating value (0-5)
 *     responses:
 *       200:
 *         description: Rating updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Stable'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Stable not found
 */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Stable from "@/models/Stables";
import "@/models/User";

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
    if (!raw) return {};
    
    // Try to parse JSON, and if it fails, try to fix common issues
    try {
      return JSON.parse(raw);
    } catch (jsonError) {
      // Try to fix trailing commas and other common JSON issues
      const fixedJson = raw
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Add quotes around unquoted keys
        .replace(/:(\s*)([^",{\[\s][^,}\]\s]*)/g, ': "$2"'); // Add quotes around unquoted string values
      
      try {
        return JSON.parse(fixedJson);
      } catch (secondError) {
        throw new Error(`Invalid JSON format. Original error: ${jsonError.message}`);
      }
    }
  } catch (error) {
    throw new Error(`Invalid request body: ${error.message}`);
  }
}

export async function POST(req) {
  await connectDB();
  try {
    const body = await parseRequestBody(req);
    const { stableId, rating } = body;

    // Validate required fields
    if (!stableId || rating === undefined) {
      return NextResponse.json(
        { success: false, message: "stableId and rating are required" },
        { status: 400 }
      );
    }

    // Validate rating value
    const ratingValue = Number(rating);
    if (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be a number between 0 and 5" },
        { status: 400 }
      );
    }

    // Check if stable exists
    const stable = await Stable.findById(stableId);
    if (!stable) {
      return NextResponse.json(
        { success: false, message: "Stable not found" },
        { status: 404 }
      );
    }

    // Get current rating data
    const currentRating = stable.Rating || 0;
    const currentCustomersCount = stable.noofRatingCustomers || 0;
    
    // Calculate new average rating using the formula: Average Rating = Sum of Ratings / Number of Ratings
    // New Sum = (Current Average × Current Count) + New Rating
    // New Average = New Sum / (Current Count + 1)
    const currentSum = currentRating * currentCustomersCount;
    const newSum = currentSum + ratingValue;
    const newCustomersCount = currentCustomersCount + 1;
    const newAverageRating = newSum / newCustomersCount;

    // Update the stable with new average rating and incremented customer count
    const updatedStable = await Stable.findByIdAndUpdate(
      stableId,
      {
        Rating: newAverageRating,
        noofRatingCustomers: newCustomersCount
      },
      { new: true, runValidators: true }
    ).populate({ path: "userId", select: "firstName lastName email" });

    return NextResponse.json(
      {
        success: true,
        message: "Rating updated successfully",
        data: updatedStable
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating stable rating:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update rating" },
      { status: 500 }
    );
  }
}
