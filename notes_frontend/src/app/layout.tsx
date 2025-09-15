import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ocean Notes",
  description: "Bold, high-contrast notes organizer with folders and a fast editor.",
  applicationName: "Ocean Notes",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="app-shell scroll-slim" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
