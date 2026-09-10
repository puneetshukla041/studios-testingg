import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ConferenceBooking } from '@/models/ConferenceBooking';

const MAX_SLOT_CAPACITY = 6;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Group bookings by slotTime and count total reservations per slot
    const slotCountsRaw = await ConferenceBooking.aggregate([
      { $match: { slotDate: date } },
      { $group: { _id: '$slotTime', count: { $sum: 1 } } },
    ]);

    const slotCounts: Record<string, number> = {};
    const occupiedSlots: string[] = [];

    slotCountsRaw.forEach((item) => {
      slotCounts[item._id] = item.count;
      if (item.count >= MAX_SLOT_CAPACITY) {
        occupiedSlots.push(item._id); // Mark fully booked if 6 seats filled
      }
    });

    return NextResponse.json({ occupiedSlots, slotCounts }, { status: 200 });
  } catch (error: any) {
    console.error('Slot Fetch Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}