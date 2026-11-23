import { NextResponse, type NextRequest } from "next/server";
import { readToken, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const session = await readToken(req.cookies.get(SESSION_COOKIE)?.value);
  const needed = req.nextUrl.pathname.startsWith("/admin") ? "ADMIN" : "VENDOR";
  if (!session || session.role !== needed) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/vendor/:path*"] };
