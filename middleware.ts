export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/health-profile/:path*",
    "/medications/:path*",
    "/appointments/:path*",
    "/labs/:path*",
    "/vitals/:path*",
    "/symptoms/:path*",
    "/vaccinations/:path*",
    "/documents/:path*",
    "/doctors/:path*",
    "/summary/:path*",
    "/exports/:path*",
    "/care-team/:path*",
    "/patient/:path*",
  ],
};