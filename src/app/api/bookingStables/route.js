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
    const bookingType = searchParams.get("bookingType");
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
    
    // Filter by bookingType if provided
    if (bookingType) {
      query.bookingType = bookingType;
    }

    const bookings = await BookingStables.find(query)
      .populate("userId", "firstName lastName email phoneNumber")
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
    console.log("Received booking data:", body);

    const {
      userId,
      stableId,
      bookingType,
      startDate,
      endDate,
      numberOfHorses,
      price,
      totalPrice
    } = body;

    // Validate required fields
    if (!userId || !stableId || !bookingType || !startDate || !numberOfHorses || !price || !totalPrice) {
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
      totalPrice
    });

    const savedBooking = await newBooking.save();

    // Populate the saved booking
    const populatedBooking = await BookingStables.findById(savedBooking._id)
      .populate("userId", "firstName lastName email phoneNumber")
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
