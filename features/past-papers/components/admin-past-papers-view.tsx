"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

import { pastPapersSettingsSchema, type PastPapersSettingsFormValues } from "../schemas";
import {
  getAdminPastPapersSettings,
  removeAdminPastPapersSettings,
  saveAdminPastPapersSettings,
} from "../services/past-papers-service";

export function AdminPastPapersView() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savedUrl, setSavedUrl] = useState("");
  const [removing, setRemoving] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<PastPapersSettingsFormValues>({
    resolver: zodResolver(pastPapersSettingsSchema),
    defaultValues: {
      pastPapersDriveUrl: "",
    },
  });

  useEffect(() => {
    void getAdminPastPapersSettings()
      .then((result) => {
        setSavedUrl(result.settings.pastPapersDriveUrl);
        reset({ pastPapersDriveUrl: result.settings.pastPapersDriveUrl });
      })
      .catch((error) => {
        toast({
          title: "Could not load past papers settings",
          description: error instanceof Error ? error.message : "Try again in a moment.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [reset, toast]);

  async function onSubmit(values: PastPapersSettingsFormValues) {
    try {
      const result = await saveAdminPastPapersSettings(values);
      setSavedUrl(result.settings.pastPapersDriveUrl);
      reset({ pastPapersDriveUrl: result.settings.pastPapersDriveUrl });
      toast({
        title: "Past papers archive saved",
        description: "Students can now open the configured Google Drive folder.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    }
  }

  async function handleRemove() {
    setRemoving(true);

    try {
      const result = await removeAdminPastPapersSettings();
      setSavedUrl(result.settings.pastPapersDriveUrl);
      reset({ pastPapersDriveUrl: "" });
      toast({
        title: "Past papers archive removed",
        description: "Students will no longer see an active archive link.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Remove failed",
        description: error instanceof Error ? error.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-72 max-w-3xl" />;
  }

  return (
    <Card className="max-w-3xl shadow-soft">
      <CardHeader>
        <CardTitle>Google Drive Folder URL</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!savedUrl ? (
          <EmptyState
            title="No Google Drive archive has been configured yet."
            description="Save the teacher's Google Drive folder URL to publish it for students."
          />
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label htmlFor="pastPapersDriveUrl" className="text-sm font-medium text-foreground">
              Google Drive Folder URL
            </label>
            <Input
              id="pastPapersDriveUrl"
              placeholder="https://drive.google.com/drive/folders/..."
              disabled={isSubmitting || removing}
              {...register("pastPapersDriveUrl")}
            />
            {errors.pastPapersDriveUrl ? (
              <p className="text-sm text-destructive">{errors.pastPapersDriveUrl.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" disabled={isSubmitting || removing}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Saving
                </>
              ) : (
                "Save"
              )}
            </Button>
            <Button asChild type="button" variant="outline" disabled={!savedUrl}>
              <a href={savedUrl || "#"} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open Folder
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!savedUrl || isSubmitting || removing}
              onClick={() => void handleRemove()}
            >
              {removing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              )}
              Remove Link
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
