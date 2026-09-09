import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ConferenceBooking } from '@/models/ConferenceBooking';

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const {
      slotDate,
      slotTime,
      conferenceName,
      designation,
      title,
      fullName,
      specialty,
      countryCode,
      mobileNumber,
      email,
      hospitalName,
      country,
      state,
      city,
    } = body;

    // Validate required fields
    if (!slotDate || !slotTime || !fullName || !conferenceName || !designation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if the slot is already taken
    const existingSlot = await ConferenceBooking.findOne({ slotDate, slotTime });
    if (existingSlot) {
      return NextResponse.json({ error: 'Selected time slot is already booked.' }, { status: 400 });
    }

    // Generate a simple sequential ID (e.g., SSI-1001) for the ticket
    const count = await ConferenceBooking.countDocuments();
    const generatedSequentialId = `SSI-${1001 + count}`;

    // Create the booking in MongoDB
    const booking = await ConferenceBooking.create({
      slotDate,
      slotTime,
      sequentialId: generatedSequentialId,
      conferenceName,
      designation,
      title,
      fullName,
      specialty,
      countryCode,
      mobileNumber,
      email,
      hospitalName,
      country,
      state,
      city,
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error: any) {
    console.error('Booking API Error:', error);
    // Handle MongoDB duplicate key error (code 11000) just in case of race conditions
    if (error.code === 11000) {
      return NextResponse.json({ error: 'This slot was just booked by someone else.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}