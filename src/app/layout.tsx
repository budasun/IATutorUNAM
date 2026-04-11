import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNavBar from "@/components/layout/BottomNavBar";

export const metadata: Metadata = {
  metadataBase: new URL('https://ia-tutor-unam.vercel.app'),
  title: 'TIAUNAM | Asegura tu lugar en la UNAM',
  description: 'Entrena con el único simulador guiado por IA que detecta tus debilidades y te ayuda a dominarlas.',
  openGraph: {
    title: 'TIAUNAM | Asegura tu lugar en la UNAM',
    description: 'Entrena con el único simulador guiado por IA.',
    url: 'https://ia-tutor-unam.vercel.app',
    siteName: 'Tutor IA UNAM',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TIAUNAM - Simulador de Examen UNAM',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TIAUNAM | Asegura tu lugar en la UNAM',
    description: 'Entrena con el único simulador guiado por IA.',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
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