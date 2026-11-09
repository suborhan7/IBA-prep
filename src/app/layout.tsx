import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "IBA Prep — DU IBA MBA admission trainer",
  description: "Adaptive preparation for the University of Dhaka IBA MBA admission test: English, Mathematics, Analytical ability, mocks and a personal tutor.",
  applicationName: "IBA Prep",
  appleWebApp: { capable: true, title: "IBA Prep", statusBarStyle: "default" },
  icons: { icon: [{ url: "/icon-192.png", sizes: "192x192" }], apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#121311" },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-bg text-ink">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
