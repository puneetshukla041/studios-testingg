import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MantramBooking } from '@/models/MantramBooking';

const MAX_SLOT_CAPACITY = 1;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slotDate, slotTime, title, fullName, specialty, countryCode, mobileNumber, email, hospitalName, country, state, city } = body;

    if (!slotDate || !slotTime || !fullName || !specialty || !mobileNumber || !email || !hospitalName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    // Enforce capacity per slot (1 person per slot)
    const existingCount = await MantramBooking.countDocuments({ slotDate, slotTime });
    if (existingCount >= MAX_SLOT_CAPACITY) {
      return NextResponse.json({ error: `Selected time slot is fully booked (${MAX_SLOT_CAPACITY}/${MAX_SLOT_CAPACITY}).` }, { status: 400 });
    }

    const sequentialId = `#${Math.floor(100000 + Math.random() * 900000)}`;

    const booking = await MantramBooking.create({
      slotDate,
      slotTime: typeof slotTime === 'string' ? slotTime.trim() : slotTime,
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
    if (error && (error.code === 11000 || error.code === 11001)) {
      return NextResponse.json({ error: 'Database constraint error: Slot capacity reached or legacy index conflicts.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}