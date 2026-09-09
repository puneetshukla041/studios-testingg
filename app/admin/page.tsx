'use client';

import React, { useState, useMemo } from 'react';

// --- Types ---
type CategoryType = 'all' | 'amnatram' | 'conference';

interface RegistrationData {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: 'amnatram' | 'conference';
  registrationDate: string;
  status: 'Pending' | 'Approved' | 'Cancelled';
}

// --- Mock Data (Replace with your actual API/DB fetch) ---
const mockData: RegistrationData[] = [
  { id: 'REQ-001', name: 'Amit Kumar', email: 'amit@example.com', phone: '+91 9876543210', category: 'amnatram', registrationDate: '2026-09-08', status: 'Approved' },
  { id: 'REQ-002', name: 'Sarah Jenkins', email: 'sarah.j@example.com', phone: '+1 555-0198', category: 'conference', registrationDate: '2026-09-09', status: 'Pending' },
  { id: 'REQ-003', name: 'Rahul Sharma', email: 'rahul.s@example.com', phone: '+91 9876543212', category: 'amnatram', registrationDate: '2026-09-09', status: 'Pending' },
  { id: 'REQ-004', name: 'Dr. Emily Chen', email: 'emily.chen@university.edu', phone: '+44 7911 123456', category: 'conference', registrationDate: '2026-09-07', status: 'Approved' },
];

export default function AdminDashboard() {
  const [filter, setFilter] = useState<CategoryType>('all');

  // Filter the data based on the dropdown selection
  const filteredData = useMemo(() => {
    if (filter === 'all') return mockData;
    return mockData.filter((item) => item.category === filter);
  }, [filter]);

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
      <div className="mx-auto max-w-7xl">
        {/* Header & Controls */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">Manage registrations for Amnatram and Conference events.</p>
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

        {/* Data Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Contact Info</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{row.id}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{row.name}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <div>{row.email}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{row.phone}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          row.category === 'conference' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {row.category.charAt(0).toUpperCase() + row.category.slice(1)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{row.registrationDate}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          row.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                          row.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">View</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                      No records found for the selected category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}