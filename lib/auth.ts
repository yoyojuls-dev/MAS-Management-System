import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import prisma from "@/lib/prismadb";

// Define the user types
type UserType = "ADMIN" | "MEMBER";
type UserRole = "ADMIN" | "MEMBER";

interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  role: UserRole;
}

async function authorize(credentials: any): Promise<ExtendedUser | null> {
  if (!credentials?.email || !credentials?.password) {
    throw new Error("Email and password are required");
  }

  try {
    // Find user by email in adminUser table first
    const adminUser = await prisma.adminUser.findUnique({
      where: {
        email: credentials.email.toLowerCase().trim(),
      },
    });

    if (adminUser && adminUser.email) {
      // Check if adminUser has hashedPassword field (changed from password to hashedPassword)
      if (adminUser.hashedPassword && await compare(credentials.password, adminUser.hashedPassword)) {
        return {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email, // adminUser.email is string | null, but we check it's not null above
          userType: "ADMIN",
          role: "ADMIN",
        };
      } else if (!adminUser.hashedPassword) {
        // If no hashedPassword field exists, handle appropriately
        throw new Error("Password authentication not configured for this admin user");
      }
    }

    // If not found in adminUser, try member table
    const member = await prisma.member.findUnique({
      where: {
        email: credentials.email.toLowerCase().trim(),
      },
    });

    if (member && member.email) {
      // Check if member has hashedPassword field (changed from password to hashedPassword)
      if (member.hashedPassword && await compare(credentials.password, member.hashedPassword)) {
        return {
          id: member.id,
          name: `${member.givenName} ${member.surname}`,
          email: member.email, // member.email is string | null, but we check it's not null above
          userType: "MEMBER",
          role: "MEMBER",
        };
      } else if (!member.hashedPassword) {
        // If no hashedPassword field exists for members
        throw new Error("Password authentication not configured for this member");
      }
    }

    // No user found or password doesn't match
    throw new Error("Invalid email or password");
  } catch (error) {
    console.error("Auth error:", error);
    throw new Error("Authentication failed");
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        return authorize(credentials);
      },
    }),
    // Optional Google provider
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const extendedUser = user as ExtendedUser;
        token.id = extendedUser.id;
        token.userType = extendedUser.userType;
        token.role = extendedUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.userType = token.userType as UserType;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Handle Google sign-in if needed
      if (account?.provider === "google" && user.email) {
        try {
          // Check if user exists in adminUser table
          const existingAdmin = await prisma.adminUser.findUnique({
            where: { email: user.email },
          });

          if (existingAdmin && existingAdmin.email) {
            // Update user info if needed
            Object.assign(user, {
              id: existingAdmin.id,
              userType: "ADMIN",
              role: "ADMIN",
            });
            return true;
          }

          // Check if user exists in member table
          const existingMember = await prisma.member.findUnique({
            where: { email: user.email },
          });

          if (existingMember && existingMember.email) {
            Object.assign(user, {
              id: existingMember.id,
              userType: "MEMBER",
              role: "MEMBER",
            });
            return true;
          }

          // If user doesn't exist, deny sign-in
          return false;
        } catch (error) {
          console.error("Google sign-in error:", error);
          return false;
        }
      }

      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};