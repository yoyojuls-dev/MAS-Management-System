import bcrypt from "bcryptjs";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prismadb";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      async profile(profile) {
        const existingAdmin = await prisma.adminUser.findUnique({
          where: { email: profile.email }
        });

        if (existingAdmin) {
          return {
            id: existingAdmin.id,
            email: existingAdmin.email,
            name: existingAdmin.name,
            image: profile.picture,
            userType: 'ADMIN',
            role: 'ADMIN',
          };
        }

        const existingMember = await prisma.member.findUnique({
          where: { email: profile.email }
        });

        if (existingMember) {
          return {
            id: existingMember.id,
            email: existingMember.email,
            surname: existingMember.surname,
            givenName: existingMember.givenName,
            image: profile.picture,
            userType: 'MEMBER',
            role: 'USER',
          };
        }

        throw new Error('Access denied. Contact administrator to add your email to the system.');
      }
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userType: { label: "User Type", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        if (credentials.userType === 'ADMIN') {
          const adminUser = await prisma.adminUser.findUnique({
            where: { email: credentials.email }
          });

          if (!adminUser || !adminUser?.hashedPassword) {
            throw new Error('Invalid admin credentials');
          }

          if (!adminUser.isActive) {
            throw new Error('Admin account is deactivated');
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            adminUser.hashedPassword
          );

          if (!isCorrectPassword) {
            throw new Error('Invalid admin credentials');
          }

          return {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            image: adminUser.image,
            userType: 'ADMIN',
            role: 'ADMIN',
          };
        }

        if (credentials.userType === 'MEMBER') {
          const member = await prisma.member.findUnique({
            where: { email: credentials.email }
          });

          if (!member || !member?.hashedPassword) {
            throw new Error('Invalid member credentials');
          }

          if (member.memberStatus !== 'ACTIVE') {
            throw new Error('Member account is not active');
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            member.hashedPassword
          );

          if (!isCorrectPassword) {
            throw new Error('Invalid member credentials');
          }

          return {
            id: member.id,
            email: member.email,
            surname: member.surname,
            givenName: member.givenName,
            image: member.image,
            userType: 'MEMBER',
            role: 'USER',
          };
        }

        throw new Error('Please select a valid user type');
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const existingAdmin = await prisma.adminUser.findUnique({
            where: { email: user.email! }
          });

          const existingMember = await prisma.member.findUnique({
            where: { email: user.email! }
          });

          return !!(existingAdmin || existingMember);
        } catch (error) {
          console.error("Sign in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.userType = user.userType;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.userType = token.userType as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.includes('/admin')) return `${baseUrl}/admin`;
      if (url.includes('/member')) return `${baseUrl}/member/dashboard`;
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
