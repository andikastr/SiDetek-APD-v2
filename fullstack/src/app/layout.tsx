import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "SiDetek-APD — Enterprise PPE Safety Compliance Vision System",
  description:
    "High-Performance Pure ONNX computer vision system for real-time safety helmet and reflective jacket compliance surveillance on industrial jobsites.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
