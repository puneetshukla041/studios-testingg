import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MantramBooking } from '@/models/MantramBooking';

const MAX_SLOT_CAPACITY = 6;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const debug = searchParams.get('debug');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    await connectToDatabase();
    const bookings = await MantramBooking.find({ slotDate: date }).select('slotTime').lean();

    // Count the number of bookings for each slot time
    const slotCounts: Record<string, number> = {};
    for (const b of bookings) {
      if (b && b.slotTime && typeof b.slotTime === 'string') {
        const time = b.slotTime.trim();
        slotCounts[time] = (slotCounts[time] || 0) + 1;
      }
    }

    // Only mark a slot as occupied if its booking count reaches the maximum capacity
    const occupiedSlots = Object.keys(slotCounts).filter(
      (time) => slotCounts[time] >= MAX_SLOT_CAPACITY
    );

    if (debug === 'true') {
      const indexes = await MantramBooking.collection.indexes();
      return NextResponse.json({ occupiedSlots, slotCounts, count: occupiedSlots.length, rawCount: bookings.length, indexes }, { status: 200 });
    }

    return NextResponse.json({ occupiedSlots }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}