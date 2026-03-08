/* app/admin/monthly-meeting/page.tsx */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface Member {
  id: string;
  surname: string;
  givenName: string;
  memberStatus: string;
}

interface MonthlyAttendance {
  memberId: string;
  present: boolean;
  absent: boolean;
  excused: boolean;
  excuseLetter: string;
  dueChecked: boolean;
  dueAmount: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  reason: string;
}

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

// Helper function to format name as "Surname, I."
const formatMemberName = (surname: string, givenName: string) => {
  const initials = givenName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('.');
  return `${surname}, ${initials}.`;
};

export default function MonthlyMeetingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Record<string, MonthlyAttendance>>({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [showExcuseModal, setShowExcuseModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [excuseText, setExcuseText] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'attendance' | 'financial' | 'expenses'>('attendance');
  const [showDateTimeEditor, setShowDateTimeEditor] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('12:00');
  const [meetingDay, setMeetingDay] = useState(1);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', reason: '' });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;

  // Calculate first Sunday of the selected month
  const calculateFirstSunday = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    return 1 + daysUntilSunday;
  };

  // Initialize meeting date when month/year changes
  useEffect(() => {
    const firstSundayDay = calculateFirstSunday(selectedYear, selectedMonth);
    const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(firstSundayDay).padStart(2, '0')}`;
    
    setMeetingDate(formattedDate);
    setMeetingDay(firstSundayDay);
    setMeetingTime('12:00');
  }, [selectedMonth, selectedYear]);

  // Update meeting day when date changes
  useEffect(() => {
    if (meetingDate) {
      const date = new Date(meetingDate);
      setMeetingDay(date.getDate());
    }
  }, [meetingDate]);

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN' && session?.user?.userType !== 'ADMIN') {
        router.push('/member/dashboard');
        return;
      }
      fetchMembers();
    } else if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (members.length > 0) {
      fetchAttendance();
    }
  }, [selectedMonth, selectedYear, members]);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members?status=ACTIVE');
      
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      
      const data = await response.json();
      setMembers(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
      setIsLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch(`/api/attendance/monthly?month=${selectedMonth}&year=${selectedYear}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance');
      }
      
      const data = await response.json();
      
      const initialAttendance: Record<string, MonthlyAttendance> = {};
      members.forEach(member => {
        const existingData = data.find((a: any) => a.memberId === member.id);
        
        initialAttendance[member.id] = existingData || {
          memberId: member.id,
          present: false,
          absent: false,
          excused: false,
          excuseLetter: '',
          dueChecked: false,
          dueAmount: 0,
        };
      });
      
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      
      const initialAttendance: Record<string, MonthlyAttendance> = {};
      members.forEach(member => {
        initialAttendance[member.id] = {
          memberId: member.id,
          present: false,
          absent: false,
          excused: false,
          excuseLetter: '',
          dueChecked: false,
          dueAmount: 0,
        };
      });
      
      setAttendance(initialAttendance);
    }
  };

  const handlePresentChange = (memberId: string) => {
    if (!isCurrentMonth) return;
    
    setAttendance(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        present: !prev[memberId]?.present,
        absent: false,
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleAbsentChange = (memberId: string) => {
    if (!isCurrentMonth) return;
    
    setAttendance(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        absent: !prev[memberId]?.absent,
        present: false,
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleExcusedChange = (memberId: string) => {
    if (!isCurrentMonth) return;
    
    setAttendance(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        excused: !prev[memberId]?.excused,
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleDueChange = (memberId: string) => {
    if (!isCurrentMonth) return;
    
    setAttendance(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        dueChecked: !prev[memberId]?.dueChecked,
        dueAmount: !prev[memberId]?.dueChecked ? 20 : 0,
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleDueAmountChange = (memberId: string, amount: string) => {
    if (!isCurrentMonth) return;
    
    const numAmount = parseFloat(amount) || 0;
    
    setAttendance(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        dueAmount: numAmount,
        dueChecked: numAmount >= 20 ? true : prev[memberId]?.dueChecked,
      }
    }));
    setHasUnsavedChanges(true);
  };

  const openExcuseModal = (memberId: string) => {
    setSelectedMember(memberId);
    setExcuseText(attendance[memberId]?.excuseLetter || '');
    setShowExcuseModal(true);
  };

  const saveExcuseLetter = () => {
    if (selectedMember) {
      setAttendance(prev => ({
        ...prev,
        [selectedMember]: {
          ...prev[selectedMember],
          excuseLetter: excuseText,
        }
      }));
      setHasUnsavedChanges(true);
    }
    setShowExcuseModal(false);
    setSelectedMember(null);
    setExcuseText('');
  };

  const handleAddExpense = () => {
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.reason) {
      toast.error('Please fill in all fields');
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      reason: expenseForm.reason,
    };

    setExpenses([...expenses, newExpense]);
    setExpenseForm({ description: '', amount: '', reason: '' });
    setShowExpenseForm(false);
    toast.success('Expense added successfully!');
    setHasUnsavedChanges(true);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
    toast.success('Expense deleted successfully!');
    setHasUnsavedChanges(true);
  };

  const handleSaveAttendance = async () => {
    try {
      const response = await fetch('/api/attendance/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          attendance: Object.values(attendance),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save attendance');
      }
      
      toast.success('Attendance saved successfully!');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance');
    }
  };

  const handleSaveMeetingDateTime = () => {
    const date = new Date(meetingDate);
    const day = date.getDate();
    setMeetingDay(day);
    toast.success(`Meeting set for ${MONTHS[selectedMonth]} ${day} at ${meetingTime}`);
    setShowDateTimeEditor(false);
  };

  const getTotals = () => {
    const attendanceValues = Object.values(attendance);
    return {
      present: attendanceValues.filter(a => a.present).length,
      absent: attendanceValues.filter(a => a.absent).length,
      excused: attendanceValues.filter(a => a.excused).length,
      duesPaid: attendanceValues.filter(a => a.dueChecked).length,
      totalAmount: attendanceValues.reduce((sum, a) => sum + (a.dueAmount || 0), 0),
    };
  };

  const getExpensesTotals = () => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  const totals = getTotals();
  const expensesTotals = getExpensesTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 pb-24">
      {/* Blue Header with Back Button and Logo */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="relative w-16 h-16">
            <Image
              src="/images/MAS LOGO.png"
              alt="MAS Logo"
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* White Content Card */}
      <div className="bg-white rounded-t-[2rem] mt-4 min-h-screen px-6 py-6">
        {/* Header with Tab Icons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Attendance Tab */}
            <button
              onClick={() => setActiveTab('attendance')}
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'attendance'
                  ? 'bg-blue-700'
                  : 'bg-white border-2 border-blue-700'
              }`}
            >
              <svg 
                className={`w-6 h-6 ${activeTab === 'attendance' ? 'text-white' : 'text-blue-700'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            {/* Financial Tab */}
            <button
              onClick={() => setActiveTab('financial')}
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'financial'
                  ? 'bg-blue-700'
                  : 'bg-white border-2 border-blue-700'
              }`}
            >
              <svg 
                className={`w-6 h-6 ${activeTab === 'financial' ? 'text-white' : 'text-blue-700'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Expenses Tab */}
            <button
              onClick={() => setActiveTab('expenses')}
              className={`p-3 rounded-xl transition-all ${
                activeTab === 'expenses'
                  ? 'bg-blue-700'
                  : 'bg-white border-2 border-blue-700'
              }`}
            >
              <svg 
                className={`w-6 h-6 ${activeTab === 'expenses' ? 'text-white' : 'text-blue-700'}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3v3m-6-6v6a2 2 0 002 2h10a2 2 0 002-2v-6m-9-3h3m-3 0a2 2 0 00-2 2v2a2 2 0 002 2h3a2 2 0 002-2v-2a2 2 0 00-2-2m-3 0V5a2 2 0 012-2h3a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
          
          {/* Set Monthly Meeting Button */}
          <button
            onClick={() => setShowDateTimeEditor(true)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className="font-medium">Set Monthly Meeting</span>
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        {/* Attendance Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">ATTENDANCE {selectedYear}</h2>

        {/* Month Selector with Date */}
        <div className="mb-4">
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
            {MONTHS.map((month, index) => (
              <button
                key={month}
                onClick={() => setSelectedMonth(index)}
                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  selectedMonth === index
                    ? 'bg-blue-700 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {month}
              </button>
            ))}
          </div>
          
          {/* Display Meeting Date */}
          <div className="mt-3 text-center">
            <p className="text-lg font-bold text-gray-900">
              {MONTHS[selectedMonth]} {meetingDay}
            </p>
            <p className="text-sm text-gray-600">
              Meeting Time: {meetingTime}
            </p>
          </div>
        </div>

        {/* Notice */}
        {isCurrentMonth && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
            <p className="text-xs text-red-500 font-semibold leading-tight">
              *ONLY CHECK DUE IF MEMBER PAYS FULLY<br/>
              OTHERWISE, PUT THE AMOUNT
            </p>
          </div>
        )}

        {!isCurrentMonth && (
          <div className="bg-gray-50 border-l-4 border-gray-400 p-3 mb-4">
            <p className="text-sm text-gray-600">
              Viewing {MONTHS[selectedMonth]} {selectedYear}. Only current month can be edited.
            </p>
          </div>
        )}

        {/* Attendance Table */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-lg overflow-hidden mb-6 shadow-sm border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Name</th>
                    <th className="text-center py-3 px-2 text-sm font-bold text-gray-700">Present</th>
                    <th className="text-center py-3 px-2 text-sm font-bold text-gray-700">Absent</th>
                    <th className="text-center py-3 px-2 text-sm font-bold text-gray-700">Excused</th>
                    <th className="text-center py-3 px-2 text-sm font-bold text-gray-700">Due</th>
                    <th className="text-center py-3 px-4 text-sm font-bold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatMemberName(member.surname, member.givenName)}
                        </div>
                      </td>
                      <td className="text-center py-4 px-2">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attendance[member.id]?.present || false}
                            onChange={() => handlePresentChange(member.id)}
                            disabled={!isCurrentMonth}
                            className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 disabled:opacity-50 cursor-pointer"
                          />
                        </label>
                      </td>
                      <td className="text-center py-4 px-2">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attendance[member.id]?.absent || false}
                            onChange={() => handleAbsentChange(member.id)}
                            disabled={!isCurrentMonth}
                            className="w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500 disabled:opacity-50 cursor-pointer"
                          />
                        </label>
                      </td>
                      <td className="text-center py-4 px-2">
                        <div className="flex items-center justify-center space-x-2">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={attendance[member.id]?.excused || false}
                              onChange={() => handleExcusedChange(member.id)}
                              disabled={!isCurrentMonth}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                            />
                          </label>
                          {attendance[member.id]?.excused && (
                            <button
                              onClick={() => openExcuseModal(member.id)}
                              className="text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-blue-50 rounded"
                              title="View/Edit Excuse Letter"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-4 px-2">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attendance[member.id]?.dueChecked || false}
                            onChange={() => handleDueChange(member.id)}
                            disabled={!isCurrentMonth}
                            className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 disabled:opacity-50 cursor-pointer"
                          />
                        </label>
                      </td>
                      <td className="text-center py-4 px-4">
                        <input
                          type="number"
                          value={attendance[member.id]?.dueAmount || ''}
                          onChange={(e) => handleDueAmountChange(member.id, e.target.value)}
                          disabled={!isCurrentMonth}
                          placeholder="0"
                          className="w-24 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-600"
                          min="0"
                          step="1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                  <tr>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 uppercase">Total</td>
                    <td className="px-2 py-3 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                        {totals.present}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800">
                        {totals.absent}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                        {totals.excused}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-800">
                        {totals.duesPaid}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-lg font-bold text-gray-900">
                        ₱{totals.totalAmount.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Financial Tab Content */}
        {activeTab === 'financial' && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Financial Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                <span className="font-semibold text-gray-700">Members Paid Dues</span>
                <span className="text-2xl font-bold text-purple-600">{totals.duesPaid}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <span className="font-semibold text-gray-700">Total Amount Collected</span>
                <span className="text-2xl font-bold text-green-600">₱{totals.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Expenses Tab Content */}
        {activeTab === 'expenses' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Expenses & Fund Usage</h3>
                {isCurrentMonth && (
                  <button
                    onClick={() => setShowExpenseForm(!showExpenseForm)}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Expense</span>
                  </button>
                )}
              </div>
            </div>

            {/* Add Expense Form */}
            {isCurrentMonth && showExpenseForm && (
              <div className="p-6 bg-blue-50 border-b border-gray-200">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Expense Description
                    </label>
                    <input
                      type="text"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      placeholder="e.g., Altar supplies, Candles, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount (₱)
                    </label>
                    <input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reason for Fund Use
                    </label>
                    <textarea
                      value={expenseForm.reason}
                      onChange={(e) => setExpenseForm({ ...expenseForm, reason: e.target.value })}
                      placeholder="Explain the purpose and details of this expense..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-24"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowExpenseForm(false);
                        setExpenseForm({ description: '', amount: '', reason: '' });
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddExpense}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Save Expense
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Expenses List */}
            <div className="p-6">
              {expenses.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No expenses recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{expense.description}</h4>
                          <p className="text-sm text-gray-600 mt-1">{expense.reason}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-blue-600">₱{expense.amount.toFixed(2)}</p>
                          {isCurrentMonth && (
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-600 hover:text-red-800 text-sm mt-2 transition-colors"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Total */}
                  <div className="mt-6 pt-4 border-t-2 border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total Expenses</span>
                      <span className="text-2xl font-bold text-orange-600">₱{expensesTotals.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        {isCurrentMonth && hasUnsavedChanges && (
          <div className="mb-6 mt-6">
            <button
              onClick={handleSaveAttendance}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-colors"
            >
              SAVE CHANGES
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-blue-800 rounded-t-3xl shadow-lg">
        <div className="flex justify-around items-center py-4 px-6">
          <Link href="/admin" className="flex flex-col items-center text-white">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </Link>
          <button className="flex flex-col items-center text-white">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button className="flex flex-col items-center text-white">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Meeting Date & Time Editor Modal */}
      {showDateTimeEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-blue-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Set Monthly Meeting</h3>
                <button
                  onClick={() => setShowDateTimeEditor(false)}
                  className="text-white/80 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-blue-100 mt-2">
                {MONTHS[selectedMonth]} {selectedYear}
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Meeting Date
                </label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Default: First Sunday of the month</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Meeting Time
                </label>
                <input
                  type="time"
                  value={meetingTime}
                  onChange={(e) => setMeetingTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 12:00 PM (Noon)</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDateTimeEditor(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMeetingDateTime}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excuse Letter Modal */}
      {showExcuseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center space-x-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Excuse Letter</span>
                </h3>
                <button
                  onClick={() => setShowExcuseModal(false)}
                  className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {selectedMember && (
                <p className="text-blue-100 mt-2">
                  {(() => {
                    const member = members.find(m => m.id === selectedMember);
                    return member ? formatMemberName(member.surname, member.givenName) : '';
                  })()}
                </p>
              )}
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Excuse Letter Details
              </label>
              <textarea
                value={excuseText}
                onChange={(e) => setExcuseText(e.target.value)}
                placeholder="Enter excuse letter details here..."
                className="w-full h-48 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                disabled={!isCurrentMonth}
              />
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowExcuseModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                {isCurrentMonth && (
                  <button
                    onClick={saveExcuseLetter}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>Save Letter</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}