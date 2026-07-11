import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist"],
  // productionBrowserSourceMaps: false,
  experimental: {
	//     preloadEntriesOnStart: false,
	//     webpackMemoryOptimizations: true,
	//     serverSourceMaps: false,
	serverActions: {
	  bodySizeLimit: "15mb",
	},
  },
};

export default nextConfig;
