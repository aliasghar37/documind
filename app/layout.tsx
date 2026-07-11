import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { TopNavbar } from "@/components/top-navbar";
import { Toaster } from "sonner";
import { ProjectHeaderProvider } from "@/components/project-header-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Documind",
  description: "AI Assistant for general purpose document interaction",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
	<html
	  lang="en"
	  className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
	>
	  <body className="min-h-full flex flex-col">
		<ClerkProvider
		  appearance={{
			options: {
			  unsafe_disableDevelopmentModeWarnings: true,
			},
		  }}
		>
		  <ProjectHeaderProvider>
			<TopNavbar />
			{children}
			<Toaster richColors position="top-right" />
		  </ProjectHeaderProvider>
		</ClerkProvider>
	  </body>
	</html>
  );
}
