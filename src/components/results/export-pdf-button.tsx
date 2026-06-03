"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type {
  PdfQuestionResult,
  PdfSection,
} from "@/lib/pdf/survey-results-pdf";

type ExportPdfButtonProps = {
  surveyTitle: string;
  totalResponses: number;
  appliedFilters: { label: string; value: string }[];
  sections: PdfSection[];
  questions: PdfQuestionResult[];
  disabled?: boolean;
};

function slugify(input: string): string {
  return (
    input
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "enquete"
  );
}

export function ExportPdfButton({
  surveyTitle,
  totalResponses,
  appliedFilters,
  sections,
  questions,
  disabled,
}: ExportPdfButtonProps) {
  const [generating, setGenerating] = useState(false);

  const handleExport = async () => {
    setGenerating(true);
    try {
      // Code-split: the PDF renderer (~heavy) loads only on demand.
      const [{ pdf }, { SurveyResultsPdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/survey-results-pdf"),
      ]);

      const exportedAt = new Date().toLocaleString("fr-FR", {
        dateStyle: "long",
        timeStyle: "short",
      });

      const blob = await pdf(
        <SurveyResultsPdf
          surveyTitle={surveyTitle}
          totalResponses={totalResponses}
          exportedAt={exportedAt}
          appliedFilters={appliedFilters}
          sections={sections}
          questions={questions}
        />
      ).toBlob();

      const datePart = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resultats-${slugify(surveyTitle)}-${datePart}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || generating}
    >
      {generating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Exporter PDF
    </Button>
  );
}
