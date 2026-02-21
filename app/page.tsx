// app/page.tsx
'use client';

export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

// Define the user type based on your existing auth system
interface User {
  id: string;
  name?: string;
  email?: string;
  role: "ADMIN" | "USER" | "STUDENT";
  // Add other user properties as needed
}

// Simple Container component inline
const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-[2520px] mx-auto xl:px-20 md:px-10 sm:px-2 px-4">
    {children}
  </div>
);

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const [applicationData, setApplicationData] = useState({
    name: "",
    birthday: "",
    address: "",
    parentName: "",
    email: "",
    contactNumber: "",
    facebookName: "",
  });

  // Add ministryStats state for database connection
  const [ministryStats, setMinistryStats] = useState({
    totalMembers: 24,
    activeMembers: 24,      // Will connect to database: active members count
    seniorServers: 8,       // Will connect to database: senior servers count  
    attendanceRate: 3,      // Will connect to database: total groups count
    upcomingEvents: 12      // Will connect to database: total events count
  });

  // Fetch real ministry stats from database
  useEffect(() => {
    const fetchMinistryStats = async () => {
      try {
        const response = await fetch('/api/ministry/stats');
        if (response.ok) {
          const stats = await response.json();
          setMinistryStats(stats);
        }
      } catch (error) {
        console.log('Using default ministry stats');
      }
    };

    fetchMinistryStats();
  }, []);

  useEffect(() => {
    // Check if user is logged in (you'll need to implement this based on your auth system)
    const checkUser = async () => {
      try {
        // Replace this with your actual getCurrentUser logic
        // const user = await getCurrentUser();
        // setCurrentUser(user);
        
        // For now, we'll assume no user is logged in
        setCurrentUser(null);
      } catch (error) {
        console.error("Error checking user:", error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  useEffect(() => {
    // If user is logged in, redirect to their respective dashboard
    if (currentUser !== null && !loading) {
      // Type assertion to help TypeScript understand the type
      const user = currentUser as User;
      if (user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/member/dashboard");
      }
    }
  }, [currentUser, loading, router]);

  const hideSplash = () => {
    const splash = document.getElementById('splashScreen');
    const main = document.getElementById('mainContent');
    
    if (splash && main) {
      splash.style.opacity = '0';
      setTimeout(() => {
        splash.style.display = 'none';
        main.style.opacity = '1';
      }, 1000);
    }
  };

  const scrollToLogin = () => {
    const loginSection = document.getElementById('loginSection');
    if (loginSection) {
      loginSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  const goToGuestHome = () => {
    // Navigate to guest home section (you'll provide content later)
    const homeSection = document.getElementById('homeSection');
    if (homeSection) {
      homeSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      // For now, scroll to top until you provide the home section content
      window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
      });
    }
  };

  const handleApplicationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!applicationData.name || !applicationData.birthday || !applicationData.address || 
        !applicationData.parentName || !applicationData.email || !applicationData.contactNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit application");
      }

      toast.success("Application submitted successfully! We will review it soon.");
      
      // Reset form
      setApplicationData({
        name: "",
        birthday: "",
        address: "",
        parentName: "",
        email: "",
        contactNumber: "",
        facebookName: "",
      });
      
      setShowApplicationForm(false);
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    // Auto-hide splash after 5 seconds
    const timer = setTimeout(hideSplash, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>;
  }

  // If user is NOT logged in, show splash screen and landing page
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap');
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes glow {
          0% { box-shadow: 0 0 5px #FFD700; }
          100% { box-shadow: 0 0 20px #FFD700; }
        }

        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes blink {
          0%, 50% { opacity: 0.8; }
          51%, 100% { opacity: 0.4; }
        }

        @keyframes cloudFloat {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(10px) translateY(-5px); }
          50% { transform: translateX(5px) translateY(-10px); }
          75% { transform: translateX(-5px) translateY(-5px); }
        }

        .animate-fade-in-up {
          animation: fade-in-up 1.2s ease-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite alternate;
        }

        .animate-pulse-scale {
          animation: pulse-scale 2s ease-in-out infinite;
        }

        .animate-blink {
          animation: blink 2s ease-in-out infinite;
        }

        .animate-cloud-float {
          animation: cloudFloat 6s ease-in-out infinite;
        }

        .font-serif {
          font-family: 'Playfair Display', serif;
        }

        .cloud-1 {
          animation-delay: 0s;
        }

        .cloud-2 {
          animation-delay: 2s;
        }

        .cloud-3 {
          animation-delay: 4s;
        }
      `}</style>

      {/* Splash Screen */}
      <div 
        id="splashScreen" 
        className="fixed inset-0 flex flex-col items-center justify-center z-50 transition-opacity duration-1000 cursor-pointer"
        style={{
          background: 'linear-gradient(180deg, #4169E1 0%, #1E3A8A 100%)',
        }}
        onClick={hideSplash}
      >
        {/* Background clouds */}
        <div className="absolute top-20 left-16 text-7xl text-white opacity-90 animate-cloud-float cloud-1">☁️</div>
        <div className="absolute top-32 right-20 text-6xl text-white opacity-80 animate-cloud-float cloud-2">☁️</div>
        <div className="absolute bottom-40 left-12 text-5xl text-white opacity-70 animate-cloud-float cloud-3">☁️</div>

        {/* Main content container */}
        <div className="flex flex-col items-center justify-center h-full animate-fade-in-up">
          
          {/* Central image container - YOUR MINISTRY IMAGE */}
          <div className="relative mb-8">
              <Image 
                src="/images/MAS LOGO.png" 
                alt="Ministry of Altar Servers"
                width={500}
                height={300}
                priority
              />
          </div>

          {/* Title section */}
          <div className="text-center text-white">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 drop-shadow-lg font-serif">
              MINISTRY OF ALTAR SERVERS
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl opacity-90 tracking-wider">
              Management System
            </p>
          </div>
        </div>

        {/* Continue text */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-white text-lg opacity-80 animate-blink cursor-pointer flex items-center gap-2">
          <i className="fas fa-hand-pointer"></i>
          <span>Click anywhere to continue</span>
        </div>
      </div>

      {/* Main content */}
      <div id="mainContent" className="opacity-0 transition-opacity duration-1000">
        {/* Hero Section */}
        <section className="relative text-white min-h-screen flex items-center overflow-hidden">

          {/* Background with ministry theme */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(135deg, #4169E1 0%, #1E3A8A 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              zIndex: 0,
            }}
          />
          
          {/* Overlay pattern */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 25% 25%, rgba(255, 215, 0, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)",
              zIndex: 1,
            }}
          />

          {/* Content */}
          <Container>
            <div className="relative w-full h-full min-h-screen flex flex-col items-center justify-center" style={{ zIndex: 2 }}>
              {/* Logo */}
              <div className="flex justify-center mb-6 md:mb-8">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl">
                  <svg className="w-12 h-12 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 md:mb-4 drop-shadow-lg font-serif text-center">
                ALTAR SERVERS
              </h1>
              <h2 className="text-2xl md:text-4xl font-bold text-yellow-400 mb-6 md:mb-8 drop-shadow-lg text-center">
                MINISTRY MANAGEMENT
              </h2>
              
              {/* Subtitle */}
              <p className="text-base md:text-lg lg:text-xl text-blue-100 mb-6 md:mb-8 max-w-2xl mx-auto drop-shadow-md text-center px-4">
                &quot;I have come not to be served, but to serve.&quot; <i>-Matthew 20:28</i>
              </p>
              
              {/* Description */}
              <p className="text-sm md:text-base lg:text-lg text-blue-200 mb-10 md:mb-14 max-w-3xl mx-auto leading-relaxed drop-shadow-md text-center px-4">
                Comprehensive management system for altar server ministry activities including attendance tracking, 
                member management, financial records, and scheduling for masses and special events.
              </p>

              {/* Login and Apply Buttons - CENTERED IN MIDDLE */}
              <div className="flex flex-row gap-4 items-center justify-center mb-8 md:mb-12">
                <button
                  onClick={scrollToLogin}
                  className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold text-sm md:text-base hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowApplicationForm(true)}
                  className="bg-yellow-400 text-blue-600 px-8 py-3 rounded-full font-semibold text-sm md:text-base hover:bg-yellow-300 transition-colors shadow-lg hover:shadow-xl"
                >
                  Apply
                </button>
              </div>
            </div>
          </Container>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <Container>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ministry Management Features
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Everything you need to manage your altar server ministry effectively and efficiently
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 - Attendance */}
              <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Attendance Tracking</h3>
                <p className="text-gray-600">
                  Track attendance for masses, training sessions, and special events. Monitor participation rates and member engagement.
                </p>
              </div>

              {/* Feature 2 - Member Management */}
              <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v0M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Member Management</h3>
                <p className="text-gray-600">
                  Maintain detailed member profiles, track birthdays, contact information, and manage roles from junior to senior servers.
                </p>
              </div>

              {/* Feature 3 - Scheduling */}
              <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Mass Scheduling</h3>
                <p className="text-gray-600">
                  Schedule servers for regular masses, special celebrations, and events. Avoid conflicts and ensure proper coverage.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* Statistics Section - Ministry Stats */}
        <section className="py-16 bg-white">
          <Container>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ministry Overview
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Current statistics and information about our altar server ministry
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Active Members - Connected to Database */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4 mx-auto">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v0M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{ministryStats.activeMembers}</div>
                  <div className="text-gray-900 font-semibold">Active Members</div>
                  <div className="text-sm text-gray-600 mt-1">Altar Servers</div>
                </div>
              </div>
              
              {/* Senior Servers - Connected to Database */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border-2 border-green-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-green-600 rounded-lg mb-4 mx-auto">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">{ministryStats.seniorServers}</div>
                  <div className="text-gray-900 font-semibold">Senior Servers</div>
                  <div className="text-sm text-gray-600 mt-1">Experienced Members</div>
                </div>
              </div>
              
              {/* Total Groups - Connected to Database */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg border-2 border-yellow-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-600 rounded-lg mb-4 mx-auto">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-600 mb-2">{ministryStats.attendanceRate}</div>
                  <div className="text-gray-900 font-semibold">Total Groups</div>
                  <div className="text-sm text-gray-600 mt-1">Server Levels</div>
                </div>
              </div>
              
              {/* Total Events - Connected to Database */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border-2 border-purple-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-600 rounded-lg mb-4 mx-auto">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">{ministryStats.upcomingEvents}</div>
                  <div className="text-gray-900 font-semibold">Total Events</div>
                  <div className="text-sm text-gray-600 mt-1">All Events</div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Activities Preview */}
        <section className="py-16 bg-gray-50">
          <Container>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ministry Activities
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Explore the different aspects of altar server ministry management
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Activity Cards */}
              <Link href="/attendance" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Attendance</h3>
                <p className="text-sm text-gray-600">Track member participation</p>
              </Link>

              <Link href="/members" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Members</h3>
                <p className="text-sm text-gray-600">Manage member profiles</p>
              </Link>

              <Link href="/dues" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Dues &amp; Finances</h3>
                <p className="text-sm text-gray-600">Track contributions</p>
              </Link>

              <Link href="/birthdays" className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Birthdays</h3>
                <p className="text-sm text-gray-600">Celebrate members</p>
              </Link>
            </div>
          </Container>
        </section>
            
        {/* Login Selection Section */}
        <section id="loginSection" className="py-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
          <Container>
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Access It?
              </h2>
              <p className="text-xl text-blue-100 mb-12">
                Choose your login type to access the Altar Server Ministry Management System.
              </p>
              
              {/* Login Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {/* Member Login */}
                <Link
                  href="/member/login"
                  className="group bg-white text-blue-600 rounded-xl p-8 font-semibold text-lg hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-2"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Member Login</h3>
                    <p className="text-sm text-blue-500">Access Altar Server Account</p>
                  </div>
                </Link>

                {/* Admin Login */}
                <Link
                  href="/admin/login"
                  className="group bg-transparent border-2 border-white text-white rounded-xl p-8 font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-2"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Administrator</h3>
                    <p className="text-sm group-hover:text-blue-500 transition-colors">Ministry Management Access</p>
                  </div>
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div 
              className="p-6 rounded-t-2xl"
              style={{
                background: 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
              }}
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Apply for Ministry</h2>
                <button
                  onClick={() => setShowApplicationForm(false)}
                  className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30"
                  disabled={submitting}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleApplicationSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={applicationData.name}
                  onChange={handleApplicationChange}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birthday *
                </label>
                <input
                  type="date"
                  name="birthday"
                  value={applicationData.birthday}
                  onChange={handleApplicationChange}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  name="address"
                  value={applicationData.address}
                  onChange={handleApplicationChange}
                  required
                  disabled={submitting}
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Enter complete address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent/Guardian Name *
                </label>
                <input
                  type="text"
                  name="parentName"
                  value={applicationData.parentName}
                  onChange={handleApplicationChange}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Parent or guardian name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email/Parent Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={applicationData.email}
                  onChange={handleApplicationChange}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={applicationData.contactNumber}
                  onChange={handleApplicationChange}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="+63 9XX XXX XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook Name (Optional)
                </label>
                <input
                  type="text"
                  name="facebookName"
                  value={applicationData.facebookName}
                  onChange={handleApplicationChange}
                  disabled={submitting}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Facebook profile name"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowApplicationForm(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: submitting ? '#93c5fd' : 'linear-gradient(135deg, #4169E1 0%, #000080 100%)'
                  }}
                  className="flex-1 px-4 py-2 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    "Submit Application"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}