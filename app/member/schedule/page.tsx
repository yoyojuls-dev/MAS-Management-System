'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface Schedule {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: 'duty' | 'meeting' | 'event';
  status: 'upcoming' | 'completed' | 'cancelled';
}

export default function MemberSchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'expenses'>('schedule');
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      const userId = session?.user?.id;
      if (!userId) {
        setExpenses([]);
        return;
      }
      
      const response = await fetch(`/api/member/expenses?memberId=${userId}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setExpenses(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError(`Failed to load expenses: ${errorData.error}`);
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Network error while fetching expenses');
      setExpenses([]);
    }
  }, [session?.user]);

  const fetchSchedules = useCallback(async () => {
    try {
      const userId = session?.user?.id;
      if (!userId) {
        setSchedules([]);
        return;
      }
      
      const response = await fetch(`/api/member/schedule?memberId=${userId}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchedules(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError(`Failed to load schedule: ${errorData.error}`);
        setSchedules([]);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setError('Network error while fetching schedule');
      setSchedules([]);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role === 'ADMIN' || session?.user?.userType === 'ADMIN') {
        router.push('/admin');
        return;
      }
    } else if (status === 'unauthenticated') {
      router.push('/member/login');
      return;
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      setError(null);
      fetchExpenses();
      fetchSchedules();
    }
  }, [status, session?.user?.id, fetchExpenses, fetchSchedules]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatAmount = (amount: number) => {
    return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'upcoming':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'duty':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'meeting':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'event':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
        }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const upcomingSchedules = schedules.filter(s => s.status === 'upcoming').slice(0, 10);
  const recentExpenses = expenses.slice(0, 10);

  return (
    <div 
      className="min-h-screen pb-24"
      style={{
        background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
      }}
    >
      {/* Header Section */}
      <div className="px-6 py-6">
        <div className="flex items-start justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:bg-white/30 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="relative w-16 h-16">
            <Image
              src="/images/MAS LOGO.png"
              alt="MAS Logo"
              fill
              sizes="64px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Schedule</h1>
          <p className="text-white/80 text-sm">Your duties, meetings, and expenses</p>
        </div>

        <div className="flex bg-white/20 backdrop-blur-sm rounded-xl p-1">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'schedule'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            Schedule
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'expenses'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-white/80 hover:text-white'
            }`}
          >
            Expenses
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div 
        className="bg-white min-h-screen px-6 py-6"
        style={{
          borderRadius: '30px 30px 0 0',
          marginTop: '20px'
        }}
      >
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {activeTab === 'schedule' ? (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Upcoming Schedule ({upcomingSchedules.length})
            </h2>
            {upcomingSchedules.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Schedule</h3>
                <p className="text-gray-600">You have no scheduled activities in the database.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                          {getTypeIcon(schedule.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{schedule.title}</h3>
                          <p className="text-gray-600 text-sm mb-1">{schedule.location}</p>
                          <p className="text-blue-600 text-sm font-medium">
                            {formatDate(schedule.date)} at {formatTime(schedule.time)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(schedule.status)}`}>
                        {schedule.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recent Expenses ({recentExpenses.length})
            </h2>
            {recentExpenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Expenses Found</h3>
                <p className="text-gray-600">You have no recorded expenses in the database.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg">{expense.description}</h3>
                        <p className="text-gray-600 text-sm mb-1">{expense.category}</p>
                        <p className="text-blue-600 text-sm font-medium">
                          {formatDate(expense.date)}
                        </p>
                        {expense.approvedBy && (
                          <p className="text-gray-500 text-xs mt-1">
                            Approved by {expense.approvedBy}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900 mb-2">
                          {formatAmount(expense.amount)}
                        </p>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(expense.status)}`}>
                          {expense.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div 
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 rounded-[30px] p-4 shadow-2xl z-50"
        style={{
          background: '#000080'
        }}
      >
        <div className="flex justify-center space-x-8 px-4">
          <Link
            href="/member/dashboard"
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-xs">Home</span>
          </Link>
          
          <Link
            href="/member/schedule"
            className="flex flex-col items-center text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Schedule</span>
          </Link>
          
          <Link
            href="/member/group"
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs">Group</span>
          </Link>
        </div>
      </div>
    </div>
  );
}