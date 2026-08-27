"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Activity,
  Zap,
  CheckCircle2,
  HardHat,
  Shield,
} from "lucide-react";
import StatCard from "@/components/StatCard";

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
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch((err) => console.error("Error fetching analytics:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const totalAudits = data?.totalAudits || 0;
  const compliantPercent = totalAudits > 0 ? Math.round(((data?.compliantCount || 0) / totalAudits) * 100) : 0;
  const partialPercent = totalAudits > 0 ? Math.round(((data?.partialCount || 0) / totalAudits) * 100) : 0;
  const violationPercent = totalAudits > 0 ? Math.round(((data?.violationCount || 0) / totalAudits) * 100) : 0;

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-xl font-bold tracking-tight text-gray-900">
          Safety Compliance Analytics
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Statistical metrics and PPE distribution across jobsite audit sessions.
        </p>
      </div>

      {/* KPI StatCards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        <StatCard
          title="Compliance Rate"
          value={isLoading ? "—" : `${data?.complianceRate ?? 0}%`}
          subtitle="Target SOP: ≥ 90%"
          icon={TrendingUp}
        />
        <StatCard
          title="Average Score"
          value={isLoading ? "—" : `${data?.avgScore ?? 0}/100`}
          subtitle="Average score per session"
          icon={Activity}
        />
        <StatCard
          title="AI Latency"
          value={isLoading ? "—" : `${data?.avgLatencyMs ?? 0} ms`}
          subtitle="YOLOv11 inference speed"
          icon={Zap}
        />
        <StatCard
          title="Fully Compliant"
          value={isLoading ? "—" : `${compliantPercent}%`}
          subtitle={`${data?.compliantCount ?? 0} of ${totalAudits} sessions`}
          icon={CheckCircle2}
        />
      </div>

      {/* Distribution & APD Volume Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Compliance Distribution (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Jobsite Compliance Distribution
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Breakdown of safety audit outcomes
            </p>
          </div>

          {/* Color bar */}
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-gray-100 shadow-inner">
              <div
                style={{ width: `${compliantPercent}%` }}
                className="bg-emerald-600 transition-all duration-500"
                title={`Compliant: ${compliantPercent}%`}
              />
              <div
                style={{ width: `${partialPercent}%` }}
                className="bg-amber-500 transition-all duration-500"
                title={`Partial: ${partialPercent}%`}
              />
              <div
                style={{ width: `${violationPercent}%` }}
                className="bg-rose-600 transition-all duration-500"
                title={`Violation: ${violationPercent}%`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 font-medium">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* 3 Metric Summary Boxes */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center">
            <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/60">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase block">
                Compliant
              </span>
              <span className="text-2xl font-bold text-gray-900 mt-1 block">
                {data?.compliantCount ?? 0}
              </span>
              <span className="text-xs text-emerald-700 font-medium">
                {compliantPercent}%
              </span>
            </div>

            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/60">
              <span className="text-[11px] font-semibold text-amber-800 uppercase block">
                Partial
              </span>
              <span className="text-2xl font-bold text-gray-900 mt-1 block">
                {data?.partialCount ?? 0}
              </span>
              <span className="text-xs text-amber-700 font-medium">
                {partialPercent}%
              </span>
            </div>

            <div className="p-4 rounded-lg border border-rose-200 bg-rose-50/60">
              <span className="text-[11px] font-semibold text-rose-800 uppercase block">
                Violation
              </span>
              <span className="text-2xl font-bold text-gray-900 mt-1 block">
                {data?.violationCount ?? 0}
              </span>
              <span className="text-xs text-rose-700 font-medium">
                {violationPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Right: APD Volume (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-gray-200 bg-white p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Identified PPE Volume
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Cumulative counts of detected helmets and safety vests
              </p>
            </div>

            <div className="space-y-5 pt-1 text-xs">
              {/* Helmet volume */}
              <div>
                <div className="flex justify-between text-xs font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <HardHat className="w-4 h-4 text-emerald-600" /> Safety Helmets
                  </span>
                  <span className="font-bold text-gray-900">{data?.totalHelmets ?? 0} units</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{
                      width: `${
                        (data?.totalHelmets || 0) + (data?.totalJackets || 0) > 0
                          ? Math.round(
                              ((data?.totalHelmets || 0) /
                                ((data?.totalHelmets || 0) + (data?.totalJackets || 0))) *
                                100
                            )
                          : 50
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Jacket volume */}
              <div>
                <div className="flex justify-between text-xs font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5 text-amber-800">
                    <Shield className="w-4 h-4 text-amber-600" /> Reflective Vests
                  </span>
                  <span className="font-bold text-gray-900">{data?.totalJackets ?? 0} units</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${
                        (data?.totalHelmets || 0) + (data?.totalJackets || 0) > 0
                          ? Math.round(
                              ((data?.totalJackets || 0) /
                                ((data?.totalHelmets || 0) + (data?.totalJackets || 0))) *
                                100
                            )
                          : 50
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 text-xs text-gray-500">
            <span className="font-medium text-gray-700">Helmet to Vest Ratio:</span>{" "}
            {data?.totalHelmets || 0} to {data?.totalJackets || 0} units
          </div>
        </div>
      </div>
    </div>
  );
}
