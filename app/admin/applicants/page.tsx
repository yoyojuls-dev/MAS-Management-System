// app/admin/applicants/page.tsx

'use client';

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Application {
  id: string;
  name: string;
  birthday: string;
  address: string;
  parentName: string;
  email: string;
  contactNumber: string;
  facebookName?: string;
  status: string;
  appliedAt: string;
}

type TabType = 'applicants' | 'message';

export default function ApplicantsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('applicants');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<Application | null>(null);
  const [showApplicantDetails, setShowApplicantDetails] = useState(false);
  const [sending, setSending] = useState(false);
  const [showApplicantDropdown, setShowApplicantDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<string[]>([]);
  const [sendImmediately, setSendImmediately] = useState(true);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [messageData, setMessageData] = useState({
    subject: '',
    message: '',
  });

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/applications?status=PENDING');
      
      if (!response.ok) throw new Error("Failed to load applications");
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error("Error loading applications:", error);
      toast.error("Failed to load applications");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Filter applicants based on search query
  const filteredApplicants = applications.filter(app => {
    const fullName = `${app.name}`.toLowerCase();
    const email = app.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleApplicantToggle = (applicantId: string) => {
    setSelectedApplicantIds(prev => {
      const isSelected = prev.includes(applicantId);
      return isSelected
        ? prev.filter(id => id !== applicantId)
        : [...prev, applicantId];
    });
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredApplicants.map(a => a.id);
    const isAllSelected = allFilteredIds.every(id => selectedApplicantIds.includes(id));
    
    if (isAllSelected) {
      setSelectedApplicantIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedApplicantIds(prev => {
        const newIds = new Set(prev);
        allFilteredIds.forEach(id => newIds.add(id));
        return Array.from(newIds);
      });
    }
  };

  const handleApprove = async (application: Application) => {
    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'APPROVED' }),
      });

      if (!response.ok) throw new Error("Failed to approve");

      toast.success(`${application.name} approved successfully!`);
      setShowApplicantDetails(false);
      setSelectedApplicant(null);
      await loadApplications();
    } catch (error) {
      console.error('Error approving:', error);
      toast.error("Failed to approve applicant");
    }
  };

  const handleReject = async (application: Application) => {
    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'REJECTED' }),
      });

      if (!response.ok) throw new Error("Failed to reject");

      toast.success(`${application.name} rejected`);
      setShowApplicantDetails(false);
      setSelectedApplicant(null);
      await loadApplications();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error("Failed to reject applicant");
    }
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedApplicantIds.length === 0) {
      toast.error("Please select at least one applicant");
      return;
    }

    if (!messageData.subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!messageData.message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!sendImmediately) {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (scheduledDateTime <= new Date()) {
        toast.error("Scheduled time must be in the future");
        return;
      }
    }

    setSending(true);

    try {
      const selectedApps = applications.filter(a => selectedApplicantIds.includes(a.id));
      
      if (sendImmediately) {
        // Send immediately
        for (const app of selectedApps) {
          const response = await fetch("/api/admin/messages/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              memberIds: [],
              applicantEmail: app.email,
              applicantName: app.name,
              subject: messageData.subject,
              message: messageData.message,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to send email to ${app.name}`);
          }
        }

        toast.success(`Email sent to ${selectedApps.length} applicant${selectedApps.length !== 1 ? 's' : ''}!`);
      } else {
        // Schedule for later
        for (const app of selectedApps) {
          const response = await fetch("/api/admin/messages/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              memberIds: [],
              applicantEmail: app.email,
              applicantName: app.name,
              subject: messageData.subject,
              message: messageData.message,
              scheduledFor: `${scheduledDate}T${scheduledTime}`,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to schedule email to ${app.name}`);
          }
        }

        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        const formattedDate = scheduledDateTime.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        });
        const formattedTime = scheduledDateTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        toast.success(`Emails scheduled for ${selectedApps.length} applicant${selectedApps.length !== 1 ? 's' : ''} on ${formattedDate} at ${formattedTime}!`);
      }

      setMessageData({ subject: '', message: '' });
      setSelectedApplicantIds([]);
      setSearchQuery('');
      setShowApplicantDropdown(false);
      setSendImmediately(true);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const selectedApplicants = applications.filter(a => selectedApplicantIds.includes(a.id));
  const allFiltered = filteredApplicants.every(a => selectedApplicantIds.includes(a.id)) && filteredApplicants.length > 0;

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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Applicants</h1>
          <p className="text-gray-600 mb-6">Manage applicant information and messaging</p>

          {/* Tab Navigation */}
          <div className="flex items-center space-x-4 mb-6 border-b-2 border-gray-200">
            <button
              onClick={() => {
                setActiveTab('applicants');
                setSelectedApplicant(null);
                setShowApplicantDetails(false);
              }}
              style={{
                borderBottom: activeTab === 'applicants' ? '3px solid #4169E1' : 'none',
                color: activeTab === 'applicants' ? '#4169E1' : '#999'
              }}
              className="px-4 py-3 font-semibold text-sm md:text-base transition-colors pb-3"
            >
              Applicants
            </button>
            <button
              onClick={() => {
                setActiveTab('message');
                setSelectedApplicant(null);
              }}
              style={{
                borderBottom: activeTab === 'message' ? '3px solid #3b82f6' : 'none',
                color: activeTab === 'message' ? '#3b82f6' : '#999'
              }}
              className="px-4 py-3 font-semibold text-sm md:text-base transition-colors pb-3"
            >
              Message Applicants
            </button>
          </div>

          {/* Applicants Tab */}
          {activeTab === 'applicants' && (
            <div>
              {/* Applicants List */}
              <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading applicants...</p>
                  </div>
                ) : applications.length === 0 ? (
                  <div className="p-12 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500 font-medium">No pending applicants</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {applications.map((application) => (
                      <div
                        key={application.id}
                        onClick={() => {
                          setSelectedApplicant(application);
                          setShowApplicantDetails(true);
                        }}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{application.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Age: {calculateAge(application.birthday)} years old
                            </p>
                            <p className="text-sm text-gray-600">
                              Email: {application.email}
                            </p>
                          </div>
                          <div className="ml-4">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                              style={{
                                background: application.status === 'PENDING' ? '#f59e0b' :
                                           application.status === 'APPROVED' ? '#10b981' : '#ef4444'
                              }}
                            >
                              {application.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message Tab */}
          {activeTab === 'message' && (
            <div>
              <form onSubmit={handleSendMessage} className="bg-white rounded-2xl border-2 border-gray-100 p-8 shadow-sm space-y-8">
                {/* Applicant Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                    Select Applicants *
                  </label>
                  
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowApplicantDropdown(!showApplicantDropdown)}
                      disabled={sending}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left bg-white disabled:bg-gray-100 flex items-center justify-between"
                    >
                      <span className={selectedApplicantIds.length === 0 ? 'text-gray-500' : 'text-gray-900'}>
                        {selectedApplicantIds.length === 0 
                          ? 'Choose applicants...' 
                          : `${selectedApplicantIds.length} applicant${selectedApplicantIds.length !== 1 ? 's' : ''} selected`}
                      </span>
                      <svg 
                        className={`w-5 h-5 transition-transform ${showApplicantDropdown ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </button>

                    {showApplicantDropdown && (
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
                              checked={allFiltered}
                              onChange={handleSelectAll}
                              disabled={sending || filteredApplicants.length === 0}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="ml-3 font-semibold text-gray-900">
                              Select All ({filteredApplicants.length})
                            </span>
                          </label>
                        </div>

                        {/* Applicant List */}
                        <div className="overflow-y-auto flex-1 p-2">
                          {filteredApplicants.length > 0 ? (
                            filteredApplicants.map(app => (
                              <label 
                                key={app.id}
                                className="flex items-start p-3 hover:bg-gray-50 cursor-pointer rounded transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedApplicantIds.includes(app.id)}
                                  onChange={() => handleApplicantToggle(app.id)}
                                  disabled={sending}
                                  className="w-4 h-4 mt-1 text-blue-600 rounded"
                                />
                                <div className="ml-3 flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">
                                    {app.name}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate">
                                    {app.email}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Age: {calculateAge(app.birthday)}
                                  </p>
                                </div>
                              </label>
                            ))
                          ) : (
                            <div className="p-8 text-center">
                              <p className="text-gray-500">
                                {searchQuery ? 'No applicants found' : 'No applicants available'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected Applicants Tags */}
                  {selectedApplicants.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedApplicants.map(app => (
                        <div
                          key={app.id}
                          className="flex items-center gap-2 bg-blue-100 text-blue-900 px-3 py-2 rounded-full text-sm"
                        >
                          <span>{app.name}</span>
                          <button
                            type="button"
                            onClick={() => handleApplicantToggle(app.id)}
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
                  {selectedApplicantIds.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">
                        📧 Email will be sent to {selectedApplicantIds.length} applicant{selectedApplicantIds.length !== 1 ? 's' : ''}
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
                    value={messageData.subject}
                    onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
                    disabled={sending}
                    placeholder="Email subject"
                    maxLength={100}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {messageData.subject.length}/100 characters
                  </p>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                    Message *
                  </label>
                  <textarea
                    value={messageData.message}
                    onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                    disabled={sending}
                    placeholder="Enter your message here..."
                    rows={10}
                    maxLength={5000}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {messageData.message.length}/5000 characters
                  </p>
                </div>

                {/* Send Option */}
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Send Option
                  </label>
                  
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{borderColor: sendImmediately ? '#4169E1' : '#d1d5db', backgroundColor: sendImmediately ? '#f0f4ff' : 'white'}}>
                      <input
                        type="radio"
                        checked={sendImmediately}
                        onChange={() => setSendImmediately(true)}
                        disabled={sending}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-3 font-medium text-gray-900">Send Immediately</span>
                    </label>

                    <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{borderColor: !sendImmediately ? '#4169E1' : '#d1d5db', backgroundColor: !sendImmediately ? '#f0f4ff' : 'white'}}>
                      <input
                        type="radio"
                        checked={!sendImmediately}
                        onChange={() => setSendImmediately(false)}
                        disabled={sending}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-3 font-medium text-gray-900">Schedule for Later</span>
                    </label>
                  </div>
                </div>

                {/* Schedule Section */}
                {!sendImmediately && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        disabled={sending}
                        min={getMinDate()}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        disabled={sending}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-sm text-blue-900">
                        📅 Scheduled for: <span className="font-semibold">{new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString('en-US', {month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true})}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Preview */}
                {messageData.subject || messageData.message ? (
                  <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-lg">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                      Preview
                    </p>
                    <div className="bg-white p-4 rounded border border-gray-300">
                      <p className="text-sm font-bold text-gray-900 mb-2">
                        Subject: {messageData.subject || '(no subject)'}
                      </p>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {messageData.message || '(empty message)'}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Submit Button */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMessageData({ subject: '', message: '' });
                      setSelectedApplicantIds([]);
                      setSearchQuery('');
                      setShowApplicantDropdown(false);
                      setSendImmediately(true);
                    }}
                    disabled={sending}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 font-medium"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={sending || selectedApplicantIds.length === 0}
                    style={{
                      background: (sending || selectedApplicantIds.length === 0) ? '#d1d5db' : 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                    }}
                    className="flex-1 px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-75 font-medium"
                  >
                    {sending ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {sendImmediately ? 'Sending...' : 'Scheduling...'}
                      </div>
                    ) : (
                      sendImmediately 
                        ? `Send to ${selectedApplicantIds.length > 0 ? selectedApplicantIds.length : ''} Email${selectedApplicantIds.length !== 1 ? 's' : ''}`
                        : `Schedule ${selectedApplicantIds.length > 0 ? selectedApplicantIds.length : ''} Email${selectedApplicantIds.length !== 1 ? 's' : ''}`
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Applicant Details Modal */}
      {showApplicantDetails && selectedApplicant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div 
              className="p-6 rounded-t-2xl"
              style={{
                background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
              }}
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Application Details</h2>
                <button
                  onClick={() => {
                    setShowApplicantDetails(false);
                    setSelectedApplicant(null);
                  }}
                  className="text-white/80 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Full Name</p>
                <p className="text-gray-900 font-medium">{selectedApplicant.name}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Age</p>
                <p className="text-gray-900">{calculateAge(selectedApplicant.birthday)} years old</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Birthday</p>
                <p className="text-gray-900">{new Date(selectedApplicant.birthday).toLocaleDateString()}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Address</p>
                <p className="text-gray-900 text-sm">{selectedApplicant.address}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Parent/Guardian Name</p>
                <p className="text-gray-900">{selectedApplicant.parentName}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                <p className="text-gray-900">{selectedApplicant.email}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Contact Number</p>
                <p className="text-gray-900">{selectedApplicant.contactNumber}</p>
              </div>

              {selectedApplicant.facebookName && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Facebook Name</p>
                  <p className="text-gray-900">{selectedApplicant.facebookName}</p>
                </div>
              )}

              <div className="pt-4 space-y-3">
                {selectedApplicant.status === 'PENDING' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReject(selectedApplicant)}
                      className="flex-1 px-4 py-3 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(selectedApplicant)}
                      style={{
                        background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                      }}
                      className="flex-1 px-4 py-3 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
            onClick={() => router.push('/admin/applicants')}
            className="flex flex-col items-center text-white hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs">Applicants</span>
          </button>
          <button
            onClick={() => router.push('/admin/messages')}
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs">Messages</span>
          </button>
        </div>
      </div>
    </div>
  );
}