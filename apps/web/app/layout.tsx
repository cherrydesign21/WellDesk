import type { Metadata, Viewport } from "next";
import { Jost, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.welldesk.app"),
  title: {
    default: "WellDesk — Practice Management Software for Dietitians",
    template: "%s | WellDesk",
  },
  description:
    "WellDesk brings client tracking, diet plans, payments, appointments, and a branded client portal into one place built specifically for dietitians.",
  openGraph: {
    type: "website",
    siteName: "WellDesk",
    url: "https://www.welldesk.app",
    title: "WellDesk — Practice Management Software for Dietitians",
    description:
      "Client tracking, diet plans, payments, appointments, and a branded client portal — one system built for how dietitians actually work.",
  },
  twitter: {
    card: "summary_large_image",
    title: "WellDesk — Practice Management Software for Dietitians",
    description:
      "Client tracking, diet plans, payments, appointments, and a branded client portal — one system built for how dietitians actually work.",
  },
};

export const viewport: Viewport = {
  themeColor: "#454e17",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jost.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
