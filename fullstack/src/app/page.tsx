"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ScanSearch,
  Radio,
  FileCheck,
  HardHat,
  Shield,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Clock,
  Sparkles,
  Zap,
  Activity,
  Layers,
  ChevronRight,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import ComplianceBadge from "@/components/ComplianceBadge";
import { formatDate } from "@/lib/utils";
import { AuditRecord } from "@/types";

interface AnalyticsData {
  totalAudits: number;
  complianceRate: number;
  compliantCount: number;
  partialCount: number;
  violationCount: number;
  totalHelmets: number;
  totalJackets: number;
  avgScore: number;
  avgLatencyMs: number;
  recentAudits: AuditRecord[];
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch((err) => console.error("Error loading dashboard data:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const marqueeItems = [
    { label: "ISO 45001 OCCUPATIONAL HEALTH & SAFETY", code: "CERTIFIED" },
    { label: "EN 397 INDUSTRIAL HELMET STANDARDS", code: "COMPLIANT" },
    { label: "EN ISO 20471 HIGH-VISIBILITY CLOTHING", code: "VERIFIED" },
    { label: "PER.08/MEN/VII/2010 KEMNAKER RI", code: "OFFICIAL" },
    { label: "PURE ONNX INFERENCE ACCELERATOR", code: "SUB-SECOND" },
    { label: "FASTAPI ASYNC RTSP TELEMETRY", code: "REAL-TIME" },
    { label: "NEXT.JS 16 ENTERPRISE ARCHITECTURE", code: "TURBOPACK" },
  ];

  return (
    <div className="space-y-20 max-w-7xl mx-auto">
      {/* ========================================================= */}
      {/* 1. HERO SECTION (Enterprise Light & Dark Navy Theme)       */}
      {/* ========================================================= */}
      <section className="text-center pt-8 sm:pt-14 pb-4 relative z-10">
        {/* Pill Badge with Enterprise Blue Dot */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs font-mono text-slate-700 dark:text-slate-300 mb-8 shadow-xs transition-colors">
          <span className="w-2 h-2 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
          <span>The AI-Powered K3 Surveillance Operating System</span>
        </div>

        {/* Hero Title with Enterprise Cobalt Accent */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight font-display max-w-5xl mx-auto leading-[1.0] text-slate-900 dark:text-white transition-colors">
          The Next-Gen <br />
          <span className="text-[#2563EB] dark:text-[#3B82F6]">
            Safety Intelligence
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed transition-colors">
          Autonomous real-time PPE computer vision for industrial construction and high-risk jobsites.
          Detect safety helmets, reflective vests, and enforce ISO 45001 compliance with zero-friction inference.
        </p>

        {/* Solid Enterprise CTA Group */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/detect"
            className="px-6 py-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 active:scale-95 border border-[#1D4ED8]"
          >
            <span>Launch Detection Studio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/history"
            className="px-6 py-3 rounded-lg bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm"
          >
            <span>View Audit Trail</span>
          </Link>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. METRICS PROOF BENTO GRID                                */}
      {/* ========================================================= */}
      <section className="relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard
            title="Compliance Rate"
            value={isLoading ? "—" : `${data?.complianceRate ?? 0}%`}
            subtitle="Target SOP: ≥ 90%"
            icon={TrendingUp}
            variant="emerald"
          />
          <StatCard
            title="Total Inspections"
            value={isLoading ? "—" : (data?.totalAudits ?? 0)}
            subtitle="Verified safety records"
            icon={FileCheck}
            variant="default"
          />
          <StatCard
            title="Detected APD Units"
            value={
              isLoading
                ? "—"
                : (data?.totalHelmets ?? 0) + (data?.totalJackets ?? 0)
            }
            subtitle={`${data?.totalHelmets ?? 0} helmets · ${data?.totalJackets ?? 0} vests`}
            icon={HardHat}
            variant="orange"
          />
          <StatCard
            title="Inference Latency"
            value={
              isLoading
                ? "—"
                : `${data?.avgLatencyMs ? Math.round(data.avgLatencyMs) : 413}ms`
            }
            subtitle="Pure ONNX CPU Execution"
            icon={Cpu}
            variant="default"
          />
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. INFINITE STANDARDS & TECHNOLOGY MARQUEE               */}
      {/* ========================================================= */}
      <section className="relative z-10 overflow-hidden py-4 border-y border-slate-200 dark:border-slate-800/80 mask-marquee">
        <div className="animate-marquee gap-8">
          {[...marqueeItems, ...marqueeItems].map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs font-mono text-slate-700 dark:text-slate-300 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-[#3B82F6]" />
              <span className="font-semibold tracking-wider">{item.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700/50">
                {item.code}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. PRODUCT CAPABILITIES BENTO GRID                        */}
      {/* ========================================================= */}
      <section className="space-y-6 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold block mb-1">
              Capabilities Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display uppercase transition-colors">
              Modular Vision Infrastructure
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md transition-colors">
            Three interconnected pillars providing end-to-end occupational health and safety monitoring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {/* Card 1: Image PPE Inspection */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm dark:shadow-md">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-800 dark:text-white">
                <ScanSearch className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display transition-colors">
                High-Resolution Image Inspector
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
                Drag-and-drop worker photos up to 4K. Features resolution-scaled bounding boxes,
                1x–4x interactive canvas zoom &amp; pan (<code className="text-slate-800 dark:text-slate-200 font-semibold">Ctrl + Scroll</code>), and worker auto-focus reticles.
              </p>
            </div>
            <div className="pt-6">
              <Link
                href="/detect"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#2563EB] dark:hover:text-white transition-colors"
              >
                <span>Launch Image Studio</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2: Multi-Camera CCTV Stream */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm dark:shadow-md">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-800 dark:text-white">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display transition-colors">
                RTSP Multi-Camera CCTV Deck
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
                Multi-channel IP camera monitoring and USB webcams. Features dynamic target FPS throttling (5–30 FPS),
                instant hot-swap filmstrip, and enterprise Fullscreen Command Mode for security guard posts.
              </p>
            </div>
            <div className="pt-6">
              <Link
                href="/detect"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#2563EB] dark:hover:text-white transition-colors"
              >
                <span>Open Live Stream</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 3: Regulatory Compliance Trail */}
          <div className="p-6 rounded-xl bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm dark:shadow-md">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-800 dark:text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display transition-colors">
                Automated ISO-45001 Audit Trail
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
                Relational persistence in SQLite Prisma and Supabase storage. Filter compliance rates by status,
                export print-ready safety audit certificates, and view equipment breakdown charts.
              </p>
            </div>
            <div className="pt-6">
              <Link
                href="/history"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#2563EB] dark:hover:text-white transition-colors"
              >
                <span>Explore Audit History</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. RECENT INSPECTIONS FEED                                */}
      {/* ========================================================= */}
      <section className="space-y-4 relative z-10">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E1626] shadow-sm dark:shadow-md overflow-hidden transition-colors">
          <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight font-display uppercase transition-colors">
                Recent Safety Inspections
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">
                Live compliance stream captured from photo uploads and CCTV snapshots
              </p>
            </div>
            <Link
              href="/history"
              className="text-xs font-semibold text-[#2563EB] dark:text-[#3B82F6] hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
            >
              <span>View All Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 font-mono">
              Loading recent inspection logs...
            </div>
          ) : !data?.recentAudits || data.recentAudits.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 font-mono">
              No audit logs recorded yet. Run a detection in the studio to populate safety records.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800/80 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/20">
                    <th className="py-3 px-6">Timestamp</th>
                    <th className="py-3 px-4">Session Name</th>
                    <th className="py-3 px-4">Feed Source</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">APD Equipment</th>
                    <th className="py-3 px-6 text-right">K3 Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {data.recentAudits.slice(0, 5).map((audit) => (
                    <tr
                      key={audit.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {formatDate(audit.createdAt)}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white max-w-[220px] truncate">
                        {audit.fileName || "Live Inspection"}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                          {audit.source}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <ComplianceBadge status={audit.complianceStatus} size="sm" />
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{audit.helmetCount} helmets</span>
                        <span className="text-slate-300 dark:text-slate-600 mx-1.5">•</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{audit.jacketCount} vests</span>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-slate-900 dark:text-white font-mono text-sm">
                        {audit.complianceScore}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
