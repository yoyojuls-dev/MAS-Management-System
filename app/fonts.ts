// app/fonts.ts - Separate fonts configuration file
export const dynamic = 'force-dynamic';
import { Poppins, Playfair_Display } from "next/font/google";

export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-poppins',
  display: 'swap',
  preload: true,
});

export const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
});