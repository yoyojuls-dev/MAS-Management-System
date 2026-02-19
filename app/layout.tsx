// app/layout.tsx
// Ministry of Altar Servers Management System Layout

import "./globals.css";
import type { Metadata } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import { Toaster } from "react-hot-toast";
import getCurrentUser from "@/actions/getCurrentUser";
import SessionProvider from "@/providers/SessionProvider";

// Initialize email cron jobs on server startup
import { initializeEmailCronJobs } from '@/lib/email-cron-jobs';

// This runs once when the server starts
if (typeof window === 'undefined') {
  // Server-side only initialization
  initializeEmailCronJobs();
}

// Define fonts at the module level
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-poppins',
  display: 'swap',
  preload: true,
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "Ministry of Altar Servers Management System",
  description: "Digital management system for altar server ministry activities, attendance tracking, member management, and mass scheduling",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  return (
    <html 
      lang="en" 
      className={`${poppins.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          rel="stylesheet" 
        />
      </head>
      
      <body className={`${poppins.className} text-slate-700`}>
        <SessionProvider>
          <Toaster
            toastOptions={{
              style: {
                background: "rgb(59 130 246)",
                color: "#fff",
              },
            }}
          />
          {/* Initialize cron jobs on client load */}
         
          
          <div className="flex flex-col min-h-screen">            
            <main className="flex-grow">{children}</main>            
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}