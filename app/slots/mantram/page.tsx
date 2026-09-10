'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Check, Download, RefreshCw } from 'lucide-react';
import { generateTimeSlots } from '@/lib/slots';

type PageStep = 'SELECT_SLOT' | 'FILL_DETAILS' | 'TICKET';

interface FormData {
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
}

interface ConfirmedBooking extends FormData {
  _id?: string;
  sequentialId: string;
  slotDate: string;
  slotTime: string;
}

interface SlotsResponse {
  fullSlots?: string[];
  slotCounts?: Record<string, number>;

  // Legacy response. This contains slots having at least one booking,
  // so it must not be used as the list of completely full slots.
  occupiedSlots?: string[];

  error?: string;
}

const MAX_SLOT_CAPACITY = 6;

const inputClassName =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100';

const selectClassName =
  'rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100';

function getTodayDate(): string {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset)
    .toISOString()
    .split('T')[0];
}

function normalizeSlot(slot: unknown): string {
  return typeof slot === 'string' ? slot.trim() : '';
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');

  if (!contentType?.includes('application/json')) {
    throw new Error('The server returned an invalid response.');
  }

  return response.json() as Promise<T>;
}

export default function MantramSlotPage() {
  const [step, setStep] = useState<PageStep>('SELECT_SLOT');
  const [selectedDate, setSelectedDate] = useState(getTodayDate);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [fullSlots, setFullSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState<FormData>({
    title: 'Dr.',
    fullName: '',
    specialty: 'Anaesthesiology',
    countryCode: '+91 (IN)',
    mobileNumber: '',
    email: '',
    hospitalName: '',
    country: 'India',
    state: 'Haryana',
    city: 'Gurugram',
  });

  const [confirmedBooking, setConfirmedBooking] =
    useState<ConfirmedBooking | null>(null);

  const ticketRef = useRef<HTMLDivElement>(null);

  const fetchSlotAvailability = useCallback(
    async (signal?: AbortSignal) => {
      setSlotsLoading(true);
      setErrorMsg('');

      try {
        const response = await fetch(
          `/api/slots/mantram?date=${encodeURIComponent(selectedDate)}`,
          {
            method: 'GET',
            cache: 'no-store',
            signal,
          }
        );

        const data = await readJsonResponse<SlotsResponse>(response);

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load slot availability.');
        }

        let completelyFullSlots: string[] = [];

        if (Array.isArray(data.fullSlots)) {
          completelyFullSlots = data.fullSlots
            .map(normalizeSlot)
            .filter(Boolean);
        } else if (data.slotCounts) {
          completelyFullSlots = Object.entries(data.slotCounts)
            .filter(([, count]) => Number(count) >= MAX_SLOT_CAPACITY)
            .map(([slot]) => normalizeSlot(slot))
            .filter(Boolean);
        }

        /*
         * Do not fall back to data.occupiedSlots.
         *
         * The existing slots endpoint returns a slot in occupiedSlots as soon
         * as it has one booking. Because each slot allows six bookings, using
         * occupiedSlots here would incorrectly disable the remaining places.
         */
        setFullSlots([...new Set(completelyFullSlots)]);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setFullSlots([]);
        setErrorMsg(
          error instanceof Error
            ? error.message
            : 'Unable to load slot availability.'
        );
      } finally {
        if (!signal?.aborted) {
          setSlotsLoading(false);
        }
      }
    },
    [selectedDate]
  );

  useEffect(() => {
    setTimeSlots(
      generateTimeSlots({
        slotDuration: 5,
        gap: 2,
        morningStart: 9 * 60,
        morningEnd: 13 * 60,
        lunchStart: 13 * 60,
        lunchEnd: 14 * 60,
        afternoonStart: 14 * 60,
        afternoonEnd: 17.5 * 60,
      })
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setSelectedSlot(null);
    void fetchSlotAvailability(controller.signal);

    return () => controller.abort();
  }, [fetchSlotAvailability]);

  const updateFormData = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSelectSlot = (slot: string) => {
    const normalizedSlot = normalizeSlot(slot);

    if (!normalizedSlot || fullSlots.includes(normalizedSlot)) {
      return;
    }

    setSelectedSlot(normalizedSlot);
    setErrorMsg('');
    setStep('FILL_DETAILS');
  };

  const handleFormSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!selectedSlot) {
      setErrorMsg('Please select a time slot before continuing.');
      setStep('SELECT_SLOT');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/bookings/mantram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotDate: selectedDate,
          slotTime: selectedSlot,
          title: formData.title.trim(),
          fullName: formData.fullName.trim(),
          specialty: formData.specialty.trim(),
          countryCode: formData.countryCode.trim(),
          mobileNumber: formData.mobileNumber.trim(),
          email: formData.email.trim().toLowerCase(),
          hospitalName: formData.hospitalName.trim(),
          country: formData.country.trim(),
          state: formData.state.trim(),
          city: formData.city.trim(),
        }),
      });

      const data = await readJsonResponse<{
        booking?: ConfirmedBooking;
        error?: string;
      }>(response);

      if (!response.ok || !data.booking) {
        const message = data.error || 'Booking failed. Please try again.';

        if (
          response.status === 409 ||
          message.toLowerCase().includes('fully booked')
        ) {
          setFullSlots((current) =>
            current.includes(selectedSlot)
              ? current
              : [...current, selectedSlot]
          );
        }

        throw new Error(message);
      }

      setConfirmedBooking(data.booking);
      setStep('TICKET');
    } catch (error) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Booking failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadTicket = async () => {
    if (!ticketRef.current || !confirmedBooking) {
      return;
    }

    setDownloading(true);
    setErrorMsg('');

    try {
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        quality: 1,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      const safeId = confirmedBooking.sequentialId
        .replace('#', '')
        .replace(/[^a-zA-Z0-9-_]/g, '');

      link.download = `Mantram-Ticket-${safeId || 'SSI'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Ticket download failed:', error);
      setErrorMsg('Unable to download the ticket. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const resetAll = () => {
    setStep('SELECT_SLOT');
    setSelectedSlot(null);
    setConfirmedBooking(null);
    setErrorMsg('');
    void fetchSlotAvailability();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans text-slate-800">
      <header className="relative border-b border-purple-200 bg-white px-6 py-4 shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />

        <div className="mx-auto flex max-w-7xl items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-lg font-bold text-white shadow-md">
            S
          </div>

          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              SSI Mantram Portal
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Advanced Clinical Session Scheduling
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-7xl px-4">
        {step === 'SELECT_SLOT' && (
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Select Session Slot
                </h2>
                <span className="mt-1 inline-block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Under Testing
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center space-x-4 text-xs font-semibold">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Available</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="h-3 w-3 rounded-full bg-slate-300" />
                    <span className="text-slate-600">Full</span>
                  </div>
                </div>

                <label className="flex flex-col justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Session Date
                  </span>

                  <input
                    type="date"
                    min={getTodayDate()}
                    value={selectedDate}
                    onChange={(event) => {
                      setSelectedDate(event.target.value);
                      setErrorMsg('');
                    }}
                    className="bg-transparent text-sm font-medium text-slate-800 outline-none"
                  />
                </label>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
              >
                {errorMsg}
              </div>
            )}

            {slotsLoading ? (
              <div className="py-20 text-center text-slate-400">
                Loading slots...
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                No slots are configured for this date.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
                {timeSlots.map((slot) => {
                  const normalizedSlot = normalizeSlot(slot);
                  const isFull = fullSlots.includes(normalizedSlot);

                  return (
                    <button
                      key={normalizedSlot}
                      type="button"
                      disabled={isFull}
                      onClick={() => handleSelectSlot(normalizedSlot)}
                      className={`flex h-24 flex-col items-center justify-between rounded-xl border p-3 text-center transition-all ${
                        isFull
                          ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-60'
                          : 'cursor-pointer border-slate-200 bg-white hover:border-purple-500 hover:shadow-md'
                      }`}
                    >
                      <span
                        className={`text-xs font-bold leading-tight ${
                          isFull ? 'text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {normalizedSlot}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                          isFull
                            ? 'bg-slate-200 text-slate-500'
                            : 'border border-emerald-200 bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {isFull ? 'Full' : 'Open'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {step === 'FILL_DETAILS' && (
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Selected Slot
                </span>

                <div className="mt-1 flex items-center space-x-3">
                  <span className="text-lg font-bold text-slate-900">
                    {selectedDate}
                  </span>
                  <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    {selectedSlot}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setStep('SELECT_SLOT');
                }}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Change Slot
              </button>
            </div>

            <form
              onSubmit={handleFormSubmit}
              className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Practitioner &amp; Institutional Details
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Please provide accurate verification information.
                </p>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
                >
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    Full Name &amp; Title *
                  </label>

                  <div className="flex space-x-2">
                    <select
                      aria-label="Title"
                      value={formData.title}
                      onChange={(event) =>
                        updateFormData('title', event.target.value)
                      }
                      className={selectClassName}
                    >
                      <option value="Dr.">Dr.</option>
                      <option value="Prof.">Prof.</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Mrs.">Mrs.</option>
                    </select>

                    <input
                      id="fullName"
                      required
                      type="text"
                      autoComplete="name"
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.fullName}
                      onChange={(event) =>
                        updateFormData('fullName', event.target.value)
                      }
                      className={inputClassName}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="specialty"
                    className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    Specialty / Department *
                  </label>

                  <input
                    id="specialty"
                    required
                    type="text"
                    placeholder="Anaesthesiology"
                    value={formData.specialty}
                    onChange={(event) =>
                      updateFormData('specialty', event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor="mobileNumber"
                    className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    Mobile Number *
                  </label>

                  <div className="flex space-x-2">
                    <select
                      aria-label="Country code"
                      value={formData.countryCode}
                      onChange={(event) =>
                        updateFormData('countryCode', event.target.value)
                      }
                      className={selectClassName}
                    >
                      <option value="+91 (IN)">+91 (IN)</option>
                      <option value="+1 (US)">+1 (US)</option>
                      <option value="+44 (UK)">+44 (UK)</option>
                    </select>

                    <input
                      id="mobileNumber"
                      required
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      minLength={7}
                      maxLength={20}
                      placeholder="9876543210"
                      value={formData.mobileNumber}
                      onChange={(event) =>
                        updateFormData('mobileNumber', event.target.value)
                      }
                      className={inputClassName}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    Email Address *
                  </label>

                  <input
                    id="email"
                    required
                    type="email"
                    autoComplete="email"
                    placeholder="doctor@hospital.com"
                    value={formData.email}
                    onChange={(event) =>
                      updateFormData('email', event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="hospitalName"
                    className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    Hospital Name *
                  </label>

                  <input
                    id="hospitalName"
                    required
                    type="text"
                    autoComplete="organization"
                    placeholder="e.g. All India Institute of Medical Sciences"
                    value={formData.hospitalName}
                    onChange={(event) =>
                      updateFormData('hospitalName', event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor="country"
                    className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    Country *
                  </label>

                  <select
                    id="country"
                    required
                    value={formData.country}
                    onChange={(event) =>
                      updateFormData('country', event.target.value)
                    }
                    className={inputClassName}
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    State / Province *
                  </label>

                  <input
                    id="state"
                    required
                    type="text"
                    autoComplete="address-level1"
                    placeholder="Haryana"
                    value={formData.state}
                    onChange={(event) =>
                      updateFormData('state', event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="city"
                    className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    City / Town *
                  </label>

                  <input
                    id="city"
                    required
                    type="text"
                    autoComplete="address-level2"
                    placeholder="Gurugram"
                    value={formData.city}
                    onChange={(event) =>
                      updateFormData('city', event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setErrorMsg('');
                    setStep('SELECT_SLOT');
                  }}
                  className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? 'Processing...'
                    : 'Confirm & Generate Ticket'}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'TICKET' && confirmedBooking && (
          <div className="mx-auto my-6 max-w-md space-y-4">
            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"
              >
                {errorMsg}
              </div>
            )}

            <div
              ref={ticketRef}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl"
            >
              <div className="space-y-1 bg-emerald-600 p-6 text-center text-white">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-6 w-6 stroke-[3] text-white" />
                </div>

                <h3 className="text-xl font-black">Booking Confirmed</h3>
                <p className="text-xs font-medium text-emerald-100">
                  Please download the ticket for entry
                </p>
              </div>

              <div className="space-y-5 p-6">
                <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-400">
                      Sequential No.
                    </span>
                    <span className="text-2xl font-black text-emerald-600">
                      {confirmedBooking.sequentialId}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="block text-[10px] font-bold uppercase text-slate-400">
                      Assigned Slot
                    </span>
                    <span className="block text-xs font-bold text-slate-800">
                      {confirmedBooking.slotDate}
                    </span>
                    <span className="block text-xs font-black text-emerald-600">
                      {confirmedBooking.slotTime}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                    Practitioner Details
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {confirmedBooking.title} {confirmedBooking.fullName}{' '}
                    <span className="text-xs font-semibold text-slate-500">
                      ({confirmedBooking.specialty})
                    </span>
                  </p>
                </div>

                <div>
                  <span className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                    Hospital &amp; Contact
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {confirmedBooking.hospitalName}
                  </p>
                  <p className="mt-0.5 break-words text-xs text-slate-500">
                    {confirmedBooking.countryCode}{' '}
                    {confirmedBooking.mobileNumber} •{' '}
                    {confirmedBooking.email}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                  <span className="mb-0.5 block text-[10px] font-bold uppercase text-emerald-700">
                    Location
                  </span>
                  <p className="text-xs font-medium text-emerald-900">
                    {confirmedBooking.city}, {confirmedBooking.state},{' '}
                    {confirmedBooking.country}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={downloading}
                onClick={handleDownloadTicket}
                className="flex flex-1 items-center justify-center space-x-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                <span>
                  {downloading ? 'Downloading...' : 'Download Ticket'}
                </span>
              </button>

              <button
                type="button"
                onClick={resetAll}
                className="flex flex-1 items-center justify-center space-x-2 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Book Another</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}