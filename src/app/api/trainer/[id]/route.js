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
 *             type: object
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
 *                 enum: [active, inactive]
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
    const { 
      title, 
      details, 
      location, 
      coordinates, 
      price, 
      schedule, 
      images, 
      userId, 
      experience, 
      Experience, 
      status 
    } = body || {};

    // Handle both experience and Experience for backward compatibility
    const experienceValue = experience !== undefined ? experience : Experience;

    // Validate coordinates structure if provided
    if (coordinates !== undefined) {
      if (!coordinates.lat || !coordinates.lng) {
        return NextResponse.json({ 
          message: "coordinates must have lat and lng properties" 
        }, { status: 400 });
      }
    }

    // Validate schedule structure if provided
    let normalizedSchedule = null;
    if (schedule !== undefined) {
      normalizedSchedule = typeof schedule === "string" ? JSON.parse(schedule) : schedule;
      if (!normalizedSchedule?.day || !normalizedSchedule?.startTime || !normalizedSchedule?.endTime) {
        return NextResponse.json({ 
          message: "schedule must have day, startTime, and endTime properties" 
        }, { status: 400 });
      }
    }

    const update = {};
    
    // Update fields only if they are provided
    if (userId !== undefined) update.userId = userId;
    if (title !== undefined) update.title = String(title).trim();
    if (details !== undefined) update.details = String(details).trim();
    if (location !== undefined) update.location = String(location).trim();
    if (coordinates !== undefined) {
      update.coordinates = {
        lat: Number(coordinates.lat),
        lng: Number(coordinates.lng)
      };
    }
    if (price !== undefined) update.price = Number(price);
    if (normalizedSchedule !== undefined) {
      update.schedule = {
        day: String(normalizedSchedule.day).trim(),
        startTime: String(normalizedSchedule.startTime).trim(),
        endTime: String(normalizedSchedule.endTime).trim(),
      };
    }
    if (images !== undefined) {
      update.images = Array.isArray(images) 
        ? images.filter(img => img && img.trim()) 
        : images 
          ? [String(images).trim()] 
          : [];
    }
    if (experienceValue !== undefined) update.Experience = String(experienceValue).trim();
    if (status !== undefined) update.status = status;

    const trainer = await Trainer.findByIdAndUpdate(id, update, { 
      new: true, 
      runValidators: true 
    }).populate({ 
      path: "userId", 
      select: "firstName lastName email" 
    });
    
    if (!trainer) return NextResponse.json({ message: "Trainer not found" }, { status: 404 });
    return NextResponse.json(trainer, { status: 200 });
  } catch (error) {
    console.error('Trainer update error:', error);
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


