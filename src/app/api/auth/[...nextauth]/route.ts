import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb/client";
import { User } from "@/lib/mongoose/schema";
import connectDB from "@/lib/mongoose/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({ email: credentials.email });

        if (!user || !user.password) return null;

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordCorrect) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.full_name,
          image: user.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("JWT callback - token:", token);
      console.log("JWT callback - user:", user);
      
      // When the user first signs in, 'user' is available
      if (user) {
        token.id = user.id;
        console.log("JWT callback - set token.id to:", token.id);
      }
      return token;
    },
    async session({ session, token }) {
      console.log("Session callback - token:", token);
      console.log("Session callback - session.user:", session.user);
      
      if (token && session.user) {
        // Use token.id if set, otherwise fallback to token.sub (which contains the user ID)
        const userId = token.id || token.sub;
        console.log("Session callback - userId:", userId);
        
        // Create a new user object to avoid immutability issues
        session.user = {
          ...session.user,
          id: userId as string,
        };
        console.log("Session callback - set session.user.id to:", session.user.id);
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
