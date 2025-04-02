import type { Metadata } from "next";
import { Inter } from "next/font/google";
import '@/styles/globals.css'
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HowToBuddy",
  description: "Your AI-powered video learning assistant",
  icons: {
    icon: "/next.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <main className="min-h-screen bg-background">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
