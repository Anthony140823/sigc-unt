// src/app/layout.tsx
// Layout raíz de Next.js 14 con providers globales
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: { default: 'SIGC-UNT', template: '%s | SIGC-UNT' },
  description: 'Sistema Integrado de Gestión de la Calidad — Universidad Nacional de Trujillo',
  robots: { index: false, follow: false }, // No indexar (sistema interno)
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider><Providers>{children}</Providers></ThemeProvider>
      </body>
    </html>
  );
}
