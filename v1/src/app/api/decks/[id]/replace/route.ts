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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deck = await db.deck.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  });

  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".ydk")) {
    return NextResponse.json(
      { error: "File must be a .ydk file" },
      { status: 400 },
    );
  }

  // Generate new unique file name
  const fileExtension = file.name.split(".").pop();
  const uniqueFileName = `${session.user.id}/${uuidv4()}.${fileExtension}`;

  const buffer = Buffer.from(await file.arrayBuffer());

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

  const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;

  const updated = await db.deck.update({
    where: { id: deck.id },
    data: {
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      uploadedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, deck: updated });
}
