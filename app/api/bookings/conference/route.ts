import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ConferenceBooking } from '@/models/ConferenceBooking';

const MAX_SLOT_CAPACITY = 6;

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    // Ensure any legacy unique index on `slotDate`+`slotTime` (or other
    // stray unique indexes) is removed once per server instance. Some older
    // deployments accidentally created a unique index that caused E11000
    // duplicate key errors when multiple users tried to book the same slot.
    try {
      const globalAny: any = global as any;
      if (!globalAny._conferenceBookingIndexFixed) {
        const indexes = await ConferenceBooking.collection.indexes();
        for (const idx of indexes) {
          if (
            idx &&
            idx.key &&
            idx.key.slotDate === 1 &&
            idx.key.slotTime === 1 &&
            idx.unique
          ) {
            if (idx.name) {
              await ConferenceBooking.collection.dropIndex(idx.name).catch(() => null);
              console.info('Dropped legacy unique index on slotDate+slotTime:', idx.name);
            }
          }
        }
        // Also attempt to remove any legacy bookingNo index if present
        await ConferenceBooking.collection.dropIndex('bookingNo_1').catch(() => null);
        globalAny._conferenceBookingIndexFixed = true;
      }
    } catch (indexErr) {
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

    let booking;
    try {
      booking = await ConferenceBooking.create({
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
    } catch (createErr: any) {
      // Handle duplicate key errors more gracefully
      if (createErr && (createErr.code === 11000 || createErr.code === 11001)) {
        console.warn('Duplicate key error when creating booking:', createErr.message || createErr);
        return NextResponse.json(
          { error: 'Selected time slot appears to be already restricted by a DB index or concurrently booked. Please try a different slot.' },
          { status: 409 }
        );
      }
      throw createErr;
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error: any) {
    console.error('Booking API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}