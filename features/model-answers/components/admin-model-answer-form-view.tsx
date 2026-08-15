"use client";

import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

import {
  createModelAnswer,
  updateModelAnswer,
} from "../services/model-answer-service";
import type { ModelAnswer, ModelAnswerPayload } from "../types";
import { ModelAnswerForm } from "./model-answer-form";

type AdminModelAnswerFormViewProps = {
  modelAnswer?: ModelAnswer;
};

export function AdminModelAnswerFormView({ modelAnswer }: AdminModelAnswerFormViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(values: ModelAnswerPayload) {
    if (modelAnswer) {
      await updateModelAnswer(modelAnswer.id, values);
      toast({
        title: "Key question updated",
        description: "Changes were saved.",
        variant: "success",
      });
    } else {
      await createModelAnswer(values);
      toast({
        title: "Key question created",
        description: "The record is ready for revision search.",
        variant: "success",
      });
    }

    router.push("/admin/model-answers");
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>{modelAnswer ? "Edit key question" : "Key question details"}</CardTitle>
      </CardHeader>
      <CardContent>
        <ModelAnswerForm
          defaultValue={modelAnswer}
          submitLabel={modelAnswer ? "Save changes" : "Create key question"}
          onSubmit={handleSubmit}
        />
      </CardContent>
    </Card>
  );
}
