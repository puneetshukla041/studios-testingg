'use client';

import React, { useState, useEffect, useMemo } from 'react';

type CategoryType = 'all' | 'amnatram' | 'conference';

interface RegistrationData {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: 'amnatram' | 'conference';
  registrationDate: string;
  slotDetails: string;
}

export default function AdminDashboard() {
  const [filter, setFilter] = useState<CategoryType>('all');
  const [data, setData] = useState<RegistrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch data from MongoDB via our API route
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await fetch('/api/admin/bookings');
        const json = await res.json();
        
        if (!res.ok) throw new Error(json.error || 'Failed to fetch data');
        
        setData(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Filter the data based on the dropdown
  const filteredData = useMemo(() => {
    if (filter === 'all') return data;
    return data.filter((item) => item.category === filter);
  }, [filter, data]);

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <div className="mx-auto max-w-7xl">
        
        {/* Header & Controls */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">Manage all system registrations in one place.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <label htmlFor="category-filter" className="text-sm font-medium text-gray-700">
              Filter by:
            </label>
            <select
              id="category-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as CategoryType)}
              className="block w-48 rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-white shadow-sm border"
            >
              <option value="all">All Registrations</option>
              <option value="amnatram">Amnatram</option>
              <option value="conference">Conference</option>
            </select>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && <div className="text-center py-10 text-gray-500">Loading database records...</div>}
        {error && <div className="text-center py-10 text-red-500 bg-red-50 rounded-lg border border-red-200">Error: {error}</div>}

        {/* Data Table */}
        {!loading && !error && (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Contact Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Booked Slot</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Registered On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredData.length > 0 ? (
                    filteredData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900">{row.id}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 font-medium">{row.name}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          <div className="text-gray-800">{row.email}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{row.phone}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            row.category === 'conference' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {row.category}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-emerald-600">{row.slotDetails}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{row.registrationDate}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                        No records found for this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}