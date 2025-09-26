/**
 * @swagger
 * /api/trainer/{id}:
 *   get:
 *     summary: Get a trainer by id
 *     tags: [Trainers]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Trainer found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trainer'
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update a trainer by id
 *     tags: [Trainers]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrainerInput'
 *     responses:
 *       200:
 *         description: Updated trainer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trainer'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete a trainer by id
 *     tags: [Trainers]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       204:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Trainer from "@/models/Trainer";

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

export async function GET(_req, { params }) {
  await connectDB();
  try {
    const { id } = await params;
    const trainer = await Trainer.findById(id).populate({ path: "userId", select: "firstName lastName email" });
    if (!trainer) return NextResponse.json({ message: "Trainer not found" }, { status: 404 });
    return NextResponse.json(trainer, { status: 200 });
  } catch (error) {
    const message = error?.message || "Failed to fetch trainer";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function PUT(req, { params }) {
  await connectDB();
  try {
    const { id } = await params;
    const body = await parseBody(req);
    const { title, details, location, coordinates, price, schedule, images, userId, Experience, status } = body || {};

    const normalizedSchedule = typeof schedule === "string" ? JSON.parse(schedule) : schedule;

    const update = {};
    if (userId !== undefined) update.userId = userId;
    if (title !== undefined) update.title = String(title).trim();
    if (details !== undefined) update.details = String(details).trim();
    if (location !== undefined) update.location = String(location).trim();
    if (coordinates !== undefined) update.coordinates = coordinates;
    if (price !== undefined) update.price = Number(price);
    if (normalizedSchedule !== undefined) {
      update.schedule = {
        day: normalizedSchedule?.day,
        startTime: normalizedSchedule?.startTime,
        endTime: normalizedSchedule?.endTime,
      };
    }
    if (images !== undefined) update.images = Array.isArray(images) ? images : images ? [images] : [];
    if (Experience !== undefined) update.Experience = String(Experience).trim();
    if (status !== undefined) update.status = status;
    const trainer = await Trainer.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!trainer) return NextResponse.json({ message: "Trainer not found" }, { status: 404 });
    return NextResponse.json(trainer, { status: 200 });
  } catch (error) {
    const message = error?.message || "Failed to update trainer";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function DELETE(_req, { params }) {
  await connectDB();
  try {
    const { id } = await params;
    const result = await Trainer.findByIdAndDelete(id);
    if (!result) return NextResponse.json({ message: "Trainer not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error?.message || "Failed to delete trainer";
    return NextResponse.json({ message }, { status: 400 });
  }
}


