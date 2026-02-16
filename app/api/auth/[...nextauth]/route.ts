// import NextAuth from "next-auth";
// import { authOptions } from "@/lib/authConfig";

// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };

// import NextAuth from "next-auth"
// import { authOptions } from "@/lib/authConfig" // or however you've structured it

// const handler = NextAuth(authOptions)
// export { handler as GET, handler as POST }
// export { authOptions }

import NextAuth from "next-auth"
import { authOptions } from "@/lib/authConfig"

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
