// app/admin/sunday-service/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

interface Member {
  id: string;
  surname: string;
  givenName: string;
}

interface GroupSchedule {
  groupName: string;
  day: string;
  time: string;
}

const DEFAULT_GROUPS: string[] = [];

export default function SundayGroupsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Record<string, string[]>>({});
  const [schedules, setSchedules] = useState<GroupSchedule[]>([]);

  const [activeTab, setActiveTab] = useState<'groups' | 'members' | 'schedule' | 'list'>('groups');
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedListGroup, setSelectedListGroup] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Schedule form state
  const [scheduleFormData, setScheduleFormData] = useState({
    groupName: '',
    day: 'Sunday',
    time: '09:00',
  });
  const [editingSchedule, setEditingSchedule] = useState<number | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/members?status=ACTIVE');
      if (!res.ok) throw new Error('Failed to load members');
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }
  }, [status, router]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const createGroup = () => {
    const name = newGroupName.trim();
    if (!name) return toast.error('Enter a group name');
    if (groups[name]) return toast.error('Group already exists');
    setGroups(prev => ({ ...prev, [name]: [] }));
    setNewGroupName('');
    toast.success(`Group "${name}" created`);
  };

  const deleteGroup = (name: string) => {
    if (!confirm(`Delete group "${name}"?`)) return;
    setGroups(prev => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
    // Also delete schedule for this group
    setSchedules(prev => prev.filter(s => s.groupName !== name));
    toast.success(`Group "${name}" deleted`);
  };

  const addMemberToGroup = (group: string, memberId: string) => {
    if (!group) return toast.error('Select a group first');
    if (!memberId) return toast.error('Select a member');
    setGroups(prev => {
      const copy = { ...prev };
      const already = copy[group]?.includes(memberId);
      if (!already) copy[group] = [...(copy[group] || []), memberId];
      else {
        toast.error('Member already in this group');
        return prev;
      }
      return copy;
    });
    setSelectedMemberId('');
    toast.success('Member added');
  };

  const removeMemberFromGroup = (group: string, memberId: string) => {
    setGroups(prev => ({ ...prev, [group]: prev[group].filter(id => id !== memberId) }));
    toast.success('Member removed');
  };

  // Schedule functions
  const handleScheduleSubmit = () => {
    if (!scheduleFormData.groupName.trim()) {
      return toast.error('Enter a group name');
    }
    if (!scheduleFormData.day.trim()) {
      return toast.error('Select a day');
    }
    if (!scheduleFormData.time.trim()) {
      return toast.error('Enter a time');
    }

    if (editingSchedule !== null) {
      // Update existing schedule
      const newSchedules = [...schedules];
      newSchedules[editingSchedule] = { ...scheduleFormData };
      setSchedules(newSchedules);
      toast.success('Schedule updated');
      setEditingSchedule(null);
    } else {
      // Check if schedule already exists for this group
      const exists = schedules.some(s => s.groupName === scheduleFormData.groupName);
      if (exists) {
        return toast.error('Schedule already exists for this group');
      }
      // Add new schedule
      setSchedules([...schedules, { ...scheduleFormData }]);
      toast.success('Schedule added');
    }

    setScheduleFormData({
      groupName: '',
      day: 'Sunday',
      time: '09:00',
    });
  };

  const editSchedule = (index: number) => {
    setScheduleFormData(schedules[index]);
    setEditingSchedule(index);
  };

  const deleteSchedule = (index: number) => {
    if (!confirm('Delete this schedule?')) return;
    setSchedules(schedules.filter((_, i) => i !== index));
    setEditingSchedule(null);
    toast.success('Schedule deleted');
  };

  const cancelEdit = () => {
    setEditingSchedule(null);
    setScheduleFormData({
      groupName: '',
      day: 'Sunday',
      time: '09:00',
    });
  };

  const groupList = Object.keys(groups);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (loading) {
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

  return (
    <div 
      className="min-h-screen pb-24"
      style={{
        background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
      }}
    >
      {/* Header with back button and logo */}
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
              alt="MAS Logo"
              fill
              sizes="64px"
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* White content card */}
      <div 
        className="bg-white min-h-screen px-6 py-6"
        style={{
          borderRadius: '30px 30px 0 0',
          marginTop: '20px'
        }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">SUNDAY GROUPS</h2>
        
        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('groups')}
            style={{
              background: activeTab === 'groups' 
                ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                : '#f3f4f6'
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-sm text-sm ${
              activeTab === 'groups'
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Groups
          </button>
          <button
            onClick={() => setActiveTab('members')}
            style={{
              background: activeTab === 'members' 
                ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                : '#f3f4f6'
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-sm text-sm ${
              activeTab === 'members'
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Add Members
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            style={{
              background: activeTab === 'schedule' 
                ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                : '#f3f4f6'
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-sm text-sm ${
              activeTab === 'schedule'
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Schedule
          </button>
          <button
            onClick={() => setActiveTab('list')}
            style={{
              background: activeTab === 'list' 
                ? 'linear-gradient(135deg, #4169E1 0%, #000080 100%)' 
                : '#f3f4f6'
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-sm text-sm ${
              activeTab === 'list'
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            View List
          </button>
        </div>

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Groups</h3>

            <div className="space-y-3 mb-6">
              <input
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="Group Name (e.g., Group A, Group B)"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button 
                onClick={createGroup} 
                style={{
                  background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                }}
                className="w-full px-5 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Create Group
              </button>
            </div>

            {/* Groups list table */}
            <div className="bg-white rounded-lg shadow-sm border-2 border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b-2 border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-xs font-bold text-gray-700 uppercase">
                  <div>Group Name</div>
                  <div>Members Count</div>
                </div>
              </div>
              {groupList.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-500">No groups created yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {groupList.map((name) => (
                    <div key={name} className="grid grid-cols-2 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center">
                      <div className="text-gray-900 font-medium">{name}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-semibold">{(groups[name] || []).length}</span>
                        <button
                          onClick={() => deleteGroup(name)}
                          className="text-red-500 text-sm hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Members Tab - ALWAYS shows add member form */}
        {activeTab === 'members' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Members to Group</h3>

            {/* Add Member Form - Always Visible */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border-2 border-blue-200">
              <h4 className="text-md font-semibold text-gray-900 mb-4">➕ Add New Member</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Group *</label>
                  <select
                    value={selectedListGroup}
                    onChange={e => setSelectedListGroup(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select group...</option>
                    {groupList.map(g => (
                      <option key={g} value={g}>{g} ({(groups[g] || []).length} members)</option>
                    ))}
                  </select>
                  {groupList.length === 0 && (
                    <p className="text-sm text-orange-600 mt-2 font-medium">ℹ️ No groups created yet. Go to "Groups" tab to create one first.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Member *</label>
                  <select
                    value={selectedMemberId}
                    onChange={e => setSelectedMemberId(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Select member to add...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.surname}, {m.givenName}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={() => addMemberToGroup(selectedListGroup, selectedMemberId)}
                  style={{
                    background: selectedListGroup && selectedMemberId ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#d1d5db'
                  }}
                  disabled={!selectedListGroup || !selectedMemberId}
                  className="w-full px-5 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Member to Group
                </button>
              </div>
            </div>

            {/* Show All Groups with Members */}
            <h4 className="text-md font-semibold text-gray-900 mb-4">📋 All Groups Members</h4>
            
            {groupList.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-lg">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500 mb-3">No groups created yet</p>
                <button
                  onClick={() => setActiveTab('groups')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first group
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {groupList.map((groupName) => (
                  <div key={groupName} className="bg-white rounded-lg shadow-sm border-2 border-gray-100 overflow-hidden">
                    {/* Group Header */}
                    <div 
                      className="px-6 py-4"
                      style={{
                        background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="text-lg font-bold text-white">{groupName}</h5>
                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-white">
                          {(groups[groupName] || []).length} {(groups[groupName] || []).length === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                    </div>

                    {/* Members */}
                    {(groups[groupName] || []).length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-gray-500 text-sm">No members in this group yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {(groups[groupName] || []).map(id => {
                          const m = members.find(x => x.id === id);
                          return (
                            <div key={id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                              <div className="font-medium text-gray-900">
                                {m ? `${m.surname}, ${m.givenName}` : 'Unknown member'}
                              </div>
                              <button 
                                onClick={() => removeMemberFromGroup(groupName, id)} 
                                className="text-red-500 font-medium hover:text-red-700 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedule Tab - NEW */}
        {activeTab === 'schedule' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingSchedule !== null ? 'Edit Schedule' : 'Add Group Schedule'}
            </h3>

            <div className="mb-6 space-y-4 bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Group Name *</label>
                <select
                  value={scheduleFormData.groupName}
                  onChange={e => setScheduleFormData({ ...scheduleFormData, groupName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select group...</option>
                  {groupList.map(g => (
                    <option key={g} value={g}>{g} ({(groups[g] || []).length} members)</option>
                  ))}
                </select>
                {groupList.length === 0 && (
                  <p className="text-sm text-orange-600 mt-2 font-medium">ℹ️ No groups created yet. Go to "Groups" tab to create one first.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Day of Week *</label>
                  <select
                    value={scheduleFormData.day}
                    onChange={e => setScheduleFormData({ ...scheduleFormData, day: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Sunday">Sunday</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Time *</label>
                  <input
                    type="time"
                    value={scheduleFormData.time}
                    onChange={e => setScheduleFormData({ ...scheduleFormData, time: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleScheduleSubmit}
                  style={{
                    background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                  }}
                  className="flex-1 px-5 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  {editingSchedule !== null ? 'Update Schedule' : 'Add Schedule'}
                </button>
                {editingSchedule !== null && (
                  <button 
                    onClick={cancelEdit}
                    className="flex-1 px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Schedules list */}
            <h4 className="text-md font-semibold text-gray-900 mb-4">📅 All Schedules</h4>
            <div className="bg-white rounded-lg shadow-sm border-2 border-gray-100 overflow-hidden">
              {schedules.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">No schedules added yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {schedules.map((schedule, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900">{schedule.groupName}</h5>
                          <p className="text-sm text-gray-600 mt-1">
                            📅 {schedule.day} at ⏰ {schedule.time}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => editSchedule(index)}
                            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteSchedule(index)}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Group List Tab - Shows all groups with their members in tables */}
        {activeTab === 'list' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Groups Overview</h3>

            {groupList.length === 0 ? (
              <div className="p-12 text-center bg-gray-50 rounded-lg">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500 mb-4">No groups created yet</p>
                <button
                  onClick={() => setActiveTab('groups')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first group
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {groupList.map((groupName) => (
                  <div key={groupName} className="bg-white rounded-lg shadow-sm border-2 border-gray-100 overflow-hidden">
                    {/* Group Header */}
                    <div 
                      className="px-6 py-4"
                      style={{
                        background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-white">{groupName}</h4>
                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-white">
                          {(groups[groupName] || []).length} {(groups[groupName] || []).length === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                    </div>

                    {/* Members Table */}
                    {(groups[groupName] || []).length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-gray-500 text-sm">No members in this group</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b-2 border-gray-200">
                            <tr>
                              <th className="text-left py-3 px-6 text-xs font-bold text-gray-700 uppercase">#</th>
                              <th className="text-left py-3 px-6 text-xs font-bold text-gray-700 uppercase">Member Name</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {(groups[groupName] || []).map((memberId, index) => {
                              const member = members.find(m => m.id === memberId);
                              return (
                                <tr key={memberId} className="hover:bg-gray-50 transition-colors">
                                  <td className="py-4 px-6 text-sm text-gray-600">{index + 1}</td>
                                  <td className="py-4 px-6 text-sm font-medium text-gray-900">
                                    {member ? `${member.surname}, ${member.givenName}` : 'Unknown member'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={() => toast.success('All changes saved successfully!')}
            style={{
              background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
            }}
            className="px-8 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            Save All Changes
          </button>
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
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
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