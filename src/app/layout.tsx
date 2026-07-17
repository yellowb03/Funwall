import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Funwall — classroom games made simple",
    template: "%s · Funwall",
  },
  description:
    "Create, save, and play classroom activity templates — wheel, pairs, quiz, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--fw-font-body)] text-[var(--fw-color-ink)]">
        <a href="#main-content" className="fw-skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
