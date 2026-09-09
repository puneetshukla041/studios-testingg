import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConferenceBooking extends Document {
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
}

const ConferenceBookingSchema: Schema<IConferenceBooking> = new Schema(
  {
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    sequentialId: { type: String, required: true, unique: true },
    title: { type: String, required: true, default: 'Dr.' },
    fullName: { type: String, required: true },
    specialty: { type: String, required: true },
    countryCode: { type: String, required: true, default: '+91 (IN)' },
    mobileNumber: { type: String, required: true },
    email: { type: String, required: true },
    hospitalName: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    state: { type: String, required: true },
    city: { type: String, required: true },
  },
  { timestamps: true }
);

ConferenceBookingSchema.index({ slotDate: 1, slotTime: 1 }, { unique: true });

export const ConferenceBooking: Model<IConferenceBooking> =
  mongoose.models.ConferenceBooking || mongoose.model<IConferenceBooking>('ConferenceBooking', ConferenceBookingSchema);