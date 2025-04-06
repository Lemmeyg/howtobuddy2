import type { Metadata } from "next";
import { Inter } from "next/font/google";
import '@/styles/globals.css'
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from '@/components/error-boundary'
import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Providers } from './providers'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { MainNav } from '@/components/main-nav'
import { CommandMenu } from '@/components/command-menu'
import { UserNav } from '@/components/user-nav'
import { Footer } from '@/components/footer'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HowToBuddy",
  description: "Your AI-powered document and video assistant",
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
        <Providers>
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <div className="relative min-h-screen">
                <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="container flex h-14 items-center">
                    <MainNav />
                    <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                      <div className="w-full flex-1 md:w-auto md:flex-none">
                        <CommandMenu />
                      </div>
                      <nav className="flex items-center space-x-2">
                        <NotificationCenter />
                        <UserNav />
                      </nav>
                    </div>
                  </div>
                </header>
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </Suspense>
            <Toaster />
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
