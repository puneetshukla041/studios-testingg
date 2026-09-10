import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MantramBooking } from '@/models/MantramBooking';

const MAX_SLOT_CAPACITY = 6;

interface SlotCountResult {
  _id: string;
  count: number;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Unable to load slot availability.';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date')?.trim();

    if (!date) {
      return NextResponse.json(
        {
          error: 'Date is required.',
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    /*
     * Group bookings directly in MongoDB. This is faster and ensures
     * the page receives the count for every slot.
     */
    const results =
      await MantramBooking.aggregate<SlotCountResult>([
        {
          $match: {
            slotDate: date,
          },
        },
        {
          $project: {
            normalizedSlotTime: {
              $trim: {
                input: '$slotTime',
              },
            },
          },
        },
        {
          $match: {
            normalizedSlotTime: {
              $ne: '',
            },
          },
        },
        {
          $group: {
            _id: '$normalizedSlotTime',
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
      ]);

    const slotCounts: Record<string, number> = {};

    for (const result of results) {
      slotCounts[result._id] = result.count;
    }

    const fullSlots = results
      .filter(
        (result) => result.count >= MAX_SLOT_CAPACITY
      )
      .map((result) => result._id);

    return NextResponse.json(
      {
        /*
         * fullSlots is the preferred response field.
         * occupiedSlots is retained for backward compatibility.
         */
        fullSlots,
        occupiedSlots: fullSlots,
        slotCounts,
        maxCapacity: MAX_SLOT_CAPACITY,
      },
      {
        status: 200,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Mantram availability error:', error);

    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}