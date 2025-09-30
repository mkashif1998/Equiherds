/**
 * @swagger
 * tags:
 *   - name: BookingStables
 *     description: Stable booking management
 *
 * /api/bookingStables:
 *   get:
 *     summary: Get all bookings with optional filters
 *     tags: [BookingStables]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter bookings by user ID
 *       - in: query
 *         name: stableId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter bookings by stable ID
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter bookings by client ID
 *       - in: query
 *         name: bookingType
 *         schema:
 *           type: string
 *           enum: [day, week]
 *         required: false
 *         description: Filter bookings by type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Filter bookings that start on or after this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Filter bookings that end on or before this date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         required: false
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         required: false
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of bookings with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BookingStable'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 filters:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     stableId:
 *                       type: string
 *                     clientId:
 *                       type: string
 *                     bookingType:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                     endDate:
 *                       type: string
 *   post:
 *     summary: Create a new booking
 *     tags: [BookingStables]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingStableInput'
 *     responses:
 *       201:
 *         description: Booking created successfully
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
 *                   $ref: '#/components/schemas/BookingStable'
 *       400:
 *         description: Validation error
 *       404:
 *         description: User or stable not found
 */
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BookingStables from "@/models/BookingStables";
import User from "@/models/User";
import Stable from "@/models/Stables";

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
  } catch (_) {
    throw new Error("Invalid request body. Ensure valid JSON or form data.");
  }
}

// GET - Get all bookings or bookings by userId
export async function GET(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const stableId = searchParams.get("stableId");
    const clientId = searchParams.get("clientId");
    const bookingType = searchParams.get("bookingType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Filter by userId if provided
    if (userId) {
      query.userId = userId;
    }
    
    // Filter by stableId if provided
    if (stableId) {
      query.stableId = stableId;
    }
    
    // Filter by clientId if provided
    if (clientId) {
      query.clientId = clientId;
    }
    
    // Filter by bookingType if provided
    if (bookingType) {
      query.bookingType = bookingType;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      if (startDate && endDate) {
        // Validate date format and check for invalid dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Check if dates are valid
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return NextResponse.json(
            { success: false, message: "Invalid date format. Use YYYY-MM-DD format" },
            { status: 400 }
          );
        }
        
        // Check if the parsed date matches the input (catches invalid dates like 2025-09-31)
        const startInput = startDate.split('-');
        const endInput = endDate.split('-');
        
        if (start.getFullYear() != startInput[0] || 
            start.getMonth() + 1 != startInput[1] || 
            start.getDate() != startInput[2]) {
          return NextResponse.json(
            { success: false, message: `Invalid date: ${startDate}. Please use a valid date format.` },
            { status: 400 }
          );
        }
        
        if (end.getFullYear() != endInput[0] || 
            end.getMonth() + 1 != endInput[1] || 
            end.getDate() != endInput[2]) {
          return NextResponse.json(
            { success: false, message: `Invalid date: ${endDate}. Please use a valid date format.` },
            { status: 400 }
          );
        }
        
        // Set end of day for the end date to include the entire day
        end.setHours(23, 59, 59, 999);
        
        
        // Simple overlap logic: booking overlaps if it starts before the end date AND ends after the start date
        query.startDate = { $lte: end };
        query.$or = [
          { endDate: { $gte: start } },
          { endDate: { $exists: false } }
        ];

      } else if (startDate) {
        // Find bookings that start on or after the start date
        query.startDate = { $gte: new Date(startDate) };
      } else if (endDate) {
        // Find bookings that end on or before the end date
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        query.$or = [
          { endDate: { $lte: end } },
          { endDate: { $exists: false } }
        ];
      }
    }



    const bookings = await BookingStables.find(query)
      .populate("userId", "firstName lastName email phoneNumber")
      .populate("clientId", "firstName lastName email phoneNumber _id")
      .populate("stableId", "Tittle Deatils location coordinates PriceRate")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BookingStables.countDocuments(query);


    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        userId,
        stableId,
        clientId,
        bookingType,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST - Create a new booking
export async function POST(req) {
  await connectDB();
  try {
    const body = await parseRequestBody(req);

    const {
      userId,
      stableId,
      bookingType,
      startDate,
      endDate,
      numberOfHorses,
      price,
      totalPrice,
      clientId
    } = body;

    // Validate required fields
    if (!userId || !stableId || !bookingType || !startDate || !numberOfHorses || !price || !totalPrice || !clientId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate bookingType
    if (!["day", "week"].includes(bookingType)) {
      return NextResponse.json(
        { success: false, message: "Invalid booking type. Must be 'day' or 'week'" },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid start date" },
        { status: 400 }
      );
    }

    if (end && isNaN(end.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid end date" },
        { status: 400 }
      );
    }

    if (end && end <= start) {
      return NextResponse.json(
        { success: false, message: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Validate numberOfHorses
    if (numberOfHorses < 1) {
      return NextResponse.json(
        { success: false, message: "Number of horses must be at least 1" },
        { status: 400 }
      );
    }

    // Validate prices
    if (price < 0 || totalPrice < 0) {
      return NextResponse.json(
        { success: false, message: "Prices cannot be negative" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
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

    // Create new booking
    const newBooking = new BookingStables({
      userId,
      stableId,
      bookingType,
      startDate: start,
      endDate: end,
      numberOfHorses,
      price,
      totalPrice,
      clientId
    });

    const savedBooking = await newBooking.save();

    // Populate the saved booking
    const populatedBooking = await BookingStables.findById(savedBooking._id)
      .populate("userId", "firstName lastName email phoneNumber")
      .populate("clientId", "firstName lastName email phoneNumber _id")
      .populate("stableId", "Tittle Deatils location coordinates PriceRate");

    return NextResponse.json(
      {
        success: true,
        message: "Booking created successfully",
        data: populatedBooking
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create booking" },
      { status: 500 }
    );
  }
}
