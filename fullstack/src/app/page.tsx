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
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Clean Top Hero Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            PPE Compliance Overview
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Automated safety helmet and high-visibility vest compliance monitoring for jobsite workers.
          </p>
        </div>

        <div>
          <Link
            href="/detect"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0a1b5c] hover:bg-[#0d327f] text-white text-xs font-medium shadow-xs transition-colors"
          >
            <ScanSearch className="w-4 h-4 text-amber-400" />
            <span>Start New Inspection</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        <StatCard
          title="Compliance Rate"
          value={isLoading ? "—" : `${data?.complianceRate ?? 0}%`}
          subtitle="Target SOP: ≥ 90%"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Audit Sessions"
          value={isLoading ? "—" : (data?.totalAudits ?? 0)}
          subtitle="Photo & webcam"
          icon={FileCheck}
        />
        <StatCard
          title="Safety Helmets"
          value={isLoading ? "—" : (data?.totalHelmets ?? 0)}
          subtitle="Verified units"
          icon={HardHat}
        />
        <StatCard
          title="Reflective Vests"
          value={isLoading ? "—" : (data?.totalJackets ?? 0)}
          subtitle="Verified units"
          icon={Shield}
        />
      </div>

      {/* Full-Width Recent Audits Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex items-center justify-between border-b border-gray-100 bg-white">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Recent Inspections
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Latest recorded on-site safety compliance checks
            </p>
          </div>
          <Link
            href="/history"
            className="text-xs font-medium text-[#0a1b5c] hover:underline flex items-center gap-1 transition-colors"
          >
            View all records
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-xs text-gray-400">
            Loading inspection records...
          </div>
        ) : !data?.recentAudits || data.recentAudits.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-xs text-gray-400">
              No audit records saved yet.
            </p>
            <Link
              href="/detect"
              className="inline-block text-xs font-semibold text-[#0a1b5c] hover:underline"
            >
              Start first detection →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[10px] bg-gray-50/70">
                <tr>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Safety Status</th>
                  <th className="py-3 px-4">Identified PPE</th>
                  <th className="py-3 px-6 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {data.recentAudits.map((audit) => (
                  <tr
                    key={audit.id}
                    className="hover:bg-blue-50/15 transition-colors"
                  >
                    <td className="py-4 px-6 font-medium text-gray-900 text-xs">
                      {formatDate(audit.createdAt)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[11px] text-gray-500 capitalize">
                        {audit.source.toLowerCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <ComplianceBadge status={audit.complianceStatus} size="sm" />
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {audit.helmetCount} helmets · {audit.jacketCount} vests
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-gray-900">
                      {audit.complianceScore}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Safety Standards & Certification Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0a1b5c]" />
            <h3 className="text-sm font-semibold text-gray-900">
              PPE Safety Standards &amp; Certification
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            Standard Reference: EN 397 · EN ISO 20471
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-gray-50/70 border border-gray-100 flex items-start gap-3.5">
            <div className="p-2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 mt-0.5">
              <HardHat className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 flex items-center gap-2">
                <span>Safety Helmet</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100/80 text-emerald-800 font-semibold">
                  EN 397 / ANSI
                </span>
              </div>
              <p className="text-gray-500 mt-1 leading-relaxed">
                Mandatory head protection against vertical falling objects and construction site lateral impacts.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gray-50/70 border border-gray-100 flex items-start gap-3.5">
            <div className="p-2 rounded-md bg-amber-50 text-amber-700 border border-amber-100 mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 flex items-center gap-2">
                <span>Reflective Vest</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-800 font-semibold">
                  EN ISO 20471
                </span>
              </div>
              <p className="text-gray-500 mt-1 leading-relaxed">
                High-visibility identification for workers near heavy equipment maneuvers, crane paths, and low-light environments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
