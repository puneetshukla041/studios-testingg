'use client';

import React, { useEffect, useMemo, useState } from 'react';

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

interface AdminBookingsResponse {
  data?: RegistrationData[];
  error?: string;
}

function getCategoryLabel(category: RegistrationData['category']) {
  return category === 'conference' ? 'Conference' : 'Amnatram';
}

function getCategoryClass(category: RegistrationData['category']) {
  return category === 'conference'
    ? 'border-purple-200 bg-purple-100 text-purple-800'
    : 'border-blue-200 bg-blue-100 text-blue-800';
}

function CategoryBadge({
  category,
}: {
  category: RegistrationData['category'];
}) {
  return (
    <span
      className={`inline-flex max-w-full rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider sm:px-3 ${
        getCategoryClass(category)
      }`}
    >
      {getCategoryLabel(category)}
    </span>
  );
}

export default function AdminDashboard() {
  const [filter, setFilter] = useState<CategoryType>('all');
  const [data, setData] = useState<RegistrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const fetchAdminData = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/admin/bookings', {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });

        const contentType = response.headers.get('content-type');

        if (!contentType?.includes('application/json')) {
          throw new Error('The server returned an invalid response.');
        }

        const json =
          (await response.json()) as AdminBookingsResponse;

        if (!response.ok) {
          throw new Error(
            json.error || 'Failed to fetch registration data.'
          );
        }

        setData(Array.isArray(json.data) ? json.data : []);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : 'Unable to load registration data.'
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchAdminData();

    return () => controller.abort();
  }, []);

  const filteredData = useMemo(() => {
    if (filter === 'all') {
      return data;
    }

    return data.filter((item) => item.category === filter);
  }, [data, filter]);

  const registrationCounts = useMemo(
    () => ({
      all: data.length,
      amnatram: data.filter(
        (item) => item.category === 'amnatram'
      ).length,
      conference: data.filter(
        (item) => item.category === 'conference'
      ).length,
    }),
    [data]
  );

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-10">
        <header className="mb-6 flex flex-col gap-5 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-600">
              Administration
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
              Admin Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
              Manage all system registrations in one place.
            </p>
          </div>

          <div className="w-full lg:w-auto">
            <label
              htmlFor="category-filter"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Filter by category
            </label>

            <select
              id="category-filter"
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as CategoryType)
              }
              className="block min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
            >
              <option value="all">
                All Registrations ({registrationCounts.all})
              </option>
              <option value="amnatram">
                Amnatram ({registrationCounts.amnatram})
              </option>
              <option value="conference">
                Conference ({registrationCounts.conference})
              </option>
            </select>
          </div>
        </header>

        {!loading && !error && (
          <section
            aria-label="Registration summary"
            className="mb-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3 sm:gap-4"
          >
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                {registrationCounts.all}
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Amnatram
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-900 sm:text-3xl">
                {registrationCounts.amnatram}
              </p>
            </div>

            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">
                Conference
              </p>
              <p className="mt-1 text-2xl font-bold text-purple-900 sm:text-3xl">
                {registrationCounts.conference}
              </p>
            </div>
          </section>
        )}

        {loading && (
          <section
            aria-live="polite"
            className="rounded-xl border border-gray-200 bg-white px-4 py-14 text-center shadow-sm sm:py-20"
          >
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="mt-4 text-sm text-gray-500">
              Loading database records...
            </p>
          </section>
        )}

        {!loading && error && (
          <section
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center shadow-sm sm:px-6 sm:py-12"
          >
            <h2 className="text-base font-semibold text-red-800">
              Unable to load registrations
            </h2>
            <p className="mt-2 break-words text-sm text-red-600">
              {error}
            </p>
          </section>
        )}

        {!loading && !error && filteredData.length === 0 && (
          <section className="rounded-xl border border-gray-200 bg-white px-4 py-14 text-center shadow-sm sm:py-20">
            <h2 className="text-base font-semibold text-gray-800">
              No records found
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              There are no registrations for the selected category.
            </p>
          </section>
        )}

        {!loading && !error && filteredData.length > 0 && (
          <>
            {/* Mobile and tablet card layout */}
            <section
              aria-label="Registration records"
              className="grid grid-cols-1 gap-4 md:hidden"
            >
              {filteredData.map((row) => (
                <article
                  key={row.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        Registration ID
                      </p>
                      <p className="mt-0.5 break-all text-sm font-bold text-gray-900">
                        {row.id}
                      </p>
                    </div>

                    <CategoryBadge category={row.category} />
                  </div>

                  <div className="space-y-4 p-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        Name
                      </p>
                      <p className="mt-1 break-words text-sm font-semibold text-gray-900">
                        {row.name || 'Not provided'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Email
                        </p>
                        <a
                          href={`mailto:${row.email}`}
                          className="mt-1 block break-all text-sm text-blue-700 hover:underline"
                        >
                          {row.email || 'Not provided'}
                        </a>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Phone
                        </p>
                        <a
                          href={`tel:${row.phone}`}
                          className="mt-1 block break-words text-sm text-gray-700 hover:text-blue-700"
                        >
                          {row.phone || 'Not provided'}
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 min-[420px]:grid-cols-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Booked Slot
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-emerald-700">
                          {row.slotDetails || 'Not assigned'}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          Registered On
                        </p>
                        <p className="mt-1 break-words text-sm text-gray-700">
                          {row.registrationDate || 'Not available'}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            {/* Desktop table layout */}
            <section className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
              <div className="max-w-full overflow-x-auto">
                <table className="w-full min-w-[1000px] table-auto divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 lg:px-6"
                      >
                        ID
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 lg:px-6"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 lg:px-6"
                      >
                        Contact Info
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 lg:px-6"
                      >
                        Category
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 lg:px-6"
                      >
                        Booked Slot
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 lg:px-6"
                      >
                        Registered On
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredData.map((row) => (
                      <tr
                        key={row.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="max-w-40 px-4 py-4 align-top text-sm font-bold text-gray-900 lg:px-6">
                          <span className="block break-all">
                            {row.id}
                          </span>
                        </td>

                        <td className="max-w-48 px-4 py-4 align-top text-sm font-medium text-gray-700 lg:px-6">
                          <span className="block break-words">
                            {row.name || 'Not provided'}
                          </span>
                        </td>

                        <td className="max-w-64 px-4 py-4 align-top text-sm text-gray-500 lg:px-6">
                          <a
                            href={`mailto:${row.email}`}
                            className="block break-all text-gray-800 hover:text-blue-700 hover:underline"
                          >
                            {row.email || 'Not provided'}
                          </a>

                          <a
                            href={`tel:${row.phone}`}
                            className="mt-1 block break-words text-xs text-gray-500 hover:text-blue-700"
                          >
                            {row.phone || 'Not provided'}
                          </a>
                        </td>

                        <td className="px-4 py-4 align-top text-sm lg:px-6">
                          <CategoryBadge category={row.category} />
                        </td>

                        <td className="max-w-52 px-4 py-4 align-top text-sm font-medium text-emerald-700 lg:px-6">
                          <span className="block break-words">
                            {row.slotDetails || 'Not assigned'}
                          </span>
                        </td>

                        <td className="max-w-48 px-4 py-4 align-top text-sm text-gray-500 lg:px-6">
                          <span className="block break-words">
                            {row.registrationDate || 'Not available'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}