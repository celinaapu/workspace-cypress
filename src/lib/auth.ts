import { NextAuthOptions } from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./mongodb";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { User } from "./mongoose/schema";
import connectDB from "./mongoose/db"; // ensure mongoose connection

// Debug database connection
clientPromise.then(client => {
  console.log("MongoDB client connected in auth:", client.db().databaseName);
}).catch(err => {
  console.error("MongoDB connection error in auth:", err);
});

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),

  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error("Missing email or password");
          }

          // Ensure mongoose is connected
          await connectDB();

          const user = await User.findOne({
            email: credentials.email,
          }).select("+password"); // important if password is select: false

          if (!user) {
            throw new Error("User not found");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password,
          );

          if (!isPasswordValid) {
            throw new Error("Invalid credentials");
          }

          const returnedUser = {
            id: user._id.toString(),
            email: user.email,
            name: user.full_name,
            image: user.avatar_url,
            role: user.role || "user", // optional role support
          };
          
          console.log("Authorize - returning user:", returnedUser);
          return returnedUser;
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      console.log("JWT callback - token:", token);
      console.log("JWT callback - user:", user);
      
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        console.log("JWT callback - set token.id to:", token.id);
      }
      return token;
    },

    async session({ session, token }) {
      console.log("Session callback - session:", session);
      console.log("Session callback - token:", token);
      
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        console.log("Session callback - set session.user.id to:", session.user.id);
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    // ⚠️ NextAuth does NOT officially support custom signUp page here
    error: "/auth/signin",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
