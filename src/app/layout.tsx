import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/context/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { WebSiteJsonLd, OrganizationJsonLd, FaqJsonLd } from "@/components/seo/JsonLdSchemas";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#d97706",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.camelloonline.com"),
  title: {
    default: "CamelloOnline | Bolsa de Empleo Colombia & Trabajo Remoto Verificado",
    template: "%s | CamelloOnline",
  },
  description: "Bolsa de empleo líder en Colombia y trabajo remoto internacional en USD y COP. Miles de vacantes verificadas en Tech, Inteligencia Artificial, Ventas, Marketing y Atención al Cliente. 100% Gratis.",
  keywords: [
    "camello online",
    "camelloonline",
    "trabajo remoto colombia",
    "bolsa de empleo colombia",
    "empleos bogota",
    "empleos medellin",
    "empleos cali",
    "empleos barranquilla",
    "trabajo remoto en dolares",
    "vacantes tech colombia",
    "ofertas de empleo colombia",
    "programador junior colombia",
    "desarrollador react colombia",
    "trabajos en ventas b2b colombia",
    "servicio al cliente remoto colombia",
    "asistente virtual colombia",
    "computrabajo alternativa",
    "elempleo alternativa",
    "trabajo desde casa colombia",
    "empleos bilingues colombia"
  ],
  authors: [{ name: "CamelloOnline Team", url: "https://www.camelloonline.com" }],
  creator: "CamelloOnline",
  publisher: "CamelloOnline",
  applicationName: "CamelloOnline",
  category: "Employment & Careers",
  classification: "Bolsa de Empleo y Trabajo Remoto",
  alternates: {
    canonical: "https://www.camelloonline.com",
    languages: {
      "es-CO": "https://www.camelloonline.com",
      "es": "https://www.camelloonline.com",
    },
  },
  openGraph: {
    title: "CamelloOnline | Bolsa de Empleo Colombia & Trabajo Remoto Verificado",
    description: "Encuentra camello real y verificado en Colombia y el mundo: Tech, Inteligencia Artificial, Ventas y Salarios en USD. Sin intermediarios y 100% gratis.",
    url: "https://www.camelloonline.com",
    siteName: "CamelloOnline",
    locale: "es_CO",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "CamelloOnline - Bolsa de Empleo Colombia y Trabajo Remoto",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CamelloOnline | Bolsa de Empleo Colombia & Trabajo Remoto",
    description: "Vacantes reales y trabajo remoto verificado en Colombia: Tech, Ventas, IA y salarios en USD.",
    images: ["/opengraph-image"],
    creator: "@camelloonline",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  verification: {
    google: "google-site-verification-placeholder",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <WebSiteJsonLd />
        <OrganizationJsonLd />
        <FaqJsonLd />
      </head>
      <body 
        className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-amber-500 selection:text-white"
        suppressHydrationWarning
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <AuthModal />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
