import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { PreviewBar } from "@/components/PreviewBar";

export const metadata: Metadata = {
  title: "MandaMix — Web App",
  description: "Learn Mandarin in your own language. HSK 3.0-aligned, for Southeast Asia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@400;600&family=Noto+Serif+SC:wght@500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <I18nProvider>
          <PreviewBar />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
