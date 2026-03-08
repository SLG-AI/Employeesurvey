export const COMPANY_SIZES = [
  { code: "XS", label_fr: "Petite (1–49 salariés)", label_en: "Small (1–49 employees)" },
  { code: "S", label_fr: "Moyenne (50–249 salariés)", label_en: "Medium (50–249 employees)" },
  { code: "M", label_fr: "Grande (250–999 salariés)", label_en: "Large (250–999 employees)" },
  { code: "L", label_fr: "Très grande (1 000–4 999 salariés)", label_en: "Very large (1,000–4,999 employees)" },
  { code: "XL", label_fr: "Multinationale / Gros groupe (5 000+ salariés)", label_en: "Multinational / Large group (5,000+ employees)" },
] as const;

export type CompanySizeCode = (typeof COMPANY_SIZES)[number]["code"];
