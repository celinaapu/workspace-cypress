import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname, searchParams } = req.nextUrl;
    const token = req.nextauth.token;

    const emailLinkError = "Email link is invalid or has expired";
    if (
      searchParams.get("error_description") === emailLinkError &&
      pathname !== "/signup"
    ) {
      return NextResponse.redirect(
        new URL(
          `/signup?error_description=${searchParams.get("error_description")}`,
          req.url,
        ),
      );
    }

    if (["/login", "/signup"].includes(pathname)) {
      if (token) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith("/dashboard")) {
          return !!token;
        }
        return true;
      },
    },
  },
);

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};
