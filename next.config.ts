import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF libraries run on the server as plain Node packages.
  serverExternalPackages: ["jspdf", "jspdf-autotable"],
};

export default nextConfig;
