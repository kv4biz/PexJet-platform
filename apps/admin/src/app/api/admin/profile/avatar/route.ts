import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pexjet/database";
import { verifyAccessToken, extractTokenFromHeader } from "@pexjet/lib";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST - Upload avatar
export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image." },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2MB." },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `avatar-${payload.sub}-${Date.now()}.${ext}`;

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadsDir, { recursive: true });

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    // Update admin avatar in database
    const avatarUrl = `/uploads/avatars/${filename}`;
    const admin = await prisma.admin.update({
      where: { id: payload.sub },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        avatar: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "ADMIN_UPDATE",
        targetType: "Admin",
        targetId: admin.id,
        adminId: admin.id,
        description: "Admin updated their avatar",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ avatar: admin.avatar });
  } catch (error: any) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

// DELETE - Remove avatar
export async function DELETE(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Update admin to remove avatar
    const admin = await prisma.admin.update({
      where: { id: payload.sub },
      data: { avatar: null },
      select: {
        id: true,
        avatar: true,
      },
    });

    return NextResponse.json({ avatar: admin.avatar });
  } catch (error: any) {
    console.error("Avatar delete error:", error);
    return NextResponse.json(
      { error: "Failed to remove avatar" },
      { status: 500 }
    );
  }
}
