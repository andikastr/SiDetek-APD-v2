import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadAuditImage } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      source = "UPLOAD",
      fileName = "Audit_Capture.jpg",
      annotatedImageBase64,
      complianceStatus,
      complianceScore = 0,
      helmetCount = 0,
      jacketCount = 0,
      totalDetected = 0,
      inferenceMs = 0,
      notes = null,
      objects = [],
    } = body;

    let annotatedImageUrl = null;
    if (annotatedImageBase64) {
      annotatedImageUrl = await uploadAuditImage(annotatedImageBase64, fileName);
    }

    const auditLog = await prisma.auditLog.create({
      data: {
        source,
        fileName,
        annotatedImageUrl,
        complianceStatus: complianceStatus || "NON_COMPLIANT",
        complianceScore: Number(complianceScore) || 0,
        helmetCount: Number(helmetCount) || 0,
        jacketCount: Number(jacketCount) || 0,
        totalDetected: Number(totalDetected) || 0,
        inferenceMs: Number(inferenceMs) || 0,
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
    console.error("Error creating audit log:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Failed to persist audit log", details: msg },
      { status: 500 }
    );
  }
}
