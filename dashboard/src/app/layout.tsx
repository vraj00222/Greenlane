import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DashboardLayout } from "@/components/dashboard-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GreenLane Dashboard | Shop Sustainably",
  description: "Track your sustainable shopping journey with GreenLane. View eco-scores, achievements, and your environmental impact.",
  keywords: ["sustainability", "eco-friendly", "shopping", "carbon footprint", "green shopping"],
  authors: [{ name: "GreenLane Team" }],
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={0}>
            <DashboardLayout>{children}</DashboardLayout>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
