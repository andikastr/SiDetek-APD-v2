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
    <html lang="en" suppressHydrationWarning className="light" data-theme="light">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('sidetek-theme') || 'light';
                const root = document.documentElement;
                if (saved === 'dark') {
                  root.classList.remove('light');
                  root.classList.add('dark');
                  root.setAttribute('data-theme', 'dark');
                  root.style.colorScheme = 'dark';
                } else {
                  root.classList.remove('dark');
                  root.classList.add('light');
                  root.setAttribute('data-theme', 'light');
                  root.style.colorScheme = 'light';
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
