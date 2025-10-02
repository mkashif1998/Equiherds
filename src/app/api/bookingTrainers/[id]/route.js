import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BookingTrainer from "@/models/BookingTrainer";
import User from "@/models/User";
import Trainer from "@/models/Trainer";

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

// GET - Get a specific booking by ID
export async function GET(req, { params }) {
  await connectDB();
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    const booking = await BookingTrainer.findById(id)
      .populate("userId", "firstName lastName email phoneNumber")
      .populate("clientId", "firstName lastName email phoneNumber _id")
      .populate("trainerId", "title details price schedule Experience images location coordinates Rating noofRatingCustomers")
      .populate("ratinguserid", "firstName lastName email phoneNumber _id");

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

// PUT - Update a specific booking by ID
export async function PUT(req, { params }) {
  await connectDB();
  try {
    const { id } = await params;
    const body = await parseRequestBody(req);

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Check if booking exists
    const existingBooking = await BookingTrainer.findById(id);
    if (!existingBooking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    const {
      userId,
      trainerId,
      bookingType,
      startDate,
      endDate,
      price,
      totalPrice,
      clientId,
      basePrice,
      additionalServices,
      servicePriceDetails,
      additionalServiceCosts,
      numberOfDays,
      ratingUserId
    } = body;

    // Validate dates if provided
    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return NextResponse.json(
          { success: false, message: "Invalid start date" },
          { status: 400 }
        );
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { success: false, message: "Invalid end date" },
          { status: 400 }
        );
      }
    }


    // Validate prices if provided
    if ((price && price < 0) || (totalPrice && totalPrice < 0) || (basePrice && basePrice < 0) || (additionalServiceCosts && additionalServiceCosts < 0)) {
      return NextResponse.json(
        { success: false, message: "Prices cannot be negative" },
        { status: 400 }
      );
    }

    if (numberOfDays && numberOfDays < 1) {
      return NextResponse.json(
        { success: false, message: "Number of days must be at least 1" },
        { status: 400 }
      );
    }

    // Check if user exists (if userId is being updated)
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }
    }

    // Check if trainer exists (if trainerId is being updated)
    if (trainerId) {
      const trainer = await Trainer.findById(trainerId);
      if (!trainer) {
        return NextResponse.json(
          { success: false, message: "Trainer not found" },
          { status: 404 }
        );
      }
    }

    // Prepare update object
    const updateData = {};
    if (userId) updateData.userId = userId;
    if (trainerId) updateData.trainerId = trainerId;
    if (bookingType) updateData.bookingType = bookingType;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (basePrice !== undefined) updateData.basePrice = basePrice;
    if (additionalServices !== undefined) updateData.additionalServices = additionalServices;
    if (servicePriceDetails !== undefined) updateData.servicePriceDetails = servicePriceDetails;
    if (additionalServiceCosts !== undefined) updateData.additionalServiceCosts = additionalServiceCosts;
    if (totalPrice) updateData.totalPrice = totalPrice;
    if (numberOfDays) updateData.numberOfDays = numberOfDays;
    if (clientId) updateData.clientId = clientId;
    if (ratingUserId) updateData.ratinguserid = ratingUserId;
    // Legacy field for backward compatibility
    if (price) updateData.price = price;
    // Update the booking
    const updatedBooking = await BookingTrainer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("userId", "firstName lastName email phoneNumber")
     .populate("clientId", "firstName lastName email phoneNumber _id")
     .populate("trainerId", "title details price schedule Experience images location coordinates Rating noofRatingCustomers")
     .populate("ratinguserid", "firstName lastName email phoneNumber _id");

    return NextResponse.json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific booking by ID
export async function DELETE(req, { params }) {
  await connectDB();
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Check if booking exists
    const booking = await BookingTrainer.findById(id);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Delete the booking
    await BookingTrainer.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Booking deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete booking" },
      { status: 500 }
    );
  }
}
