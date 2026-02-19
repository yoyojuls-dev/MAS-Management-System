// app/admin/messages/page.tsx
'use client';

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Member {
  id: string;
  surname: string;
  givenName: string;
  email: string;
  memberStatus: string;
}

export default function AdminMessages() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    selectedMemberIds: [] as string[],
    subject: '',
    message: '',
    sendImmediately: true,
    scheduledDate: '',
    scheduledTime: '09:00',
  });

  const loadMembers = useCallback(async () => {
    try {
      const response = await fetch("/api/members?status=ACTIVE");
      if (!response.ok) throw new Error("Failed to load members");
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error("Error loading members:", error);
      toast.error("Failed to load members");
    }
  }, []);

  useEffect(() => {
    loadMembers();
    setLoading(false);
  }, [loadMembers]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get minimum date (today)
  const getMinDate = () => getTodayDate();

  // Filter members based on search query
  const filteredMembers = members.filter(member => {
    const fullName = `${member.givenName} ${member.surname}`.toLowerCase();
    const email = member.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || email.includes(query);
  });

  const handleMemberToggle = (memberId: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedMemberIds.includes(memberId);
      return {
        ...prev,
        selectedMemberIds: isSelected
          ? prev.selectedMemberIds.filter(id => id !== memberId)
          : [...prev.selectedMemberIds, memberId],
      };
    });
  };

  const handleSelectAll = () => {
    setFormData(prev => {
      const allFilteredIds = filteredMembers.map(m => m.id);
      const isAllFiltered = allFilteredIds.every(id => prev.selectedMemberIds.includes(id));
      
      if (isAllFiltered) {
        return {
          ...prev,
          selectedMemberIds: prev.selectedMemberIds.filter(
            id => !allFilteredIds.includes(id)
          ),
        };
      } else {
        const newIds = new Set(prev.selectedMemberIds);
        allFilteredIds.forEach(id => newIds.add(id));
        return {
          ...prev,
          selectedMemberIds: Array.from(newIds),
        };
      }
    });
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!formData.message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (formData.selectedMemberIds.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    if (!formData.sendImmediately && !formData.scheduledDate) {
      toast.error("Please select a scheduled date");
      return;
    }

    setSending(true);

    try {
      const scheduledDateTime = !formData.sendImmediately 
        ? new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString()
        : null;

      const response = await fetch("/api/admin/messages/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberIds: formData.selectedMemberIds,
          subject: formData.subject,
          message: formData.message,
          sendImmediately: formData.sendImmediately,
          scheduledDateTime: scheduledDateTime,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send email");
      }

      const result = await response.json();
      toast.success(result.message);

      // Reset form
      setFormData({
        selectedMemberIds: [],
        subject: '',
        message: '',
        sendImmediately: true,
        scheduledDate: '',
        scheduledTime: '09:00',
      });
      setShowMemberList(false);
      setSearchQuery('');
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleScheduleToggle = () => {
    setFormData(prev => ({
      ...prev,
      sendImmediately: !prev.sendImmediately,
    }));
  };

  const selectedMembers = members.filter(m => formData.selectedMemberIds.includes(m.id));
  const allFilteredSelected = filteredMembers.length > 0 && 
    filteredMembers.every(m => formData.selectedMemberIds.includes(m.id));

  return (
    <div 
      className="min-h-screen pb-24"
      style={{
        background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
      }}
    >
      {/* Blue Header with Back Button and Logo */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/admin')}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="relative w-16 h-16">
            <Image
              src="/images/MAS LOGO.png"
              alt="Ministry of Altar Servers Logo"
              fill
              sizes="64px"
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* White Content Area */}
      <div 
        className="bg-white min-h-screen px-6 py-6"
        style={{
          borderRadius: '30px 30px 0 0',
          marginTop: '20px'
        }}
      >
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Send Message</h1>
          <p className="text-gray-600 mb-6">Send custom emails to members</p>

          <form onSubmit={handleSendEmail} className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-sm space-y-8">
            {/* Member Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                Select Recipients *
              </label>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMemberList(!showMemberList)}
                  disabled={sending}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left bg-white disabled:bg-gray-100 flex items-center justify-between"
                >
                  <span className={formData.selectedMemberIds.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
                    {formData.selectedMemberIds.length === 0 
                      ? 'Choose members...' 
                      : `${formData.selectedMemberIds.length} member${formData.selectedMemberIds.length !== 1 ? 's' : ''} selected`}
                  </span>
                  <svg 
                    className={`w-5 h-5 transition-transform ${showMemberList ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </button>

                {showMemberList && (
                  <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden flex flex-col">
                    {/* Search Bar */}
                    <div className="sticky top-0 bg-white border-b-2 border-gray-300 p-4">
                      <div className="relative">
                        <svg 
                          className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search by name or email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          disabled={sending}
                          className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Select All Option */}
                    <div className="bg-gray-50 border-b-2 border-gray-300 p-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={handleSelectAll}
                          disabled={sending || filteredMembers.length === 0}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="ml-3 font-semibold text-gray-900">
                          {searchQuery 
                            ? `Select All (${filteredMembers.length})` 
                            : `Select All (${members.length})`}
                        </span>
                      </label>
                    </div>

                    {/* Member List */}
                    <div className="overflow-y-auto flex-1 p-2">
                      {filteredMembers.length > 0 ? (
                        filteredMembers.map(member => (
                          <label 
                            key={member.id}
                            className="flex items-start p-3 hover:bg-gray-50 cursor-pointer rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedMemberIds.includes(member.id)}
                              onChange={() => handleMemberToggle(member.id)}
                              disabled={sending}
                              className="w-4 h-4 mt-1 text-blue-600 rounded"
                            />
                            <div className="ml-3 flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {member.givenName} {member.surname}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {member.email}
                              </p>
                            </div>
                          </label>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-gray-500">
                            {searchQuery ? 'No members found matching your search' : 'No members available'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Members Tags */}
              {formData.selectedMemberIds.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 bg-blue-100 text-blue-900 px-3 py-2 rounded-full text-sm"
                    >
                      <span>{member.givenName} {member.surname.charAt(0)}.</span>
                      <button
                        type="button"
                        onClick={() => handleMemberToggle(member.id)}
                        disabled={sending}
                        className="ml-1 hover:text-blue-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Count Summary */}
              {formData.selectedMemberIds.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    📧 Email will be sent to {formData.selectedMemberIds.length} recipient{formData.selectedMemberIds.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                disabled={sending}
                placeholder="Email subject"
                maxLength={100}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-2">
                {formData.subject.length}/100 characters
              </p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                disabled={sending}
                placeholder="Enter your message here..."
                rows={10}
                maxLength={5000}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                {formData.message.length}/5000 characters
              </p>
            </div>

            {/* Schedule Section */}
            <div className="bg-gray-50 p-4 md:p-6 rounded-lg border-2 border-gray-200">
              <label className="block text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                Send Schedule
              </label>

              <div className="space-y-4">
                {/* Send Now / Schedule Toggle */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="schedule"
                      checked={formData.sendImmediately}
                      onChange={handleScheduleToggle}
                      disabled={sending}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-2 sm:ml-3 text-sm md:text-base text-gray-700 font-medium">Send Immediately</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="schedule"
                      checked={!formData.sendImmediately}
                      onChange={handleScheduleToggle}
                      disabled={sending}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-2 sm:ml-3 text-sm md:text-base text-gray-700 font-medium">Schedule for Later</span>
                  </label>
                </div>

                {/* Date & Time Inputs (only show when scheduled) */}
                {!formData.sendImmediately && (
                  <div className="space-y-3 sm:space-y-4 pt-4 border-t-2 border-gray-300">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Select Date *
                      </label>
                      <input
                        type="date"
                        name="scheduledDate"
                        value={formData.scheduledDate}
                        onChange={handleInputChange}
                        disabled={sending}
                        min={getMinDate()}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Select Time *
                      </label>
                      <input
                        type="time"
                        name="scheduledTime"
                        value={formData.scheduledTime}
                        onChange={handleInputChange}
                        disabled={sending}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                      />
                    </div>

                    {formData.scheduledDate && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs sm:text-sm text-blue-900">
                          ⏰ Email scheduled for: <span className="font-semibold block sm:inline mt-1 sm:mt-0">
                            {new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleString()}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {formData.sendImmediately && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs sm:text-sm text-green-900">
                      ✓ Email will be sent immediately
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            {formData.subject || formData.message ? (
              <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-lg">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                  Preview
                </p>
                <div className="bg-white p-4 rounded border border-gray-300">
                  <p className="text-sm font-bold text-gray-900 mb-2">
                    Subject: {formData.subject || '(no subject)'}
                  </p>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {formData.message || '(empty message)'}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    selectedMemberIds: [],
                    subject: '',
                    message: '',
                    sendImmediately: true,
                    scheduledDate: '',
                    scheduledTime: '09:00',
                  });
                  setShowMemberList(false);
                  setSearchQuery('');
                }}
                disabled={sending}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 font-medium"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={sending || formData.selectedMemberIds.length === 0}
                style={{
                  background: (sending || formData.selectedMemberIds.length === 0) 
                    ? '#d1d5db' 
                    : 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                }}
                className="flex-1 px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-75 font-medium"
              >
                {sending ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {formData.sendImmediately ? 'Sending...' : 'Scheduling...'}
                  </div>
                ) : (
                  formData.sendImmediately 
                    ? `Send to ${formData.selectedMemberIds.length > 0 ? formData.selectedMemberIds.length : ''} Email${formData.selectedMemberIds.length !== 1 ? 's' : ''}`
                    : `Schedule to ${formData.selectedMemberIds.length > 0 ? formData.selectedMemberIds.length : ''} Email${formData.selectedMemberIds.length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div 
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 rounded-[30px] p-4 shadow-2xl z-50"
        style={{
          background: '#000080',
          transform: 'translateX(-50%)'
        }}
      >
        <div className="flex justify-center space-x-8 px-4">
          <button
            onClick={() => router.push('/admin')}
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => router.push('/admin/messages')}
            className="flex flex-col items-center text-white hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs">Messages</span>
          </button>
          <button
            onClick={() => router.push('/admin/birthdays')}
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v0M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs">Birthdays</span>
          </button>
        </div>
      </div>
    </div>
  );
}