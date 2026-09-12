import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ConferenceBooking } from '@/models/ConferenceBooking';
import { MantramBooking } from '@/models/MantramBooking';

export const dynamic = 'force-dynamic';

function serializeBooking(booking: Record<string, unknown>, category: 'conference' | 'amnatram') {
  const mongoId = booking._id ? String(booking._id) : '';
  const createdAt = booking.createdAt
    ? new Date(String(booking.createdAt)).toLocaleDateString()
    : 'N/A';
  const slotDetails = `${String(booking.slotDate || '')} | ${String(booking.slotTime || '')}`;

  return {
    ...booking,
    _id: mongoId,
    id: String(booking.sequentialId || mongoId.slice(-6)),
    name: String(booking.fullName || ''),
    email: String(booking.email || ''),
    phone: category === 'conference'
      ? `${String(booking.countryCode || '')} ${String(booking.mobileNumber || '')}`.trim()
      : String(booking.mobileNumber || ''),
    category,
    registrationDate: createdAt,
    slotDetails,
  };
}

export async function GET() {
  try {
    await connectToDatabase();

    const conferenceBookings = await ConferenceBooking.find({}).sort({ createdAt: -1 }).lean();

    let mantramBookings: Record<string, unknown>[] = [];
    try {
      mantramBookings = (await MantramBooking.find({}).sort({ createdAt: -1 }).lean()) as Record<string, unknown>[];
    } catch {
      console.warn('Mantram collection might not exist yet.');
    }

    const allBookings = [
      ...conferenceBookings.map((booking) =>
        serializeBooking(booking as unknown as Record<string, unknown>, 'conference')
      ),
      ...mantramBookings.map((booking) => serializeBooking(booking, 'amnatram')),
    ];

    return NextResponse.json({ data: allBookings }, { status: 200 });
  } catch (error: unknown) {
    console.error('Admin Fetch Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}