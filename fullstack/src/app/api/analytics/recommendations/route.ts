import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  generateGeminiSafetyRecommendations,
  InspectionMetricsInput,
  RecommendationItem,
} from "@/lib/gemini";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    const latestRecommendation = await prisma.safetyRecommendation.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!latestRecommendation) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    let items: RecommendationItem[] = [];
    try {
      items = JSON.parse(latestRecommendation.itemsJson);
    } catch {
      items = [];
    }

    return NextResponse.json({
      success: true,
      data: {
        id: latestRecommendation.id,
        items,
        complianceRate: latestRecommendation.complianceRate,
        totalAudits: latestRecommendation.totalAudits,
        createdAt: latestRecommendation.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching safety recommendations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch safety recommendations" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please login first." },
        { status: 401 }
      );
    }

    const whereClause: Record<string, unknown> = {
      OR: [
        { userId: user.id },
        { userId: null },
      ],
    };

    // Aggregate user's real inspection telemetry
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

    const recentLogsWithNotes = await prisma.auditLog.findMany({
      where: {
        ...whereClause,
        notes: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { notes: true },
    });

    const recentNotes: string[] = recentLogsWithNotes
      .map((l) => l.notes)
      .filter((n): n is string => Boolean(n));

    const complianceRate =
      totalAudits > 0
        ? Math.round(((compliantCount + partialCount * 0.5) / totalAudits) * 100)
        : 0;

    const metricsInput: InspectionMetricsInput = {
      totalAudits,
      complianceRate,
      compliantCount,
      partialCount,
      violationCount,
      totalHelmets: aggregates._sum.helmetCount || 0,
      totalJackets: aggregates._sum.jacketCount || 0,
      avgScore: Math.round(aggregates._avg.complianceScore || 0),
      recentNotes,
    };

    // Generate intelligent recommendations via Gemini Flash Lite (or fallback rule engine)
    const result = await generateGeminiSafetyRecommendations(metricsInput);

    // Save permanently to database scoped by user.id
    const savedRecord = await prisma.safetyRecommendation.create({
      data: {
        userId: user.id,
        complianceRate: result.complianceRate,
        totalAudits: result.totalAudits,
        itemsJson: JSON.stringify(result.items),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: savedRecord.id,
        items: result.items,
        complianceRate: savedRecord.complianceRate,
        totalAudits: savedRecord.totalAudits,
        source: result.source,
        createdAt: savedRecord.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("Error generating safety recommendations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate safety recommendations" },
      { status: 500 }
    );
  }
}
