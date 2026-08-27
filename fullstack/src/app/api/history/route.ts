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
