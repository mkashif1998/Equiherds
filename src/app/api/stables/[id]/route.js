/**
 * @swagger
 * /api/stables/{id}:
 *   get:
 *     summary: Get a stable by id
 *     tags: [Stables]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Stable found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stable'
 *       404:
 *         description: Not found
 *   put:
 *     summary: Update a stable by id
 *     tags: [Stables]
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
 *             $ref: '#/components/schemas/StableInput'
 *     responses:
 *       200:
 *         description: Updated stable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stable'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Not found
 *   delete:
 *     summary: Delete a stable by id
 *     tags: [Stables]
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
import Stable from "@/models/Stables";

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
    const stable = await Stable.findById(params.id).populate({ path: "userId", select: "firstName lastName email" });
    if (!stable) return NextResponse.json({ message: "Stable not found" }, { status: 404 });
    return NextResponse.json(stable, { status: 200 });
  } catch (error) {
    const message = error?.message || "Failed to fetch stable";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function PUT(req, { params }) {
  await connectDB();
  try {
    const body = await parseBody(req);
    const { userId, Tittle, Deatils, image, Rating, PriceRate, Slotes } = body || {};

    const update = {};
    if (userId !== undefined) update.userId = userId;
    if (Tittle !== undefined) update.Tittle = String(Tittle).trim();
    if (Deatils !== undefined) update.Deatils = String(Deatils).trim();
    if (image !== undefined) update.image = Array.isArray(image) ? image : image ? [image] : [];
    if (Rating !== undefined) update.Rating = Number(Rating);

    const normalizedPriceRate = typeof PriceRate === "string" ? JSON.parse(PriceRate) : PriceRate;
    if (normalizedPriceRate !== undefined) {
      update.PriceRate = {
        PriceRate: Number(normalizedPriceRate?.PriceRate),
        RateType: String(normalizedPriceRate?.RateType),
      };
    }

    const normalizedSlotes = typeof Slotes === "string" ? JSON.parse(Slotes) : Slotes;
    if (normalizedSlotes !== undefined) {
      update.Slotes = Array.isArray(normalizedSlotes) ? normalizedSlotes.map(s => ({
        date: String(s?.date),
        startTime: String(s?.startTime),
        endTime: String(s?.endTime),
      })) : [];
    }

    const stable = await Stable.findByIdAndUpdate(params.id, update, { new: true, runValidators: true });
    if (!stable) return NextResponse.json({ message: "Stable not found" }, { status: 404 });
    return NextResponse.json(stable, { status: 200 });
  } catch (error) {
    const message = error?.message || "Failed to update stable";
    return NextResponse.json({ message }, { status: 400 });
  }
}

export async function DELETE(_req, { params }) {
  await connectDB();
  try {
    const result = await Stable.findByIdAndDelete(params.id);
    if (!result) return NextResponse.json({ message: "Stable not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error?.message || "Failed to delete stable";
    return NextResponse.json({ message }, { status: 400 });
  }
}


