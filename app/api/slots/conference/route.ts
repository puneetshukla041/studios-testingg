import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ConferenceBooking } from '@/models/ConferenceBooking';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Find all bookings for the given date and only return the slotTime field
    const bookings = await ConferenceBooking.find({ slotDate: date })
      .select('slotTime')
      .lean();
      
    // Map objects into a simple array of strings: ["09:00 AM", "09:30 AM"]
    const occupiedSlots = bookings.map((b: any) => b.slotTime);

    return NextResponse.json({ occupiedSlots }, { status: 200 });
  } catch (error: any) {
    console.error('Slot Fetch API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}