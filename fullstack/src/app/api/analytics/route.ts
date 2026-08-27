import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalAudits = await prisma.auditLog.count();

    const compliantCount = await prisma.auditLog.count({
      where: { complianceStatus: "COMPLIANT" },
    });

    const partialCount = await prisma.auditLog.count({
      where: { complianceStatus: "PARTIAL" },
    });

    const violationCount = await prisma.auditLog.count({
      where: { complianceStatus: "NON_COMPLIANT" },
    });

    const aggregates = await prisma.auditLog.aggregate({
      _sum: {
        helmetCount: true,
        jacketCount: true,
        totalDetected: true,
      },
      _avg: {
        complianceScore: true,
        inferenceMs: true,
      },
    });

    const recentAudits = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        items: true,
      },
    });

    const complianceRate =
      totalAudits > 0
        ? Math.round(((compliantCount + partialCount * 0.5) / totalAudits) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalAudits,
        complianceRate,
        compliantCount,
        partialCount,
        violationCount,
        totalHelmets: aggregates._sum.helmetCount || 0,
        totalJackets: aggregates._sum.jacketCount || 0,
        totalDetected: aggregates._sum.totalDetected || 0,
        avgScore: Math.round(aggregates._avg.complianceScore || 0),
        avgLatencyMs: Math.round(aggregates._avg.inferenceMs || 0),
        recentAudits,
      },
    });
  } catch (error: unknown) {
    console.error("Error computing analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to compute analytics" },
      { status: 500 }
    );
  }
}
