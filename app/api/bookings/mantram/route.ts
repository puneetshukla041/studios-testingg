import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MantramBooking } from '@/models/MantramBooking';

const MAX_SLOT_CAPACITY = 6;
const MAX_ID_ATTEMPTS = 5;

type MongoIndexInformation = {
  name?: string;
  key?: Record<string, number>;
  unique?: boolean;
};

type MongoDuplicateError = Error & {
  code?: number;
  keyPattern?: Record<string, number>;
  keyValue?: Record<string, unknown>;
};

type GlobalWithMantramIndex = typeof globalThis & {
  mantramIndexCleanupPromise?: Promise<void>;
};

const globalWithMantramIndex =
  globalThis as GlobalWithMantramIndex;

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'An unexpected error occurred.';
}

function isDuplicateKeyError(
  error: unknown
): error is MongoDuplicateError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const mongoError = error as MongoDuplicateError;

  return mongoError.code === 11000 || mongoError.code === 11001;
}

/*
 * Mongoose changing an index from unique to non-unique does not
 * automatically remove the old unique MongoDB index.
 *
 * This removes only the legacy unique index on slotDate + slotTime.
 */
async function removeLegacyUniqueSlotIndex(): Promise<void> {
  if (!globalWithMantramIndex.mantramIndexCleanupPromise) {
    globalWithMantramIndex.mantramIndexCleanupPromise =
      (async () => {
        const indexes =
          (await MantramBooking.collection.indexes()) as MongoIndexInformation[];

        for (const index of indexes) {
          const keys = index.key
            ? Object.keys(index.key)
            : [];

          const isLegacyUniqueSlotIndex =
            index.unique === true &&
            keys.length === 2 &&
            index.key?.slotDate === 1 &&
            index.key?.slotTime === 1;

          if (isLegacyUniqueSlotIndex && index.name) {
            await MantramBooking.collection.dropIndex(
              index.name
            );
          }
        }
      })().catch((error) => {
        delete globalWithMantramIndex.mantramIndexCleanupPromise;
        throw error;
      });
  }

  await globalWithMantramIndex.mantramIndexCleanupPromise;
}

function generateSequentialId(): string {
  return `#${Math.floor(
    100000 + Math.random() * 900000
  )}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const slotDate = cleanString(body.slotDate);
    const slotTime = cleanString(body.slotTime);
    const title = cleanString(body.title) || 'Dr.';
    const fullName = cleanString(body.fullName);
    const specialty = cleanString(body.specialty);
    const countryCode =
      cleanString(body.countryCode) || '+91 (IN)';
    const mobileNumber = cleanString(body.mobileNumber);
    const email = cleanString(body.email).toLowerCase();
    const hospitalName = cleanString(body.hospitalName);
    const country = cleanString(body.country) || 'India';
    const state = cleanString(body.state);
    const city = cleanString(body.city);

    if (
      !slotDate ||
      !slotTime ||
      !fullName ||
      !specialty ||
      !mobileNumber ||
      !email ||
      !hospitalName ||
      !state ||
      !city
    ) {
      return NextResponse.json(
        {
          error:
            'Please complete all required booking fields.',
        },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          error: 'Please provide a valid email address.',
        },
        { status: 400 }
      );
    }

    await connectToDatabase();
    await removeLegacyUniqueSlotIndex();

    const existingCount =
      await MantramBooking.countDocuments({
        slotDate,
        slotTime,
      });

    if (existingCount >= MAX_SLOT_CAPACITY) {
      return NextResponse.json(
        {
          error: `Selected time slot is fully booked (${MAX_SLOT_CAPACITY}/${MAX_SLOT_CAPACITY}).`,
          slotFull: true,
          slotCount: existingCount,
          maxCapacity: MAX_SLOT_CAPACITY,
        },
        { status: 409 }
      );
    }

    /*
     * Retry if the randomly generated sequential ID happens to
     * conflict with an existing sequential ID.
     */
    for (
      let attempt = 1;
      attempt <= MAX_ID_ATTEMPTS;
      attempt += 1
    ) {
      try {
        const booking = await MantramBooking.create({
          slotDate,
          slotTime,
          sequentialId: generateSequentialId(),
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

        const updatedCount = existingCount + 1;

        return NextResponse.json(
          {
            success: true,
            booking,
            slotCount: updatedCount,
            remainingCapacity: Math.max(
              MAX_SLOT_CAPACITY - updatedCount,
              0
            ),
            maxCapacity: MAX_SLOT_CAPACITY,
          },
          { status: 201 }
        );
      } catch (error) {
        if (
          isDuplicateKeyError(error) &&
          error.keyPattern?.sequentialId &&
          attempt < MAX_ID_ATTEMPTS
        ) {
          continue;
        }

        throw error;
      }
    }

    return NextResponse.json(
      {
        error:
          'Unable to generate a unique booking number. Please try again.',
      },
      { status: 500 }
    );
  } catch (error) {
    console.error('Mantram booking error:', error);

    if (isDuplicateKeyError(error)) {
      try {
        await removeLegacyUniqueSlotIndex();
      } catch (cleanupErr) {
        console.error('Index cleanup failed:', cleanupErr);
      }

      return NextResponse.json(
        {
          error:
            'A database index conflict occurred. The server attempted to repair indexes; please retry the request.',
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}