'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Check, Download, RefreshCw } from 'lucide-react';
import { generateTimeSlots } from '@/lib/slots';

export default function ConferenceSlotPage() {
  const [step, setStep] = useState<'SELECT_SLOT' | 'FILL_DETAILS' | 'TICKET'>('SELECT_SLOT');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-09');
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [formData, setFormData] = useState({
    title: 'Dr.',
    fullName: '',
    specialty: 'Surgery',
    countryCode: '+91 (IN)',
    mobileNumber: '',
    email: '',
    hospitalName: '',
    country: 'India',
    state: 'Delhi',
    city: 'New Delhi',
  });

  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeSlots(generateTimeSlots());
    fetchOccupiedSlots();
  }, [selectedDate]);

  const fetchOccupiedSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/slots/conference?date=${selectedDate}`);
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
      const res = await fetch('/api/bookings/conference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotDate: selectedDate,
          slotTime: selectedSlot,
          ...formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');

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
      link.download = `Conference-Ticket-${confirmedBooking?.sequentialId || 'SSI'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  const resetAll = () => {
    setStep('SELECT_SLOT');
    setSelectedSlot(null);
    setConfirmedBooking(null);
    fetchOccupiedSlots();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-16">
      <header className="bg-white border-b border-blue-200 px-6 py-4 shadow-sm relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-teal-500 to-indigo-500" />
        <div className="max-w-7xl mx-auto flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
            C
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              SSI Conference Portal
            </h1>
            <p className="text-xs text-slate-500 font-medium">Advanced Clinical Session Scheduling</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {step === 'SELECT_SLOT' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Select Session Slot</h2>
                <span className="inline-block mt-1 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  UNDER TESTING
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-6">
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

            {loading ? (
              <div className="py-20 text-center text-slate-400">Loading slots...</div>
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
                          : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-800 leading-tight">{slot}</span>
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

        {step === 'FILL_DETAILS' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  LOCKED TARGET SLOT
                </span>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-lg font-bold text-slate-900">{selectedDate}</span>
                  <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">
                    {selectedSlot}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep('SELECT_SLOT')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Change Slot
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Practitioner & Institutional Details</h2>
                <p className="text-xs text-slate-500 mt-1">Please provide accurate verification information.</p>
              </div>

              {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl">{errorMsg}</div>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    FULL NAME & TITLE *
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700"
                    >
                      <option>Dr.</option>
                      <option>Prof.</option>
                      <option>Mr.</option>
                    </select>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    SPECIALTY / DEPARTMENT *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Surgery"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    MOBILE NUMBER *
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={formData.countryCode}
                      onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700"
                    >
                      <option>+91 (IN)</option>
                      <option>+1 (US)</option>
                    </select>
                    <input
                      required
                      type="tel"
                      placeholder="9876543210"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                    />
                  </div>
                </div>

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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    COUNTRY *
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium"
                  >
                    <option>India</option>
                    <option>United States</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    STATE / PROVINCE *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Delhi"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    CITY / TOWN *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="New Delhi"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end items-center space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep('SELECT_SLOT')}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm"
                >
                  {loading ? 'Processing...' : 'Confirm & Generate Ticket'}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'TICKET' && confirmedBooking && (
          <div className="max-w-md mx-auto my-6 space-y-4">
            <div ref={ticketRef} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
              <div className="bg-emerald-600 text-white p-6 text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-white/20 mx-auto flex items-center justify-center mb-2">
                  <Check className="w-6 h-6 text-white stroke-[3]" />
                </div>
                <h3 className="text-xl font-black">Booking Confirmed</h3>
                <p className="text-xs text-emerald-100 font-medium">Please Download The Ticket For Entry</p>
              </div>

              <div className="p-6 space-y-5">
                <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">SEQUENTIAL NO</span>
                    <span className="text-2xl font-black text-emerald-600">{confirmedBooking.sequentialId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">ASSIGNED SLOT</span>
                    <span className="text-xs font-bold text-slate-800 block">{confirmedBooking.slotDate}</span>
                    <span className="text-xs font-black text-emerald-600 block">{confirmedBooking.slotTime}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">PRACTITIONER DETAILS</span>
                  <p className="text-sm font-bold text-slate-900">
                    {confirmedBooking.title} {confirmedBooking.fullName}{' '}
                    <span className="text-xs font-semibold text-slate-500">({confirmedBooking.specialty})</span>
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">HOSPITAL & CONTACT</span>
                  <p className="text-sm font-bold text-slate-900">{confirmedBooking.hospitalName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {confirmedBooking.countryCode} {confirmedBooking.mobileNumber} • {confirmedBooking.email}
                  </p>
                </div>

                <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-0.5">VENUE LOCATION</span>
                  <p className="text-xs font-medium text-emerald-900">
                    , {confirmedBooking.city}, {confirmedBooking.state}, {confirmedBooking.country}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadTicket}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-100"
              >
                <Download className="w-4 h-4" />
                <span>Download Ticket</span>
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2"
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