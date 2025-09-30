import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BookingStables from "@/models/BookingStables";
import Stable from "@/models/Stables";

/**
 * @swagger
 * /api/stables/availability:
 *   get:
 *     summary: Get stable availability for a date range
 *     tags: [Stables]
 *     parameters:
 *       - in: query
 *         name: stableId
 *         schema:
 *           type: string
 *         required: true
 *         description: Stable ID to check availability for
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date for availability check (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date for availability check (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Availability information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stableId:
 *                       type: string
 *                     stableInfo:
 *                       type: object
 *                     availableDates:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: date
 *                     bookedDates:
 *                       type: array
 *                       items:
 *                         type: object
 *                     conflicts:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Bad request - missing required parameters
 *       404:
 *         description: Stable not found
 */

export async function GET(req) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const stableId = searchParams.get("stableId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate required parameters
    if (!stableId || !startDate || !endDate) {
      return NextResponse.json(
        { 
          success: false, 
          message: "stableId, startDate, and endDate are required parameters" 
        },
        { status: 400 }
      );
    }

    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid date format. Use YYYY-MM-DD format" 
        },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { 
          success: false, 
          message: "End date must be after start date" 
        },
        { status: 400 }
      );
    }

    // Check if stable exists
    const stable = await Stable.findById(stableId);
    if (!stable) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Stable not found" 
        },
        { status: 404 }
      );
    }

    // Set end of day for the end date to include the entire day
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all bookings for this stable that overlap with the date range
    const bookings = await BookingStables.find({
      stableId: stableId,
      $and: [
        {
          startDate: { $lte: endOfDay }
        },
        {
          $or: [
            { endDate: { $gte: start } },
            { endDate: { $exists: false } }
          ]
        }
      ]
    }).populate("userId", "firstName lastName email");

    // Generate array of all dates in the range
    const availableDates = [];
    const bookedDates = [];
    const conflicts = [];

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date);
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Check if this date is booked
      const isBooked = bookings.some(booking => {
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = booking.endDate ? new Date(booking.endDate) : bookingStart;
        
        return currentDate >= bookingStart && currentDate <= bookingEnd;
      });

      if (isBooked) {
        bookedDates.push(dateString);
        
        // Find the specific booking for this date
        const booking = bookings.find(booking => {
          const bookingStart = new Date(booking.startDate);
          const bookingEnd = booking.endDate ? new Date(booking.endDate) : bookingStart;
          return currentDate >= bookingStart && currentDate <= bookingEnd;
        });

        if (booking) {
          conflicts.push({
            date: dateString,
            bookingId: booking._id,
            userId: booking.userId,
            bookingType: booking.bookingType,
            numberOfHorses: booking.numberOfHorses,
            startDate: booking.startDate,
            endDate: booking.endDate
          });
        }
      } else {
        availableDates.push(dateString);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        stableId,
        stableInfo: {
          title: stable.Tittle,
          details: stable.Deatils,
          location: stable.location,
          coordinates: stable.coordinates
        },
        dateRange: {
          startDate: startDate,
          endDate: endDate
        },
        availableDates,
        bookedDates,
        conflicts,
        summary: {
          totalDays: availableDates.length + bookedDates.length,
          availableDays: availableDates.length,
          bookedDays: bookedDates.length,
          availabilityPercentage: Math.round((availableDates.length / (availableDates.length + bookedDates.length)) * 100)
        }
      }
    });

  } catch (error) {
    console.error("Error checking stable availability:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to check stable availability" 
      },
      { status: 500 }
    );
  }
}
