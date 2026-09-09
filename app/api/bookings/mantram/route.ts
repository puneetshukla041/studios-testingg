import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MantramBooking } from '@/models/MantramBooking';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slotDate, slotTime, title, fullName, specialty, countryCode, mobileNumber, email, hospitalName, country, state, city } = body;

    if (!slotDate || !slotTime || !fullName || !specialty || !mobileNumber || !email || !hospitalName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await MantramBooking.findOne({ slotDate, slotTime });
    if (existing) {
      return NextResponse.json({ error: 'This time slot is already booked.' }, { status: 409 });
    }

    const sequentialId = `#${Math.floor(100000 + Math.random() * 900000)}`;

    const booking = await MantramBooking.create({
      slotDate,
      slotTime,
      sequentialId,
      title: title || 'Dr.',
      fullName,
      specialty,
      countryCode: countryCode || '+91 (IN)',
      mobileNumber,
      email,
      hospitalName,
      country: country || 'India',
      state,
      city,
    });

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Slot already booked. Pick another.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}