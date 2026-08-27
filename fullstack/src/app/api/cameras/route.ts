import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cameras = await prisma.camera.findMany({
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      count: cameras.length,
      data: cameras,
    });
  } catch (error: unknown) {
    console.error("Error fetching cameras:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cameras" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, url, location } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, error: "Camera name is required" },
        { status: 400 }
      );
    }

    if (type !== "DEVICE" && type !== "RTSP") {
      return NextResponse.json(
        { success: false, error: "Invalid camera type (must be DEVICE or RTSP)" },
        { status: 400 }
      );
    }

    if (type === "RTSP" && (!url || typeof url !== "string")) {
      return NextResponse.json(
        { success: false, error: "RTSP stream URL is required for RTSP cameras" },
        { status: 400 }
      );
    }

    const newCamera = await prisma.camera.create({
      data: {
        name: name.trim(),
        type,
        url: url?.trim() || null,
        location: location?.trim() || "Main Jobsite Area",
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: newCamera,
    });
  } catch (error: unknown) {
    console.error("Error creating camera:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create camera" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Camera ID is required" },
        { status: 400 }
      );
    }

    await prisma.camera.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Camera deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting camera:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete camera" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, type, url, location } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Camera ID is required" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, error: "Camera name is required" },
        { status: 400 }
      );
    }

    if (type !== "DEVICE" && type !== "RTSP") {
      return NextResponse.json(
        { success: false, error: "Invalid camera type (must be DEVICE or RTSP)" },
        { status: 400 }
      );
    }

    if (type === "RTSP" && (!url || typeof url !== "string")) {
      return NextResponse.json(
        { success: false, error: "RTSP stream URL is required for RTSP cameras" },
        { status: 400 }
      );
    }

    const updatedCamera = await prisma.camera.update({
      where: { id },
      data: {
        name: name.trim(),
        type,
        url: type === "RTSP" ? url?.trim() || null : null,
        location: location?.trim() || "Main Jobsite Area",
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCamera,
    });
  } catch (error: unknown) {
    console.error("Error updating camera:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update camera" },
      { status: 500 }
    );
  }
}

