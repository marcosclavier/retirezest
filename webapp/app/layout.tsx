import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Retire Zest - Canadian Retirement Planning Calculator | CPP, OAS, GIS",
  description: "Free Canadian retirement planning tool. Calculate CPP, OAS, and GIS benefits. Project your retirement income with accurate tax calculations. Built for Canadian seniors.",
  keywords: ["retirement planning Canada", "CPP calculator", "OAS calculator", "retirement income", "Canadian seniors", "RRSP calculator", "retirement projection"],
  authors: [{ name: "Retire Zest" }],
  openGraph: {
    title: "Retire Zest - Plan Your Canadian Retirement",
    description: "Calculate your CPP, OAS, and project your retirement income with Canada's easiest retirement planning tool.",
    type: "website",
    locale: "en_CA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
