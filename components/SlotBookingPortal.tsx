'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Check, Download, ArrowLeft, Calendar, Clock, RefreshCw } from 'lucide-react';

interface Props {
  portalType: 'mantram' | 'conference';
  titleName: string;
}

export default function SlotBookingPortal({ portalType, titleName }: Props) {
  const [step, setStep] = useState<'SELECT_SLOT' | 'FILL_DETAILS' | 'TICKET'>(
    'SELECT_SLOT'
  );
  
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-09');
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
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

  // Confirmed Booking Response Data
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  // Fetch slot statuses whenever date or portalType changes
  useEffect(() => {
    fetchSlots();
  }, [selectedDate, portalType]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      // Import dynamic slots
      const { generateTimeSlots } = await import('@/lib/slots');
      setTimeSlots(generateTimeSlots());

      const res = await fetch(`/api/slots?type=${portalType}&date=${selectedDate}`);
      const data = await res.json();
      if (res.ok) {
        setOccupiedSlots(data.occupiedSlots || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slot: string) => {
    if (occupiedSlots.includes(slot)) return;
    setSelectedSlot(slot);
    setStep('FILL_DETAILS');
    setErrorMsg('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portalType,
          slotDate: selectedDate,
          slotTime: selectedSlot,
          ...formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit booking');
      }

      setConfirmedBooking(data.booking);
      setStep('TICKET');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    try {
      const dataUrl = await toPng(ticketRef.current, { cacheBust: true, quality: 0.95 });
      const link = document.createElement('a');
      link.download = `Booking-Ticket-${confirmedBooking?.sequentialId || 'SSI'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download ticket image:', err);
    }
  };

  const resetAll = () => {
    setStep('SELECT_SLOT');
    setSelectedSlot(null);
    setConfirmedBooking(null);
    fetchSlots();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-purple-200 px-6 py-4 shadow-sm relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />
        <div className="max-w-7xl mx-auto flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
            S
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {titleName}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Advanced Clinical Session Scheduling
            </p>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 mt-8">
        {/* STEP 1: SELECT SLOT */}
        {step === 'SELECT_SLOT' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Select Session Slot</h2>
                <span className="inline-block mt-1 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  UNDER TESTING
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                {/* Status Badges */}
                <div className="flex items-center space-x-4 text-xs font-semibold">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600">Available</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                    <span className="text-slate-600">Occupied</span>
                  </div>
                </div>

                {/* Session Date Selector */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    SESSION DATE
                  </span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent font-medium text-slate-800 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Slots Grid */}
            {loading ? (
              <div className="py-20 text-center text-slate-400">Loading available slots...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
                {timeSlots.map((slot) => {
                  const isOccupied = occupiedSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      disabled={isOccupied}
                      onClick={() => handleSelectSlot(slot)}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between h-24 ${
                        isOccupied
                          ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                          : 'bg-white border-slate-200 hover:border-purple-500 hover:shadow-md cursor-pointer'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800 leading-tight">
                        {slot}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          isOccupied
                            ? 'bg-slate-200 text-slate-500'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}
                      >
                        {isOccupied ? 'OCCUPIED' : 'OPEN'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: FORM FILLING */}
        {step === 'FILL_DETAILS' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Target Locked Banner */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  LOCKED TARGET SLOT
                </span>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-lg font-bold text-slate-900">{selectedDate}</span>
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-100">
                    {selectedSlot}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep('SELECT_SLOT')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                Change Slot
              </button>
            </div>

            {/* Form Box */}
            <form onSubmit={handleFormSubmit} className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Practitioner & Institutional Details
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Please provide accurate verification information for your clinical slot record.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-200 text-xs rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name & Title */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    FULL NAME & TITLE *
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none"
                    >
                      <option>Dr.</option>
                      <option>Prof.</option>
                      <option>Mr.</option>
                      <option>Ms.</option>
                    </select>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Specialty / Department */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    SPECIALTY / DEPARTMENT *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Anaesthesiology"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    MOBILE NUMBER *
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={formData.countryCode}
                      onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none"
                    >
                      <option>+91 (IN)</option>
                      <option>+1 (US)</option>
                      <option>+44 (UK)</option>
                    </select>
                    <input
                      required
                      type="tel"
                      placeholder="9876543210"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Hospital Name */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    HOSPITAL NAME *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. All India Institute of Medical Sciences"
                    value={formData.hospitalName}
                    onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    COUNTRY *
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none"
                  >
                    <option>India</option>
                    <option>United States</option>
                    <option>United Kingdom</option>
                  </select>
                </div>

                {/* State / Province */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    STATE / PROVINCE *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Haryana"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* City / Town */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    CITY / TOWN *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Gurugram"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep('SELECT_SLOT')}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 transition"
                >
                  {loading ? 'Processing...' : 'Confirm & Generate Ticket'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: TICKET SUMMARY & DOWNLOAD */}
        {step === 'TICKET' && confirmedBooking && (
          <div className="max-w-md mx-auto my-6 space-y-4">
            {/* Ticket Canvas Container */}
            <div
              ref={ticketRef}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl"
            >
              {/* Green Header Banner */}
              <div className="bg-emerald-600 text-white p-6 text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-white/20 mx-auto flex items-center justify-center mb-2">
                  <Check className="w-6 h-6 text-white stroke-[3]" />
                </div>
                <h3 className="text-xl font-black tracking-tight">Booking Confirmed</h3>
                <p className="text-xs text-emerald-100 font-medium">
                  Please Download The Ticket For Entry
                </p>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-5">
                {/* Sequential No & Slot */}
                <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      SEQUENTIAL NO
                    </span>
                    <span className="text-2xl font-black text-emerald-600 tracking-tight">
                      {confirmedBooking.sequentialId}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      ASSIGNED SLOT
                    </span>
                    <span className="text-xs font-bold text-slate-800 block">
                      {confirmedBooking.slotDate}
                    </span>
                    <span className="text-xs font-black text-emerald-600 block">
                      {confirmedBooking.slotTime}
                    </span>
                  </div>
                </div>

                {/* Practitioner Details */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    PRACTITIONER DETAILS
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {confirmedBooking.title} {confirmedBooking.fullName}{' '}
                    <span className="text-xs font-semibold text-slate-500">
                      ({confirmedBooking.specialty})
                    </span>
                  </p>
                </div>

                {/* Hospital & Contact */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    HOSPITAL & CONTACT
                  </span>
                  <p className="text-sm font-bold text-slate-900 leading-snug">
                    {confirmedBooking.hospitalName}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {confirmedBooking.countryCode} {confirmedBooking.mobileNumber} • {confirmedBooking.email}
                  </p>
                </div>

                {/* Venue Location */}
                <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-0.5">
                    VENUE LOCATION
                  </span>
                  <p className="text-xs font-medium text-emerald-900">
                    , {confirmedBooking.city}, {confirmedBooking.state}, {confirmedBooking.country}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadTicket}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-100 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download Ticket</span>
              </button>

              <button
                type="button"
                onClick={resetAll}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Book Another</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}