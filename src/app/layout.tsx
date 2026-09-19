import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/context/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import "./globals.css";

export const metadata: Metadata = {
  title: "CamelloOnline | Bolsa de Empleo Colombia & Trabajo Remoto",
  description: "Encuentra camello real y verificado en Colombia: Tech, IA y trabajo remoto en ventas, marketing y soporte. 100% Gratis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body 
        className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-indigo-500 selection:text-white"
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
      </body>
    </html>
  );
}

