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
 *             $ref: '#/components/schemas/TrainerInput'
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
    const { userId, title, details, price, schedule, images, experience, status } = body || {};

    if (!userId || !title || !details || price === undefined || !schedule) {
      return NextResponse.json({ message: "userId, title, details, price, schedule are required" }, { status: 400 });
    }

    // If schedule is coming as JSON string, parse it
    const normalizedSchedule = typeof schedule === "string" ? JSON.parse(schedule) : schedule;

    const trainer = await Trainer.create({
      userId,
      title: String(title).trim(),
      details: String(details).trim(),
      price: Number(price),
      schedule: {
        day: normalizedSchedule?.day,
        startTime: normalizedSchedule?.startTime,
        endTime: normalizedSchedule?.endTime,
      },
      Experience: String(experience).trim(),
      status: status || "active",
      images: Array.isArray(images) ? images : images ? [images] : [],
    });

    return NextResponse.json(trainer, { status: 201 });
  } catch (error) {
    const message = error?.message || "Failed to create trainer";
    return NextResponse.json({ message }, { status: 400 });
  }
}