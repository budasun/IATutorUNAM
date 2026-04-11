import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNavBar from "@/components/layout/BottomNavBar";

// 1. VIEWPORT (Solo una vez)
export const viewport: Viewport = {
  themeColor: '#002B5C',
};

// 2. METADATA (Solo una vez y con todo integrado)
export const metadata: Metadata = {
  metadataBase: new URL('https://ia-tutor-unam.vercel.app'),
  title: 'TIAUNAM | Asegura tu lugar en la UNAM',
  description: 'Simulador de examen con IA para las 4 áreas de la UNAM.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'TIAUNAM',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'TIAUNAM | Asegura tu lugar en la UNAM',
    description: 'Entrena con el único simulador guiado por IA que detecta tus debilidades.',
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