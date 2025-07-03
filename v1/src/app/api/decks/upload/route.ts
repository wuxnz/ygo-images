import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const file = formData.get("file") as File;

    if (!name || !file) {
      return NextResponse.json(
        { error: "Name and file are required" },
        { status: 400 },
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".ydk")) {
      return NextResponse.json(
        { error: "File must be a .ydk file" },
        { status: 400 },
      );
    }

    // Check if deck name already exists for this user
    const existingDeck = await db.deck.findFirst({
      where: {
        userId: session.user.id,
        name: name,
      },
    });

    if (existingDeck) {
      return NextResponse.json(
        { error: "A deck with this name already exists" },
        { status: 409 },
      );
    }

    // Generate unique file name
    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${session.user.id}/${uuidv4()}.${fileExtension}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: uniqueFileName,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
      Metadata: {
        originalName: file.name,
        uploadedBy: session.user.id,
      },
    });

    await s3Client.send(uploadCommand);

    // Generate file URL
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;

    // Save deck info to database
    const deck = await db.deck.create({
      data: {
        name,
        description: description || null,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      deck: {
        id: deck.id,
        name: deck.name,
        description: deck.description,
        fileName: deck.fileName,
        fileUrl: deck.fileUrl,
        fileSize: deck.fileSize,
        uploadedAt: deck.uploadedAt,
      },
    });
  } catch (error) {
    console.error("Error uploading deck:", error);
    return NextResponse.json(
      { error: "Failed to upload deck" },
      { status: 500 },
    );
  }
}
