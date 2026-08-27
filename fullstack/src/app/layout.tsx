import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";

export const metadata: Metadata = {
  title: "SiDetek-APD — PPE Safety Compliance Audit System",
  description:
    "Enterprise computer vision system for real-time safety helmet and high-visibility vest compliance monitoring on construction jobsites.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-[#0a1b5c] selection:text-white">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
          <TopHeader />

          <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto">
            {children}
          </main>

          <footer className="no-print border-t border-gray-200 bg-white py-4 px-6 text-xs text-gray-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
              <span>
                SiDetek-APD · AI-Powered Jobsite Safety Vision System (YOLOv11)
              </span>
              <span className="text-gray-400">
                Standards: EN 397 &amp; EN ISO 20471 Class 2
              </span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
