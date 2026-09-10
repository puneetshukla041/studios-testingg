import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ConferenceBooking } from '@/models/ConferenceBooking';

const MAX_SLOT_CAPACITY = 6;

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    // Ensure any legacy unique index on `bookingNo` that causes duplicate-null errors
    // is removed once. This guards against a pre-existing DB index named `bookingNo_1`
    // that was created by an older schema and forces duplicate key errors when
    // new documents don't include `bookingNo`.
    try {
      // Only attempt once per server instance
      const globalAny: any = global as any;
      if (!globalAny._conferenceBookingIndexFixed) {
        await ConferenceBooking.collection.dropIndex('bookingNo_1').catch(() => null);
        globalAny._conferenceBookingIndexFixed = true;
      }
    } catch (indexErr) {
      // non-fatal: log and continue
      console.warn('Index cleanup warning:', indexErr);
    }
    
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

    if (!slotDate || !slotTime || !fullName || !conferenceName || !designation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check existing bookings for this specific slot
    const existingCount = await ConferenceBooking.countDocuments({ slotDate, slotTime });

    if (existingCount >= MAX_SLOT_CAPACITY) {
      return NextResponse.json(
        { error: `Selected time slot is fully booked (${MAX_SLOT_CAPACITY}/${MAX_SLOT_CAPACITY} participants filled).` },
        { status: 400 }
      );
    }

    // Generate ticket sequential ID
    const totalCount = await ConferenceBooking.countDocuments();
    const generatedSequentialId = `SSI-${1001 + totalCount}`;

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
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}