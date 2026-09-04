import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	serverExternalPackages: ["better-sqlite3"],
	allowedDevOrigins: ["10.251.233.65"],
};

export default nextConfig;
