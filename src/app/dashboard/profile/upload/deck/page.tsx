"use client";

import React, { useState } from "react";
import { useNotifications } from "@/lib/notifications/NotificationContext";
import type { NotificationType } from "@/types/notifications";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CheckCircle, AlertCircle, Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";
import BackButton from "@/components/ui/back-button";

const deckSchema = z.object({
  name: z
    .string()
    .min(1, "Deck name is required")
    .max(50, "Deck name must be 50 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  file: z
    .instanceof(File)
    .refine(
      (file) => file.name.toLowerCase().endsWith(".ydk"),
      "File must be a .ydk file",
    ),
});

type DeckFormData = z.infer<typeof deckSchema>;

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}

export default function DeckUploadPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
  });

  const form = useForm<DeckFormData>({
    resolver: zodResolver(deckSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: DeckFormData) => {
    if (!session) {
      setUploadState((prev) => ({
        ...prev,
        error: "You must be logged in to upload decks",
      }));
      return;
    }

    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      success: false,
    });

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.description) {
        formData.append("description", data.description);
      }
      formData.append("file", data.file);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 200);

      const response = await fetch("/api/decks/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setUploadState({
        isUploading: false,
        progress: 100,
        error: null,
        success: true,
      });

      addNotification({
        type: "DECK_CREATED" as NotificationType,
        message: `Deck "${data.name}" has been uploaded successfully!`,
      });

      // Reset form
      form.reset();
      setSelectedFile(null);

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/dashboard/profile");
      }, 2000);
    } catch (error) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : "Upload failed",
        success: false,
      });
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    form.setValue("file", file, { shouldValidate: true });
    setUploadState((prev) => ({ ...prev, error: null }));
  };

  const handleFileClear = () => {
    setSelectedFile(null);
    form.setValue("file", undefined as any);
  };

  if (!session) {
    return (
      <div className="container mx-auto py-8">
        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You must be logged in to upload Yu-Gi-Oh decks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <BackButton />
          </Button>
          <div className="text-center">
            <h1 className="mb-2 text-3xl font-bold">Upload Yu-Gi-Oh Deck</h1>
            <p className="text-muted-foreground">
              Upload your .ydk file and add details about your deck
            </p>
          </div>
        </div>

        {/* Success Message */}
        {uploadState.success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Deck uploaded successfully! Redirecting to your profile...
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {uploadState.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadState.error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Deck Details
            </CardTitle>
            <CardDescription>
              Provide information about your Yu-Gi-Oh deck and upload the .ydk
              file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Deck Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deck Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter a unique name for your deck"
                          {...field}
                          disabled={uploadState.isUploading}
                        />
                      </FormControl>
                      <FormDescription>
                        Choose a unique name for your deck (must be unique to
                        your account)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your deck strategy, key cards, or any notes..."
                          className="resize-none"
                          {...field}
                          disabled={uploadState.isUploading}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description of your deck (max 500 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* File Upload */}
                <FormField
                  control={form.control}
                  name="file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deck File *</FormLabel>
                      <FormControl>
                        <FileUpload
                          onFileSelect={handleFileSelect}
                          onClear={handleFileClear}
                          accept=".ydk"
                          maxSize={5 * 1024 * 1024} // 5MB
                          value={selectedFile}
                          disabled={uploadState.isUploading}
                        />
                      </FormControl>
                      <FormDescription>
                        Upload your .ydk file (max 5MB). You can drag and drop
                        or click to browse.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Progress Bar */}
                {uploadState.isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadState.progress}%</span>
                    </div>
                    <Progress value={uploadState.progress} />
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={uploadState.isUploading || !selectedFile}
                >
                  {uploadState.isUploading ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Deck
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">About .ydk Files</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            <p className="mb-2">
              .ydk files are Yu-Gi-Oh deck files that contain your deck
              composition. These files can be exported from popular deck
              building applications like:
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>YGOPro</li>
              <li>Dueling Book</li>
              <li>Yu-Gi-Oh! Master Duel (via third-party tools)</li>
              <li>EDOPro</li>
            </ul>
            <p className="mt-2">
              The file should contain your main deck, extra deck, and side deck
              card IDs.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
