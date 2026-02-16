// app/member/group/page.tsx - Fixed to handle undefined groups array safely
'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] });

interface Group {
  id: string;
  name: string;
  description: string;
  leader: string;
  members: Member[];
  meetingTime?: string;
  location?: string;
}

interface Member {
  id: string;
  name: string;
  role?: string;
}

export default function MemberGroupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Initialize groups as empty array to prevent map error
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const response = await fetch('/api/member/groups');
      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array, fallback to empty array if not
        setGroups(Array.isArray(data) ? data : []);
      } else {
        console.log('API request failed, using sample data');
        // Fallback to sample data
        const sampleGroups: Group[] = [
          {
            id: '1',
            name: 'Altar Servers',
            description: 'Assists during Mass and other liturgical celebrations',
            leader: 'John Doe',
            members: [
              { id: '1', name: 'John Doe', role: 'Head Server' },
              { id: '2', name: 'Jane Smith', role: 'Senior Server' },
              { id: '3', name: 'Mike Johnson', role: 'Junior Server' },
            ],
            meetingTime: 'Saturdays 3:00 PM',
            location: 'Sacristy'
          },
          {
            id: '2',
            name: 'Lectors',
            description: 'Proclaims the Word of God during liturgical services',
            leader: 'Mary Johnson',
            members: [
              { id: '4', name: 'Mary Johnson', role: 'Head Lector' },
              { id: '5', name: 'Robert Brown', role: 'Lector' },
              { id: '6', name: 'Sarah Wilson', role: 'Lector' },
            ],
            meetingTime: 'Sundays after 10 AM Mass',
            location: 'Parish Hall'
          },
          {
            id: '3',
            name: 'Choir',
            description: 'Provides musical accompaniment for liturgical celebrations',
            leader: 'David Garcia',
            members: [
              { id: '7', name: 'David Garcia', role: 'Choir Director' },
              { id: '8', name: 'Lisa Martinez', role: 'Soprano' },
              { id: '9', name: 'Carlos Rodriguez', role: 'Tenor' },
            ],
            meetingTime: 'Thursdays 7:00 PM',
            location: 'Church Choir Loft'
          }
        ];
        setGroups(sampleGroups);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      // Always set to empty array on error to prevent undefined issues
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role === 'ADMIN' || session?.user?.userType === 'ADMIN') {
        router.push('/admin');
        return;
      }
      setIsLoading(false);
    } else if (status === 'unauthenticated') {
      router.push('/member/login');
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleGroupClick = (group: Group) => {
    setSelectedGroup(group);
    setShowGroupModal(true);
  };

  const closeModal = () => {
    setShowGroupModal(false);
    setSelectedGroup(null);
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
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:bg-white/30 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Logo */}
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

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Groups</h1>
          <p className="text-white/80 text-sm">Ministry groups and communities</p>
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
        {/* Groups Grid - Safe array check */}
        {!groups || groups.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Groups Available</h3>
            <p className="text-gray-600">There are currently no groups to display.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Safe mapping - groups is guaranteed to be an array here */}
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => handleGroupClick(group)}
                className="w-full bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{group.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{group.description}</p>
                    <p className="text-blue-600 text-sm font-medium">
                      Led by {group.leader}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                      {group.members?.length || 0} member{(group.members?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                {group.meetingTime && (
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {group.meetingTime}
                  </div>
                )}
                
                {group.location && (
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {group.location}
                  </div>
                )}
              </button>
            ))}
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
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">Schedule</span>
          </Link>
          
          <Link
            href="/member/group"
            className="flex flex-col items-center text-white transition-colors"
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs">Group</span>
          </Link>
        </div>
      </div>

      {/* Group Detail Modal */}
      {showGroupModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div 
              className="p-6 rounded-t-2xl"
              style={{
                background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{selectedGroup.name}</h3>
                <button
                  onClick={closeModal}
                  className="text-white/80 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 p-6">
              <p className="text-gray-600 mb-4">{selectedGroup.description}</p>
              
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Group Leader</h4>
                <p className="text-blue-600">{selectedGroup.leader}</p>
              </div>

              {selectedGroup.meetingTime && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Meeting Time</h4>
                  <p className="text-gray-600">{selectedGroup.meetingTime}</p>
                </div>
              )}

              {selectedGroup.location && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Location</h4>
                  <p className="text-gray-600">{selectedGroup.location}</p>
                </div>
              )}

              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Members ({selectedGroup.members?.length || 0})
                </h4>
                <div className="space-y-2">
                  {selectedGroup.members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">{member.name}</span>
                      {member.role && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {member.role}
                        </span>
                      )}
                    </div>
                  )) || (
                    <p className="text-gray-500 text-sm">No members found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}