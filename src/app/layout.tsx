import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Olym-App",
  description: "Platform Olimpiade Online Daring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${jakarta.className} min-h-screen bg-slate-50 dark:bg-[#05050a] text-slate-900 dark:text-slate-50 selection:bg-indigo-500/30 selection:text-indigo-200 antialiased`}>
        <div className="fixed inset-0 z-[-1] hidden dark:block bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]"></div>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
