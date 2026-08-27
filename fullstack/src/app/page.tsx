"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ScanSearch,
  TrendingUp,
  FileCheck,
  HardHat,
  Shield,
  ShieldCheck,
  Award,
  Clock,
  Sparkles,
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

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Clean Subtitle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <p className="text-xs text-slate-500">
          Automated safety helmet and high-visibility vest compliance monitoring for jobsite workers.
        </p>
        <span className="text-[11px] text-slate-500 font-technical">
          Standards: EN 397 · EN ISO 20471
        </span>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Compliance Rate"
          value={isLoading ? "—" : `${data?.complianceRate ?? 0}%`}
          subtitle="Target SOP: ≥ 90%"
          icon={TrendingUp}
          variant="emerald"
        />
        <StatCard
          title="Audit Sessions"
          value={isLoading ? "—" : (data?.totalAudits ?? 0)}
          subtitle="Total verified records"
          icon={FileCheck}
          variant="default"
        />
        <StatCard
          title="Safety Helmets"
          value={isLoading ? "—" : (data?.totalHelmets ?? 0)}
          subtitle="Verified headgear"
          icon={HardHat}
          variant="emerald"
        />
        <StatCard
          title="Reflective Vests"
          value={isLoading ? "—" : (data?.totalJackets ?? 0)}
          subtitle="Verified high-vis"
          icon={Shield}
          variant="amber"
        />
      </div>

      {/* Recent Inspections Table */}
      <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-100 bg-white">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Recent Safety Inspections
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit sessions logged across device webcams, RTSP streams, and uploaded photos
            </p>
          </div>
          <Link
            href="/history"
            className="text-xs font-semibold text-slate-900 hover:text-amber-600 flex items-center gap-1.5 transition-colors group"
          >
            <span>View Full Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 font-medium">
            Fetching inspection records...
          </div>
        ) : !data?.recentAudits || data.recentAudits.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-xs text-slate-500">
              No safety audit records logged yet.
            </p>
            <Link
              href="/detect"
              className="inline-block text-xs font-semibold text-amber-600 hover:underline"
            >
              Start your first inspection →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] bg-slate-50/60 font-technical">
                <tr>
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-4">Inspection Method</th>
                  <th className="py-3.5 px-4">Compliance Status</th>
                  <th className="py-3.5 px-4">Identified PPE</th>
                  <th className="py-3.5 px-6 text-right">K3 Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {data.recentAudits.map((audit) => (
                  <tr
                    key={audit.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-4 px-6 font-medium text-slate-900 text-xs font-technical">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(audit.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[11px] font-semibold text-slate-600 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/60 capitalize">
                        {audit.source.toLowerCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <ComplianceBadge status={audit.complianceStatus} size="sm" />
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      <span className="text-emerald-700 font-semibold">{audit.helmetCount} helmets</span>
                      <span className="text-slate-300 mx-1.5">•</span>
                      <span className="text-amber-700 font-semibold">{audit.jacketCount} vests</span>
                    </td>
                    <td className="py-4 px-6 text-right font-extrabold text-slate-900 font-technical text-sm">
                      {audit.complianceScore}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Safety Standards & Regulatory Framework Section */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Safety Standards &amp; Regulatory Compliance
              </h3>
              <p className="text-[11px] text-slate-500">
                Official occupational safety benchmarks enforced by SiDetek-APD
              </p>
            </div>
          </div>
          <span className="text-[11px] text-slate-600 font-medium px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
            ISO 45001 · EN 397 · EN ISO 20471
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-start gap-3.5 hover:border-emerald-200 transition-colors">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 mt-0.5 shadow-2xs">
              <HardHat className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span>Safety Helmet Mandate</span>
                <span className="text-[10px] font-technical px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  EN 397 / ANSI Z89.1
                </span>
              </div>
              <p className="text-slate-500 mt-1.5 leading-relaxed text-[11px]">
                Mandatory industrial headgear protection against falling debris, overhead structural hazards, and lateral collision impacts on active construction jobsites.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-start gap-3.5 hover:border-amber-200 transition-colors">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 mt-0.5 shadow-2xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <span>High-Visibility Vest Mandate</span>
                <span className="text-[10px] font-technical px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                  EN ISO 20471 Class 2
                </span>
              </div>
              <p className="text-slate-500 mt-1.5 leading-relaxed text-[11px]">
                Fluorescent daytime and retroreflective nighttime visibility identification for workers operating near heavy plant machinery, cranes, and traffic zones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
