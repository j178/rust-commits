import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
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

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;

  return {
    title: "Rust Mainline — A cleaner rust-lang/rust history",
    description: "First-parent commit history for rust-lang/rust, with expandable rollups and noisy inner commits folded away.",
    openGraph: {
      title: "Rust / Mainline",
      description: "A cleaner history of rust-lang/rust.",
      type: "website",
      images: [{ url: imageUrl, width: 1728, height: 900, alt: "Rust Mainline commit history" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Rust / Mainline",
      description: "A cleaner history of rust-lang/rust.",
      images: [imageUrl],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#12110f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
