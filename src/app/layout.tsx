import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNavBar from "@/components/layout/BottomNavBar";

export const metadata: Metadata = {
  metadataBase: new URL('https://ia-tutor-unam.vercel.app'),
  title: 'TIAUNAM | Tutor IA para tu Examen de Admisión',
  description: 'El simulador más avanzado con Inteligencia Artificial para el examen de ingreso a la UNAM. Entrena con simulacros exactos, guías dinámicas y un banco de errores inteligente para las 4 áreas.',
  keywords: [
    'UNAM', 'examen de admisión', 'simulador UNAM', 'guía UNAM 2026', 
    'TIAUNAM', 'ingreso a la universidad', 'inteligencia artificial educativa'
  ],
  authors: [{ name: 'TIAUNAM' }],
  openGraph: {
    title: 'TIAUNAM | Asegura tu lugar en la UNAM',
    description: 'Entrena con el único simulador guiado por IA que detecta tus debilidades y te ayuda a dominarlas.',
    url: '/',
    siteName: 'Tutor IA UNAM',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'TIAUNAM - Interfaz del Simulador',
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
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
  },
  appleWebApp: {
    capable: true,
    title: 'TIAUNAM',
    statusBarStyle: 'black-translucent',
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