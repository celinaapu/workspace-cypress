import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    console.log("Debug - Full session:", JSON.stringify(session, null, 2));
    console.log("Debug - Session user:", session?.user);
    console.log("Debug - User ID:", session?.user?.id);
    console.log("Debug - User email:", session?.user?.email);
    
    return NextResponse.json({
      session: session,
      user: session?.user,
      userId: session?.user?.id,
      hasId: !!session?.user?.id,
    });
  } catch (error) {
    console.error("Debug route error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
