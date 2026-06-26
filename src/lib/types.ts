export type Onboarding = {
  id: string;
  tenant_id: string;
  slug: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  job_title: string;
  start_date: string | null;
  state: Record<string, unknown>;
  content: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "likert"
  | "likert_5"
  | "free_text";

// "Consigne" applied to Likert scales: which anchor labels frame the 1..N scale.
export type ScaleVariant =
  | "agreement"
  | "satisfaction"
  | "frequency"
  | "importance"
  | "custom";

// Preset anchor sets. `labelFr` is the admin-facing name shown in the editor;
// `minKey`/`maxKey` are i18n keys resolved per respondent language (see languages.ts).
export const LIKERT_SCALE_VARIANTS: Record<
  Exclude<ScaleVariant, "custom">,
  { labelFr: string; minKey: string; maxKey: string }
> = {
  agreement: {
    labelFr: "Accord",
    minKey: "strongly_disagree",
    maxKey: "strongly_agree",
  },
  satisfaction: {
    labelFr: "Satisfaction",
    minKey: "scale_satisfaction_min",
    maxKey: "scale_satisfaction_max",
  },
  frequency: {
    labelFr: "Fréquence",
    minKey: "scale_frequency_min",
    maxKey: "scale_frequency_max",
  },
  importance: {
    labelFr: "Importance",
    minKey: "scale_importance_min",
    maxKey: "scale_importance_max",
  },
};

// Order used to render the "consigne" selector in the editor.
export const SCALE_VARIANT_ORDER: ScaleVariant[] = [
  "agreement",
  "satisfaction",
  "frequency",
  "importance",
  "custom",
];

export const SCALE_VARIANT_LABELS: Record<ScaleVariant, string> = {
  agreement: LIKERT_SCALE_VARIANTS.agreement.labelFr,
  satisfaction: LIKERT_SCALE_VARIANTS.satisfaction.labelFr,
  frequency: LIKERT_SCALE_VARIANTS.frequency.labelFr,
  importance: LIKERT_SCALE_VARIANTS.importance.labelFr,
  custom: "Personnalisé",
};

// Subset of question fields that carry the scale "consigne" configuration.
export type QuestionScaleConfig = {
  scale_variant?: ScaleVariant | null;
  scale_min_label_fr?: string | null;
  scale_min_label_en?: string | null;
  scale_max_label_fr?: string | null;
  scale_max_label_en?: string | null;
};

export type SurveyStatus = "draft" | "published" | "closed";

export type SurveyType = "classique" | "pulse";

export type DistributionMode = "token" | "open";

export const SELF_DECLARATION_FIELDS = [
  "sexe",
  "fonction",
  "lieu_travail",
  "type_contrat",
  "temps_travail",
  "cost_center",
  "direction",
  "departement",
  "service",
] as const;

export type SelfDeclarationField = (typeof SELF_DECLARATION_FIELDS)[number];

export const SELF_DECLARATION_LABELS: Record<SelfDeclarationField, string> = {
  sexe: "Sexe",
  fonction: "Fonction",
  lieu_travail: "Lieu de travail",
  type_contrat: "Type de contrat",
  temps_travail: "Temps de travail",
  cost_center: "Cost center",
  direction: "Direction",
  departement: "Département",
  service: "Service",
};

export type Survey = {
  id: string;
  title_fr: string;
  title_en: string | null;
  description_fr: string | null;
  description_en: string | null;
  introduction_fr: string | null;
  introduction_en: string | null;
  status: SurveyStatus;
  created_by: string;
  societe_id: string | null;
  wave_group_id: string | null;
  wave_number: number;
  published_at: string | null;
  closes_at: string | null;
  closed_at: string | null;
  created_at: string;
  survey_type: SurveyType;
  sample_percentage: number | null;
  filters: SurveyFilters;
  distribution_mode: DistributionMode;
  open_self_declaration_fields: SelfDeclarationField[];
  estimated_population: number | null;
};

export type SurveyFilters = {
  societe_ids?: string[];
  direction_ids?: string[];
  department_ids?: string[];
  service_ids?: string[];
  sexe?: string[];
  fonctions?: string[];
  lieux_travail?: string[];
  types_contrat?: string[];
  temps_travail?: string[];
  cost_centers?: string[];
  age_min?: number;
  age_max?: number;
  seniority_min?: number;
  seniority_max?: number;
};

export type SurveyToken = {
  id: string;
  survey_id: string;
  token_id: string;
  selected_by: "filter" | "sample";
  invitation_sent_at: string | null;
  teams_invitation_sent_at: string | null;
  reminder_sent_at: string | null;
  teams_reminder_sent_at: string | null;
  created_at: string;
};

export type SurveySection = {
  id: string;
  survey_id: string;
  title_fr: string;
  sort_order: number;
  created_at: string;
};

export type Question = {
  id: string;
  survey_id: string;
  section_id: string | null;
  type: QuestionType;
  text_fr: string;
  text_en: string | null;
  question_code: string | null;
  sort_order: number;
  required: boolean;
  created_at: string;
  question_options?: QuestionOption[];
} & QuestionScaleConfig;

export type QuestionOption = {
  id: string;
  question_id: string;
  text_fr: string;
  text_en: string | null;
  value: string | null;
  sort_order: number;
};

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_choice: "Choix unique",
  multiple_choice: "Choix multiple",
  likert: "Échelle de Likert (1-10)",
  likert_5: "Échelle de Likert (1-5)",
  free_text: "Texte libre",
};

export type AnonymousToken = {
  id: string;
  token: string;
  email: string | null;
  employee_name: string | null;
  societe_id: string | null;
  direction_id: string | null;
  department_id: string | null;
  service_id: string | null;
  invitation_sent_at: string | null;
  reminder_sent_at: string | null;
  created_at: string;
  sexe: string | null;
  date_naissance: string | null;
  date_entree: string | null;
  fonction: string | null;
  lieu_travail: string | null;
  type_contrat: string | null;
  temps_travail: string | null;
  cost_center: string | null;
};

export type OpenResponse = {
  id: string;
  survey_id: string;
  respondent_fingerprint: string;
  sexe: string | null;
  fonction: string | null;
  lieu_travail: string | null;
  type_contrat: string | null;
  temps_travail: string | null;
  cost_center: string | null;
  direction: string | null;
  departement: string | null;
  service: string | null;
  submitted_at: string;
};

export type EmailSendResult = {
  success: boolean;
  sent: number;
  failed: number;
  total: number;
  message?: string;
  errors: Array<{ email: string; error: string }>;
};
