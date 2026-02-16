import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authConfig";
import { prisma } from "@/lib/prisma";

export default async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return null;
    }

    // Check if user is an admin first
    try {
      const adminUser = await prisma.adminUser.findUnique({
        where: {
          email: session.user.email,
        },
        select: {
          id: true,
          adminId: true,
          name: true,
          email: true,
          image: true,
          role: true,
          position: true,
          permissions: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (adminUser) {
        return {
          ...adminUser,
          userType: 'ADMIN' as const,
        };
      }
    } catch (adminError) {
      console.error("Error checking admin user:", adminError);
    }

    // Check if user is a member
    try {
      const member = await prisma.member.findUnique({
        where: {
          email: session.user.email,
        },
        select: {
          id: true,
          surname: true,
          givenName: true,
          email: true,
          image: true,
          role: true,
          memberStatus: true,
          serverLevel: true,
          dateJoined: true,
          birthdate: true,
          contactNumber: true,
          school: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (member) {
        return {
          ...member,
          name: `${member.givenName} ${member.surname}`,
          userType: 'MEMBER' as const,
        };
      }
    } catch (memberError) {
      console.error("Error checking member:", memberError);
    }

    return null;
  } catch (error: any) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}

// Helper function to check if user is admin
export async function isUserAdmin(email: string): Promise<boolean> {
  try {
    const adminUser = await prisma.adminUser.findUnique({
      where: { email },
      select: { id: true, isActive: true },
    });
    return adminUser?.isActive ?? false;
  } catch {
    return false;
  }
}