import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import SessionProvider from "@/components/providers/SessionProvider";
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "RDBS - Database Management System",
  description: "RukaPay Database Management System - Secure financial data management platform",
  keywords: ["RukaPay", "RDBS", "Database", "Management", "Financial", "Fintech", "Uganda"],
  authors: [{ name: "RukaPay Limited" }],
  creator: "RukaPay Limited",
  publisher: "RukaPay Limited",
  robots: "index, follow",
  openGraph: {
    title: "RDBS - Database Management System",
    description: "RukaPay Database Management System - Secure financial data management platform",
    type: "website",
    locale: "en_US",
    siteName: "RDBS",
  },
  twitter: {
    card: "summary_large_image",
    title: "RDBS - Database Management System",
    description: "RukaPay Database Management System - Secure financial data management platform",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased font-outfit"
      >
        <SessionProvider>
          <QueryProvider>
            {children}
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#08163d',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
