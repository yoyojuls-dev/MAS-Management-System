import { AdminUser } from "@prisma/client";

// Safe user type that works with AdminUser
export type SafeAdminUser = (
  Omit<AdminUser, "createdAt" | "updatedAt" | "emailVerified"> & {
    createdAt: string;
    updatedAt: string;
    emailVerified: string | null;
  }
);
