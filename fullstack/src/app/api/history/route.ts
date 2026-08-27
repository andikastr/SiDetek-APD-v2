import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const whereClause: Record<string, unknown> = {};
    if (status && status !== "ALL") {
      whereClause.complianceStatus = status;
    }
    if (source && source !== "ALL") {
      whereClause.source = source;
    }

    const records = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error: unknown) {
    console.error("Error fetching audit records:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit records" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const deleteAll = searchParams.get("all") === "true";

    if (deleteAll) {
      const result = await prisma.auditLog.deleteMany({});
      return NextResponse.json({
        success: true,
        message: `Successfully deleted all ${result.count} audit logs.`,
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing 'id' parameter." },
        { status: 400 }
      );
    }

    await prisma.auditLog.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Audit record ${id} deleted successfully.`,
    });
  } catch (error: unknown) {
    console.error("Error deleting audit log:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete audit record" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const source = body.source || (body.method === "WEBCAM" ? "WEBCAM" : "UPLOAD");
    const fileName = body.fileName || body.filename || "Audit_Capture.jpg";
    const annotatedImageBase64 = body.annotatedImageBase64 || body.image_base64 || null;
    const complianceStatus = body.complianceStatus || body.status || "NON_COMPLIANT";
    const complianceScore = Number(body.complianceScore ?? body.score ?? 0);
    const helmetCount = Number(body.helmetCount ?? body.helmet_count ?? 0);
    const jacketCount = Number(body.jacketCount ?? body.jacket_count ?? 0);
    const totalDetected = Number(
      body.totalDetected ?? body.total_detected ?? (helmetCount + jacketCount)
    );
    const inferenceMs = Number(body.inferenceMs ?? body.inference_time_ms ?? 0);
    const notes =
      body.notes ||
      (Array.isArray(body.recommendations) ? body.recommendations.join("; ") : null);
    const objects = body.objects || [];

    let annotatedImageUrl = null;
    if (annotatedImageBase64) {
      try {
        const { uploadAuditImage } = await import("@/lib/supabase");
        annotatedImageUrl = await uploadAuditImage(annotatedImageBase64, fileName);
      } catch (uploadErr) {
        console.warn("Supabase image upload skipped or failed:", uploadErr);
      }
    }

    const auditLog = await prisma.auditLog.create({
      data: {
        source,
        fileName,
        annotatedImageUrl,
        complianceStatus,
        complianceScore,
        helmetCount,
        jacketCount,
        totalDetected,
        inferenceMs,
        notes,
        items: {
          create: (objects || []).map((obj: {
            class_id?: number;
            label: string;
            confidence: number;
            bbox?: {
              x1: number;
              y1: number;
              x2: number;
              y2: number;
              norm_x1: number;
              norm_y1: number;
              norm_x2: number;
              norm_y2: number;
            };
          }) => ({
            classId: obj.class_id ?? 0,
            label: obj.label || "APD",
            confidence: Number(obj.confidence) || 0,
            x1: obj.bbox?.x1 ?? 0,
            y1: obj.bbox?.y1 ?? 0,
            x2: obj.bbox?.x2 ?? 0,
            y2: obj.bbox?.y2 ?? 0,
            normX1: obj.bbox?.norm_x1 ?? 0,
            normY1: obj.bbox?.norm_y1 ?? 0,
            normX2: obj.bbox?.norm_x2 ?? 0,
            normY2: obj.bbox?.norm_y2 ?? 0,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Audit record successfully persisted.",
      data: auditLog,
    });
  } catch (error: unknown) {
    console.error("Error creating audit record via /api/history:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Failed to persist audit log", details: msg },
      { status: 500 }
    );
  }
}

