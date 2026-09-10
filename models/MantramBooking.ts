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

const cleanRequiredString = (value: unknown): string => {
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
      index: true,
      set: cleanRequiredString,
    },

    slotTime: {
      type: String,
      required: [true, 'Slot time is required'],
      trim: true,
      index: true,
      set: cleanRequiredString,
    },

    sequentialId: {
      type: String,
      required: [true, 'Sequential ID is required'],
      unique: true,
      trim: true,
      set: cleanRequiredString,
    },

    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      default: 'Dr.',
      set: cleanRequiredString,
    },

    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      set: cleanRequiredString,
    },

    specialty: {
      type: String,
      required: [true, 'Specialty is required'],
      trim: true,
      set: cleanRequiredString,
    },

    countryCode: {
      type: String,
      required: [true, 'Country code is required'],
      trim: true,
      default: '+91 (IN)',
      set: cleanRequiredString,
    },

    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      set: cleanRequiredString,
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
      set: cleanRequiredString,
    },

    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'India',
      set: cleanRequiredString,
    },

    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      set: cleanRequiredString,
    },

    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      set: cleanRequiredString,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/*
 * This is intentionally a normal, non-unique index.
 * Multiple people can book the same date and time until the API's
 * MAX_SLOT_CAPACITY limit is reached.
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