import mongoose, {
  HydratedDocument,
  Model,
  Schema,
} from 'mongoose';

export interface IMantramBooking {
  slotDate: string;
  slotTime: string;
  sequentialId: string;
  title: string;
  fullName: string;
  specialty: string;
  countryCode: string;
  mobileNumber: string;
  email: string;
  hospitalName: string;
  country: string;
  state: string;
  city: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MantramBookingDocument =
  HydratedDocument<IMantramBooking>;

const cleanString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const cleanEmail = (value: unknown): string => {
  return typeof value === 'string'
    ? value.trim().toLowerCase()
    : '';
};

const MantramBookingSchema = new Schema<IMantramBooking>(
  {
    slotDate: {
      type: String,
      required: [true, 'Slot date is required'],
      trim: true,
      set: cleanString,
    },

    slotTime: {
      type: String,
      required: [true, 'Slot time is required'],
      trim: true,
      set: cleanString,
    },

    sequentialId: {
      type: String,
      required: [true, 'Sequential ID is required'],
      unique: true,
      trim: true,
      set: cleanString,
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      default: 'Dr.',
      trim: true,
      set: cleanString,
    },

    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      set: cleanString,
    },

    specialty: {
      type: String,
      required: [true, 'Specialty is required'],
      trim: true,
      set: cleanString,
    },

    countryCode: {
      type: String,
      required: [true, 'Country code is required'],
      default: '+91 (IN)',
      trim: true,
      set: cleanString,
    },

    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      set: cleanString,
    },

    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
      set: cleanEmail,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    hospitalName: {
      type: String,
      required: [true, 'Hospital name is required'],
      trim: true,
      set: cleanString,
    },

    country: {
      type: String,
      required: [true, 'Country is required'],
      default: 'India',
      trim: true,
      set: cleanString,
    },

    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      set: cleanString,
    },

    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      set: cleanString,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/*
 * This index is intentionally not unique because one slot can contain
 * up to six bookings. Capacity is enforced in the booking API.
 */
MantramBookingSchema.index(
  { slotDate: 1, slotTime: 1 },
  {
    unique: false,
    name: 'mantram_slot_capacity_lookup',
  }
);

MantramBookingSchema.index(
  { createdAt: -1 },
  {
    name: 'mantram_created_at',
  }
);

const existingModel = mongoose.models
  .MantramBooking as Model<IMantramBooking> | undefined;

export const MantramBooking: Model<IMantramBooking> =
  existingModel ??
  mongoose.model<IMantramBooking>(
    'MantramBooking',
    MantramBookingSchema
  );