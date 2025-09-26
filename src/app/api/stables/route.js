/**
 * @swagger
 * tags:
 *   - name: Stables
 *     description: Stable listings and booking slots
 *
 * /api/stables:
 *   get:
 *     summary: List stables
 *     tags: [Stables]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter stables by owning user id
 *     responses:
 *       200:
 *         description: List of stables
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Stable'
 *   post:
 *     summary: Create a stable
 *     tags: [Stables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StableInput'
 *     responses:
 *       201:
 *         description: Stable created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stable'
 *       400:
 *         description: Validation error
 */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Stable from "@/models/Stables";
import "@/models/User";

export async function GET(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const query = {};
    if (userId) query.userId = userId;
    const stables = await Stable.find(query).populate({ path: "userId", select: "firstName lastName email" });
    return NextResponse.json(stables, { status: 200 });
  } catch (error) {
    const message = error?.message || "Failed to fetch stables";
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
    const { userId, Tittle, Deatils, location, coordinates, image, Rating, PriceRate, Slotes, status } = body || {};

    if (!userId || !Tittle || !Deatils) {
      return NextResponse.json({ message: "userId, Tittle, Deatils are required" }, { status: 400 });
    }
 
    const normalizedSlotes = typeof Slotes === "string" ? JSON.parse(Slotes) : Slotes;
    const normalizedPriceRate = typeof PriceRate === "string" ? JSON.parse(PriceRate) : PriceRate;

    const stable = await Stable.create({
      userId,
      Tittle: String(Tittle).trim(),
      Deatils: String(Deatils).trim(),
      location: location ? String(location).trim() : "",
      coordinates: coordinates || null,
      image: Array.isArray(image) ? image : image ? [image] : [],
      Rating: Rating === undefined ? undefined : Number(Rating),
      status: status || "active",
      PriceRate: Array.isArray(normalizedPriceRate)
        ? normalizedPriceRate.map(s => ({
            PriceRate: Number(s?.PriceRate),
            RateType: String(s?.RateType),
          }))
        : normalizedPriceRate && typeof normalizedPriceRate === "object"
          ? [{
              PriceRate: Number(normalizedPriceRate?.PriceRate),
              RateType: String(normalizedPriceRate?.RateType),
            }]
          : [],
      Slotes: Array.isArray(normalizedSlotes) ? normalizedSlotes.map(s => ({
        date: String(s?.date),
        startTime: String(s?.startTime),
        endTime: String(s?.endTime),
      })) : [],
    });

    return NextResponse.json(stable, { status: 201 });
  } catch (error) {
    const message = error?.message || "Failed to create stable";
    return NextResponse.json({ message }, { status: 400 });
  }
}