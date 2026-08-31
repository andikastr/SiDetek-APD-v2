import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const whereClause: Record<string, unknown> = {};

    if (user) {
      whereClause.OR = [
        { userId: user.id },
        { userId: null },
      ];
    }

    // Real active user count in the system
    const activeUsers = await prisma.user.count();

    // Real camera feeds count in the system / user
    const activeCameras = await prisma.camera.count({
      where: user
        ? {
            OR: [
              { userId: user.id },
              { userId: null },
            ],
          }
        : undefined,
    });

    const totalAudits = await prisma.auditLog.count({ where: whereClause });

    const compliantCount = await prisma.auditLog.count({
      where: { ...whereClause, complianceStatus: "COMPLIANT" },
    });

    const partialCount = await prisma.auditLog.count({
      where: { ...whereClause, complianceStatus: "PARTIAL" },
    });

    const violationCount = await prisma.auditLog.count({
      where: { ...whereClause, complianceStatus: "NON_COMPLIANT" },
    });

    const aggregates = await prisma.auditLog.aggregate({
      where: whereClause,
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

    // For authenticated users: return recent audit logs. For guests: protect log records
    const recentAudits = user
      ? await prisma.auditLog.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            items: true,
          },
        })
      : [];

    const complianceRate =
      totalAudits > 0
        ? Math.round(((compliantCount + partialCount * 0.5) / totalAudits) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        activeUsers,
        activeCameras,
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
