import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ConferenceBooking } from '@/models/ConferenceBooking';
import { MantramBooking } from '@/models/MantramBooking'; // Assuming this exists

export const dynamic = 'force-dynamic'; // Prevents Next.js from caching this route statically

export async function GET() {
  try {
    await connectToDatabase();

    // Fetch from both collections
    const conferenceBookings = await ConferenceBooking.find({}).sort({ createdAt: -1 }).lean();
    
    let mantramBookings: any[] = [];
    try {
      mantramBookings = await MantramBooking.find({}).sort({ createdAt: -1 }).lean();
    } catch (e) {
      console.warn("Mantram collection might not exist yet.");
    }

    // Standardize Conference Data
    const formattedConference = conferenceBookings.map((b: any) => ({
      id: b.sequentialId || b._id.toString().slice(-6), // Fallback ID if sequentialId is missing
      name: b.fullName,
      email: b.email,
      phone: `${b.countryCode || ''} ${b.mobileNumber}`.trim(),
      category: 'conference',
      registrationDate: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A',
      slotDetails: `${b.slotDate} | ${b.slotTime}`
    }));

    // Standardize Mantram Data
    const formattedMantram = mantramBookings.map((b: any) => ({
      id: b.sequentialId || b._id.toString().slice(-6),
      name: b.fullName,
      email: b.email,
      phone: b.mobileNumber,
      category: 'amnatram',
      registrationDate: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A',
      slotDetails: `${b.slotDate} | ${b.slotTime}`
    }));

    // Combine and send
    const allBookings = [...formattedConference, ...formattedMantram];

    return NextResponse.json({ data: allBookings }, { status: 200 });
  } catch (error: any) {
    console.error('Admin Fetch Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}