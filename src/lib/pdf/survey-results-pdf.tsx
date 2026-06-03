/**
 * PDF document for survey results export.
 *
 * Rendered client-side via @react-pdf/renderer (vector output, serverless-safe).
 * Consumes the same aggregated shape the results page already holds in state, so
 * anonymity + filters are already enforced upstream by /api/surveys/[id]/results.
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { getScaleLabels } from "@/lib/utils/languages";
import type { ScaleVariant } from "@/lib/types";

// ── Shapes mirror the results page (kept local to avoid coupling) ──
export type PdfOptionResult = {
  id: string;
  text_fr: string;
  count: number;
  percentage: number;
};

export type PdfQuestionResult = {
  id: string;
  type: string;
  text_fr: string;
  sort_order: number;
  section_id: string | null;
  scale_variant?: ScaleVariant | null;
  scale_min_label_fr?: string | null;
  scale_min_label_en?: string | null;
  scale_max_label_fr?: string | null;
  scale_max_label_en?: string | null;
  options?: PdfOptionResult[];
  totalAnswers?: number;
  average?: number;
  distribution?: { value: number; count: number }[];
  responses?: string[];
};

export type PdfSection = { id: string; title_fr: string; sort_order: number };

export type SurveyResultsPdfProps = {
  surveyTitle: string;
  totalResponses: number;
  exportedAt: string; // pre-formatted date string (no Date.now in this module)
  appliedFilters: { label: string; value: string }[];
  sections: PdfSection[];
  questions: PdfQuestionResult[];
};

const BRAND = "#2563eb";
const INK = "#0f172a";
const MUTED = "#64748b";
const LINE = "#e2e8f0";
const SOFT = "#f1f5f9";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontSize: 10,
    color: INK,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  // Cover
  coverBand: {
    backgroundColor: BRAND,
    borderRadius: 6,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  coverBrand: {
    color: "#ffffff",
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    marginBottom: 6,
  },
  coverKicker: { color: "#dbeafe", fontSize: 10 },
  coverTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
  },
  metaRow: { flexDirection: "row", marginBottom: 4 },
  metaLabel: { width: 130, color: MUTED },
  metaValue: { flex: 1, fontFamily: "Helvetica-Bold" },
  filtersBox: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 6,
    padding: 14,
    backgroundColor: SOFT,
  },
  filtersTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: INK,
  },
  // Sections
  sectionHeader: {
    borderLeftWidth: 3,
    borderLeftColor: BRAND,
    backgroundColor: SOFT,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionHeaderText: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  // Question card
  card: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 6,
    padding: 14,
    marginBottom: 14,
  },
  badgeRow: { flexDirection: "row", marginBottom: 6 },
  badge: {
    fontSize: 8,
    color: BRAND,
    borderWidth: 1,
    borderColor: BRAND,
    borderRadius: 3,
    paddingVertical: 1,
    paddingHorizontal: 5,
    marginRight: 6,
  },
  badgeMuted: {
    fontSize: 8,
    color: MUTED,
    backgroundColor: SOFT,
    borderRadius: 3,
    paddingVertical: 1,
    paddingHorizontal: 5,
  },
  qTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  qMeta: { fontSize: 9, color: MUTED, marginBottom: 10 },
  // Bars
  barRow: { marginBottom: 7 },
  barLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  barLabel: { flex: 1, fontSize: 9, paddingRight: 8 },
  barValue: { fontSize: 9, color: MUTED },
  barTrack: {
    height: 8,
    backgroundColor: SOFT,
    borderRadius: 4,
    width: "100%",
  },
  barFill: { height: 8, backgroundColor: BRAND, borderRadius: 4 },
  // Likert average
  avgWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    marginBottom: 4,
  },
  avgValue: { fontSize: 26, fontFamily: "Helvetica-Bold", color: BRAND },
  avgMax: { fontSize: 12, color: MUTED, marginLeft: 2, marginBottom: 4 },
  scaleHint: {
    fontSize: 8,
    color: MUTED,
    textAlign: "center",
    marginBottom: 10,
  },
  // Verbatims
  verbatim: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 4,
    backgroundColor: SOFT,
    padding: 8,
    marginBottom: 6,
    fontSize: 9,
  },
  emptyText: { fontSize: 9, color: MUTED, fontStyle: "italic" },
  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: MUTED,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 6,
  },
});

const QUESTION_TYPE_LABEL: Record<string, string> = {
  // The results API collapses single/multiple choice into type "choices",
  // so we map that too (plus the raw types, defensively).
  choices: "Choix",
  single_choice: "Choix unique",
  multiple_choice: "Choix multiple",
  likert: "Likert (1-10)",
  likert_5: "Likert (1-5)",
  free_text: "Texte libre",
};

const isChoice = (type: string) =>
  type === "choices" ||
  type === "single_choice" ||
  type === "multiple_choice";

function HorizontalBar({
  label,
  count,
  percentage,
  ratio,
}: {
  label: string;
  count: number;
  percentage?: number;
  ratio: number; // 0..1 fill of the track
}) {
  const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  return (
    <View style={styles.barRow} wrap={false}>
      <View style={styles.barLabelRow}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>
          {count} rép.{percentage != null ? ` · ${percentage}%` : ""}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

function QuestionBlock({
  q,
  index,
}: {
  q: PdfQuestionResult;
  index: number;
}) {
  return (
    // The card is allowed to break across pages (no wrap={false}): a long list
    // of verbatims must flow onto the next page rather than being clipped.
    <View style={styles.card}>
      {/* Keep the question header (badges + title + count) together. */}
      <View wrap={false}>
        <View style={styles.badgeRow}>
          <Text style={styles.badge}>Q{index + 1}</Text>
          <Text style={styles.badgeMuted}>
            {QUESTION_TYPE_LABEL[q.type] ?? q.type}
          </Text>
        </View>
        <Text style={styles.qTitle}>{q.text_fr}</Text>
        <Text style={styles.qMeta}>{q.totalAnswers ?? 0} réponse(s)</Text>
      </View>

      {isChoice(q.type) &&
        q.options &&
        (() => {
          const maxCount = Math.max(1, ...q.options.map((o) => o.count));
          return q.options.map((o) => (
            <HorizontalBar
              key={o.id}
              label={o.text_fr}
              count={o.count}
              percentage={o.percentage}
              ratio={o.count / maxCount}
            />
          ));
        })()}

      {(q.type === "likert" || q.type === "likert_5") &&
        q.distribution &&
        (() => {
          const scaleMax = q.type === "likert_5" ? 5 : 10;
          const labels = getScaleLabels("fr", q);
          const maxCount = Math.max(1, ...q.distribution.map((d) => d.count));
          return (
            <View>
              <View style={styles.avgWrap}>
                <Text style={styles.avgValue}>{q.average ?? 0}</Text>
                <Text style={styles.avgMax}>/{scaleMax}</Text>
              </View>
              <Text style={styles.scaleHint}>
                Échelle de 1 ({labels.min}) à {scaleMax} ({labels.max})
              </Text>
              {q.distribution.map((d) => (
                <HorizontalBar
                  key={d.value}
                  label={`Note ${d.value}`}
                  count={d.count}
                  ratio={d.count / maxCount}
                />
              ))}
            </View>
          );
        })()}

      {q.type === "free_text" &&
        (q.responses && q.responses.length > 0 ? (
          q.responses.map((text, j) => (
            <View key={j} wrap={false}>
              <Text style={styles.verbatim}>{text}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Aucune réponse textuelle.</Text>
        ))}
    </View>
  );
}

export function SurveyResultsPdf({
  surveyTitle,
  totalResponses,
  exportedAt,
  appliedFilters,
  sections,
  questions,
}: SurveyResultsPdfProps) {
  return (
    <Document title={`Résultats - ${surveyTitle}`} author="PulseSurvey">
      <Page size="A4" style={styles.page}>
        {/* Cover */}
        <View style={styles.coverBand}>
          <Text style={styles.coverBrand}>PULSESURVEY</Text>
          <Text style={styles.coverKicker}>Rapport de résultats d&apos;enquête</Text>
          <Text style={styles.coverTitle}>{surveyTitle}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Date d&apos;export</Text>
          <Text style={styles.metaValue}>{exportedAt}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Réponses incluses</Text>
          <Text style={styles.metaValue}>{totalResponses}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Questions</Text>
          <Text style={styles.metaValue}>{questions.length}</Text>
        </View>

        <View style={styles.filtersBox}>
          <Text style={styles.filtersTitle}>Filtres appliqués</Text>
          {appliedFilters.length === 0 ? (
            <Text style={styles.emptyText}>
              Aucun filtre — l&apos;ensemble des réponses est inclus.
            </Text>
          ) : (
            appliedFilters.map((f, i) => (
              <View key={i} style={styles.metaRow}>
                <Text style={styles.metaLabel}>{f.label}</Text>
                <Text style={styles.metaValue}>{f.value}</Text>
              </View>
            ))
          )}
        </View>

        {/* Questions, grouped by section */}
        {questions.map((q, i) => {
          const prevSectionId = i > 0 ? questions[i - 1].section_id : null;
          const showSection = q.section_id && q.section_id !== prevSectionId;
          const sectionTitle = showSection
            ? sections.find((s) => s.id === q.section_id)?.title_fr
            : null;
          return (
            <View key={q.id}>
              {sectionTitle && (
                <View style={styles.sectionHeader} wrap={false}>
                  <Text style={styles.sectionHeaderText}>{sectionTitle}</Text>
                </View>
              )}
              <QuestionBlock q={q} index={i} />
            </View>
          );
        })}

        <View style={styles.footer} fixed>
          <Text>PulseSurvey · Document confidentiel</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
