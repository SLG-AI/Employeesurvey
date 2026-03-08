export const INDUSTRIES = [
  { code: "AGRI", label_fr: "Agriculture / Forêts / Pêche", label_en: "Agriculture / Forestry / Fishing" },
  { code: "MIN_ENE", label_fr: "Mines / Énergie", label_en: "Mining / Energy" },
  { code: "CONST", label_fr: "Construction / BTP", label_en: "Construction" },
  { code: "MANU", label_fr: "Industrie manufacturière", label_en: "Manufacturing" },
  { code: "WHOLE", label_fr: "Commerce de gros", label_en: "Wholesale Trade" },
  { code: "RETAIL", label_fr: "Commerce de détail", label_en: "Retail Trade" },
  { code: "TRANS_LOG", label_fr: "Transport / Logistique / Entreposage", label_en: "Transportation / Logistics / Warehousing" },
  { code: "INFO_MEDIA_TEL", label_fr: "Information / Médias / Télécoms", label_en: "Information / Media / Telecommunications" },
  { code: "TECH", label_fr: "Technologies / Services numériques", label_en: "Technology / Digital Services" },
  { code: "PRO_SERV", label_fr: "Services professionnels / Conseil", label_en: "Professional Services / Consulting" },
  { code: "FIN_INS_RE", label_fr: "Finance / Assurance / Immobilier", label_en: "Finance / Insurance / Real Estate" },
  { code: "PUB_NPO", label_fr: "Administration / Secteur public / Associations", label_en: "Public Sector / Government / Non‑profits" },
  { code: "EDU", label_fr: "Éducation / Formation", label_en: "Education / Training" },
  { code: "HEALTH_SOC", label_fr: "Santé / Social", label_en: "Health / Social Care" },
  { code: "HOSP_TOUR", label_fr: "Hôtellerie / Restauration / Tourisme", label_en: "Hospitality / Food Service / Tourism" },
  { code: "ART_CULT_SPORT", label_fr: "Arts / Culture / Sports / Divertissement", label_en: "Arts / Culture / Sports / Entertainment" },
  { code: "BIZ_FAC_ENV", label_fr: "Services aux entreprises / Facility / Environnement", label_en: "Business Support / Facilities / Environment" },
  { code: "OTHER_SERV", label_fr: "Autres services", label_en: "Other Services" },
] as const;

export type IndustryCode = (typeof INDUSTRIES)[number]["code"];
