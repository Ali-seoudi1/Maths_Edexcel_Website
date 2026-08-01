import type { Metadata } from "next";

import { ModelAnswerSearchView } from "@/features/model-answers/components/model-answer-search-view";

export const metadata: Metadata = {
  title: "Model Answers",
  description: "Search published Edexcel Mathematics model answers.",
};

export default function ModelAnswersPage() {
  return <ModelAnswerSearchView />;
}
