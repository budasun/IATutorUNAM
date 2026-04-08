import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNavBar from "@/components/layout/BottomNavBar";

export const metadata: Metadata = {
  title: "IA Tutor UNAM",
  description: "Plataforma mobile-first para ayudar a aspirantes a pasar el examen de la UNAM",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#002B5C',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-gray-50 min-h-screen pb-16 md:pb-0">
        <main className="min-h-screen max-w-md mx-auto md:max-w-none">
          {children}
        </main>
        <BottomNavBar />
      </body>
    </html>
  );
}