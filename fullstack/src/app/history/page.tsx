"use client";

import { useEffect, useState } from "react";
import {
  Trash2,
  Eye,
  X,
  Printer,
  Search,
  FileSpreadsheet,
  HardHat,
  Shield,
} from "lucide-react";
import { AuditRecord } from "@/types";
import ComplianceBadge from "@/components/ComplianceBadge";
import { formatDate } from "@/lib/utils";

export default function HistoryPage() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterSource, setFilterSource] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showDeleteAllModal, setShowDeleteAllModal] = useState<boolean>(false);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const url = `/api/history?status=${filterStatus}&source=${filterSource}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setRecords(json.data);
    } catch (e) {
      console.error("Failed to load audit history:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterSource]);

  const handleDeleteSingle = async (id: string) => {
    if (!confirm("Delete this audit record?")) return;
    try {
      const res = await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
        if (selectedRecord?.id === id) setSelectedRecord(null);
      }
    } catch {
      alert("Failed to delete record.");
    }
  };

  const handleDeleteAll = async () => {
    try {
      const res = await fetch("/api/history?all=true", { method: "DELETE" });
      if (res.ok) {
        setRecords([]);
        setShowDeleteAllModal(false);
      }
    } catch {
      alert("Failed to delete records.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredRecords = records.filter((r) =>
    (r.fileName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Official Print Header (Only visible when printing) */}
      <div className="hidden print:block pb-6 border-b-2 border-slate-900 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#e36124] mb-1">
              ARTHA IT · POWERINTELLIGENT
            </div>
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
              OFFICIAL PPE COMPLIANCE AUDIT REPORT
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Construction &amp; Fabrication Jobsite — Automated Vision Surveillance System
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p>Standards: EN 397 · EN ISO 20471</p>
            <p>Printed Date: {new Date().toLocaleDateString("en-US")}</p>
          </div>
        </div>
      </div>

      {/* Screen Header & Top Action Bar */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">
            Audit History Log
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Archived records of on-site safety compliance inspections.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#0a1b5c] hover:bg-[#0d327f] text-white text-xs font-medium shadow-xs transition-colors"
            title="Print formal K3 audit report"
          >
            <Printer className="w-3.5 h-3.5 text-white" />
            <span>Print Report</span>
          </button>

          {records.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-gray-500 hover:text-rose-600 text-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Screen Filters & Search Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-white shadow-2xs">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 text-xs">
          {[
            { id: "ALL", label: "All" },
            { id: "COMPLIANT", label: "Compliant" },
            { id: "PARTIAL", label: "Partial" },
            { id: "NON_COMPLIANT", label: "Violation" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterStatus === tab.id
                  ? "bg-[#0a1b5c] text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Source Dropdown & Search Input */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#0a1b5c]"
            />
          </div>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-xs font-medium text-gray-700 focus:outline-none focus:bg-white"
          >
            <option value="ALL">All Methods</option>
            <option value="UPLOAD">Photo</option>
            <option value="WEBCAM">Webcam</option>
          </select>
        </div>
      </div>

      {/* Structured Formal Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-xs overflow-hidden print-card">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-gray-400">
            Loading inspection records...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <FileSpreadsheet className="w-7 h-7 text-gray-300 mx-auto" />
            <p className="text-xs text-gray-400">
              No matching audit records found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 text-[#0a1b5c] font-semibold uppercase tracking-wider text-[10px] bg-gray-50/70">
                <tr>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-4">File / Session</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Identified PPE</th>
                  <th className="py-3 px-4 text-center">Latency</th>
                  <th className="py-3 px-6 text-right">Score</th>
                  <th className="py-3 px-4 text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-blue-50/15 transition-colors"
                  >
                    <td className="py-4 px-6 font-medium text-gray-900 text-xs whitespace-nowrap">
                      {formatDate(record.createdAt)}
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-700 max-w-[200px] truncate" title={record.fileName || ""}>
                      {record.fileName || "Session"}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[11px] text-gray-500 capitalize">
                        {record.source.toLowerCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <ComplianceBadge status={record.complianceStatus} size="sm" />
                    </td>
                    <td className="py-4 px-4 text-gray-600 text-xs">
                      {record.helmetCount} helmets, {record.jacketCount} vests
                    </td>
                    <td className="py-4 px-4 text-center text-gray-400 font-mono text-[11px]">
                      {record.inferenceMs} ms
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-gray-900">
                      {record.complianceScore}%
                    </td>
                    <td className="py-4 px-4 text-center no-print">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedRecord(record)}
                          className="p-1 rounded text-[#0a1b5c] hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSingle(record.id)}
                          className="p-1 rounded text-gray-400 hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white border border-gray-200 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Inspection Details
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(selectedRecord.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedRecord.annotatedImageUrl && (
              <div className="rounded-lg overflow-hidden bg-slate-950 max-h-[340px] flex items-center justify-center border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedRecord.annotatedImageUrl}
                  alt="Audit Detail"
                  className="max-h-[340px] w-auto object-contain"
                />
              </div>
            )}

            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <span className="text-[11px] text-gray-400 block">Status</span>
                <div className="mt-1">
                  <ComplianceBadge status={selectedRecord.complianceStatus} size="sm" />
                </div>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <span className="text-[11px] text-gray-400 block">Score</span>
                <span className="text-base font-bold text-[#0a1b5c] mt-0.5 block">
                  {selectedRecord.complianceScore}%
                </span>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <span className="text-[11px] text-gray-400 block">Helmets / Vests</span>
                <span className="text-base font-bold text-gray-900 mt-0.5 block">
                  {selectedRecord.helmetCount} / {selectedRecord.jacketCount}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <span className="text-[11px] text-gray-400 block">Latency</span>
                <span className="text-base font-bold text-gray-900 mt-0.5 block">
                  {selectedRecord.inferenceMs} ms
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white border border-gray-200 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Clear All Audit Records?
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                All saved inspection logs will be permanently deleted from the system.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 text-xs font-semibold">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                className="px-3.5 py-1.5 rounded-md bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
