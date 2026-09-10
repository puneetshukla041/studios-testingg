import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ConferenceBooking } from '@/models/ConferenceBooking';

function generateSequentialId() {
  return `SSI-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    try {
      const globalAny: any = global as any;
      if (!globalAny._conferenceBookingIndexFixed) {
        await ConferenceBooking.collection.dropIndex('bookingNo_1').catch(() => null);
        await ConferenceBooking.collection.dropIndex('slotDate_1_slotTime_1').catch(() => null);
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

    let booking;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        booking = await ConferenceBooking.create({
          slotDate,
          slotTime,
          sequentialId: generateSequentialId(),
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
        break;
      } catch (error: any) {
        if (error?.code !== 11000) {
          throw error;
        }
      }
    }

    if (!booking) {
      return NextResponse.json({ error: 'Unable to create booking due to a concurrency conflict. Please try again.' }, { status: 409 });
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error: any) {
    console.error('Booking API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}