import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { FloatingChatbot } from "@/components/ai/FloatingChatbot";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Expense Tracker",
  description: "Track and manage your expenses with AI insights",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SmartExpense",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased h-full" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full flex bg-slate-50 dark:bg-[#050508] text-slate-900 dark:text-emerald-50 transition-all duration-500`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Sidebar />
          <div className="flex-1 ml-64 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 p-8 grid-bg">
              {children}
            </main>
          </div>
          {/* Global feature 5 AI Chatbot widget */}
          <FloatingChatbot />
        </ThemeProvider>
      </body>
    </html>
  );
}
