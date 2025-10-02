/**
 * @swagger
 * tags:
 *   - name: Trainers
 *     description: Trainer profiles and schedules
 *
 * /api/trainer:
 *   get:
 *     summary: List trainers
 *     tags: [Trainers]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter trainers by owning user id
 *     responses:
 *       200:
 *         description: List of trainers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trainer'
 *   post:
 *     summary: Create a trainer
 *     tags: [Trainers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *               - details
 *               - price
 *               - schedule
 *               - experience
 *               - location
 *               - coordinates
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID who owns this trainer profile
 *               title:
 *                 type: string
 *                 description: Trainer title/name
 *               details:
 *                 type: string
 *                 description: Trainer details/description
 *               price:
 *                 type: number
 *                 description: Training price
 *               schedule:
 *                 type: object
 *                 required:
 *                   - day
 *                   - startTime
 *                   - endTime
 *                 properties:
 *                   day:
 *                     type: string
 *                   startTime:
 *                     type: string
 *                   endTime:
 *                     type: string
 *               experience:
 *                 type: string
 *                 description: Trainer experience
 *               location:
 *                 type: string
 *                 description: Trainer location
 *               coordinates:
 *                 type: object
 *                 required:
 *                   - lat
 *                   - lng
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of image URLs
 *               status:
 *                 type: string
 *                 default: active
 *                 enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Trainer created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trainer'
 *       400:
 *         description: Validation error
 */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Trainer from "@/models/Trainer";
import "@/models/User";

export async function GET(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const query = {};
    if (userId) query.userId = userId;
    const trainers = await Trainer.find(query).populate({ path: "userId", select: "firstName lastName email" });
    return NextResponse.json(trainers, { status: 200 });
  } catch (error) {
    const message = error?.message || "Failed to fetch trainers";
    return NextResponse.json({ message }, { status: 500 });
  }
}

async function parseBody(req) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return req.json();
  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    const data = {};
    for (const [key, value] of form.entries()) data[key] = typeof value === "string" ? value : value.name || "";
    return data;
  }
  const raw = await req.text();
  return raw ? JSON.parse(raw) : {};
}

export async function POST(req) {
  await connectDB();
  try {
    const body = await parseBody(req);
    const { 
      userId, 
      title, 
      details, 
      price, 
      schedule, 
      images, 
      experience, 
      status, 
      location, 
      coordinates 
    } = body || {};

    // Validate all required fields according to schema
    if (!userId || !title || !details ) {
      return NextResponse.json({ 
        message: "userId, title, details, price, schedule, experience, location, and coordinates are required" 
      }, { status: 400 });
    }

    // Validate coordinates structure
    if (!coordinates.lat || !coordinates.lng) {
      return NextResponse.json({ 
        message: "coordinates must have lat and lng properties" 
      }, { status: 400 });
    }

    // Handle schedule as array
    let normalizedSchedule = [];
    if (Array.isArray(schedule)) {
      normalizedSchedule = schedule;
    } else if (typeof schedule === "string") {
      try {
        const parsed = JSON.parse(schedule);
        normalizedSchedule = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return NextResponse.json({ 
          message: "Invalid schedule format" 
        }, { status: 400 });
      }
    } else if (schedule && typeof schedule === "object") {
      normalizedSchedule = [schedule];
    }

    // Validate schedule structure
    if (normalizedSchedule.length === 0) {
      return NextResponse.json({ 
        message: "At least one schedule slot is required" 
      }, { status: 400 });
    }

    for (const slot of normalizedSchedule) {
      if (!slot?.day || !slot?.startTime || !slot?.endTime) {
        return NextResponse.json({ 
          message: "Each schedule slot must have day, startTime, and endTime properties" 
        }, { status: 400 });
      }
    }

    const trainer = await Trainer.create({
      userId,
      title: String(title).trim(),
      details: String(details).trim(),
      price: Number(price),
      schedule: normalizedSchedule.map(slot => ({
        day: String(slot.day).trim(),
        startTime: String(slot.startTime).trim(),
        endTime: String(slot.endTime).trim(),
      })),
      Experience: String(experience).trim(),
      location: String(location).trim(),
      coordinates: {
        lat: Number(coordinates.lat),
        lng: Number(coordinates.lng)
      },
      status: status || "active",
      images: Array.isArray(images) ? images.filter(img => img && img.trim()) : images ? [String(images).trim()] : [],
    });

    // Populate the userId field before returning
    const populatedTrainer = await Trainer.findById(trainer._id).populate({ 
      path: "userId", 
      select: "firstName lastName email" 
    });

    return NextResponse.json(populatedTrainer, { status: 201 });
  } catch (error) {
    console.error('Trainer creation error:', error);
    const message = error?.message || "Failed to create trainer";
    return NextResponse.json({ message }, { status: 400 });
  }
}