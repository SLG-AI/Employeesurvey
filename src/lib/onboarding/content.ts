// Canonical model for the onboarding checklist questions.
//
// The 5 phases, the cards and the section labels live in the static shell
// (template.ts). Only the check-items inside each card are editable per
// onboarding — they are stored in the `content` JSONB column, keyed by card id.

export type ItemOwner = "rh" | "n1" | "manager" | "it";

export type ChecklistItem = {
  id: string;
  fr: string;
  en: string;
  owner: ItemOwner;
};

// Keyed by card id ("0-0" .. "4-2"); value = ordered list of items.
export type OnboardingContent = Record<string, ChecklistItem[]>;

export const CARD_IDS = [
  "0-0",
  "0-1",
  "1-0",
  "1-1",
  "2-0",
  "2-1",
  "2-2",
  "2-3",
  "3-0",
  "3-1",
  "4-0",
  "4-1",
  "4-2",
] as const;

export type CardId = (typeof CARD_IDS)[number];

// Display labels for the owner tag, mirroring the original template.
export const OWNER_LABELS: Record<ItemOwner, { fr: string; en: string }> = {
  rh: { fr: "RH", en: "HR" },
  n1: { fr: "N+1", en: "N+1" },
  manager: { fr: "Manager", en: "Manager" },
  it: { fr: "IT", en: "IT" },
};

export const OWNER_OPTIONS: ItemOwner[] = ["rh", "n1", "manager", "it"];

// Fixed metadata for each card — phase index, section label and card title
// (FR/EN). Transcribed from the section-label / card-title spans in template.ts.
// Used by the editor to group and label cards; NOT part of per-onboarding data.
export const PHASE_LABELS: Record<number, { fr: string; en: string }> = {
  0: { fr: "Avant J+1", en: "Before Day 1" },
  1: { fr: "Semaine 1", en: "Week 1" },
  2: { fr: "Fondation J0–30", en: "Foundation D0–30" },
  3: { fr: "Leadership J30–60", en: "Leadership D30–60" },
  4: { fr: "Ownership J60–90", en: "Ownership D60–90" },
};

export const CARD_META: Record<
  string,
  {
    phase: number;
    sectionFr: string;
    sectionEn: string;
    titleFr: string;
    titleEn: string;
  }
> = {
  "0-0": {
    phase: 0,
    sectionFr: "Administratif & accès",
    sectionEn: "Administrative & access",
    titleFr: "Documents & contrat",
    titleEn: "Documents & contract",
  },
  "0-1": {
    phase: 0,
    sectionFr: "Coordination N+1 & équipe",
    sectionEn: "N+1 & team coordination",
    titleFr: "Préparation de l'accueil",
    titleEn: "Welcome preparation",
  },
  "1-0": {
    phase: 1,
    sectionFr: "Immersion organisation & terrain",
    sectionEn: "Organisation & field immersion",
    titleFr: "Découverte & immersion terrain",
    titleEn: "Discovery & field immersion",
  },
  "1-1": {
    phase: 1,
    sectionFr: "Clarification du rôle & des attentes",
    sectionEn: "Role & expectations clarification",
    titleFr: "Périmètre & marges de manœuvre",
    titleEn: "Scope & decision authority",
  },
  "2-0": {
    phase: 2,
    sectionFr: "Passation & prise en main opérationnelle",
    sectionEn: "Handover & operational onboarding",
    titleFr: "Passation & immersion active",
    titleEn: "Active handover & immersion",
  },
  "2-1": {
    phase: 2,
    sectionFr: "Diagnostic équipe & activité",
    sectionEn: "Team & activity diagnosis",
    titleFr: "Analyse & diagnostic",
    titleEn: "Analysis & diagnosis",
  },
  "2-2": {
    phase: 2,
    sectionFr: "Réseau interne",
    sectionEn: "Internal network",
    titleFr: "Réseau & parties prenantes",
    titleEn: "Network & stakeholders",
  },
  "2-3": {
    phase: 2,
    sectionFr: "Livrables J+30",
    sectionEn: "D+30 deliverables",
    titleFr: "Livrables & décisions J+30",
    titleEn: "D+30 deliverables & decisions",
  },
  "3-0": {
    phase: 3,
    sectionFr: "Montée en autonomie managériale",
    sectionEn: "Building managerial autonomy",
    titleFr: "Autonomie & décisions managériales",
    titleEn: "Autonomy & managerial decisions",
  },
  "3-1": {
    phase: 3,
    sectionFr: "Point de mi-parcours",
    sectionEn: "Mid-point review",
    titleFr: "Checkpoint J+60",
    titleEn: "D+60 Checkpoint",
  },
  "4-0": {
    phase: 4,
    sectionFr: "Autonomie opérationnelle",
    sectionEn: "Operational autonomy",
    titleFr: "Exécution autonome & amélioration",
    titleEn: "Autonomous execution & improvement",
  },
  "4-1": {
    phase: 4,
    sectionFr: "Équipe & développement",
    sectionEn: "Team & development",
    titleFr: "Équipe & plan de développement",
    titleEn: "Team & development plan",
  },
  "4-2": {
    phase: 4,
    sectionFr: "Bilan J+90 & suite",
    sectionEn: "D+90 review & next steps",
    titleFr: "Revue formelle J+90",
    titleEn: "Formal D+90 Review",
  },
};

export const DEFAULT_CONTENT: OnboardingContent = {
  "0-0": [
    { id: "0-0-1", owner: "rh", fr: "Contrat de travail signé et remis", en: "Employment contract signed and handed over" },
    { id: "0-0-2", owner: "rh", fr: "Dossier administratif complet (RIB, domicile, diplômes)", en: "Complete administrative file (bank details, address, diplomas)" },
    { id: "0-0-3", owner: "rh", fr: "Visite médicale planifiée (médecine du travail)", en: "Occupational health check scheduled" },
    { id: "0-0-4", owner: "it", fr: "Accès informatiques créés (AD, messagerie, outils métier)", en: "IT access created (AD, email, business tools)" },
    { id: "0-0-5", owner: "rh", fr: "Badge d'accès et poste de travail attribués", en: "Access badge and keys assigned" },
    { id: "0-0-6", owner: "n1", fr: "Ticket créé pour les accès IT", en: "Ticket created for IT access" },
    { id: "0-0-7", owner: "n1", fr: "Accès à tous les groupes, réunions, fichiers et outils pertinents", en: "Access to all relevant groups, meetings, files and tools" },
    { id: "0-0-8", owner: "it", fr: "Matériel informatique (laptop, téléphone) et poste configurés sur site pour le premier jour", en: "Hardware (laptop, phone) and workstation set up on site for first day" },
  ],
  "0-1": [
    { id: "0-1-1", owner: "n1", fr: "Annonce officielle de l'arrivée transmise à l'équipe", en: "Official announcement of arrival sent to the team" },
    { id: "0-1-2", owner: "n1", fr: "Programme des 3 premiers jours préparé et partagé", en: "First 3-day programme prepared and shared" },
    { id: "0-1-3", owner: "n1", fr: "Mentor / référent interne identifié et briefé (avec support RH)", en: "Internal mentor / buddy identified and briefed, with support of HR" },
    { id: "0-1-4", owner: "n1", fr: "Premier 1-to-1 N+1 planifié dans les 48h suivant l'arrivée", en: "First 1-to-1 with N+1 scheduled within 48h of arrival" },
    { id: "0-1-5", owner: "n1", fr: "Déjeuner de bienvenue le Jour 1 planifié avec le N+1", en: "Welcome lunch on Day 1 scheduled with N+1" },
    { id: "0-1-6", owner: "n1", fr: "Guide d'intégration prêt à être partagé en semaine 1", en: "Onboarding guide ready to be shared in week 1" },
    { id: "0-1-7", owner: "n1", fr: "Compte Perdoo créé et accès configuré pour le nouveau manager", en: "Perdoo account created and access configured for the new manager" },
  ],
  "1-0": [
    { id: "1-0-1", owner: "rh", fr: "Session de bienvenue RH (valeurs, règlement intérieur, avantages)", en: "HR welcome session (values, internal rules, benefits)" },
    { id: "1-0-2", owner: "manager", fr: "Visite des sites et dépôts opérationnels SLG", en: "Visit to SLG operational sites and depots" },
    { id: "1-0-3", owner: "rh", fr: "Accès aux documents clés remis (organigramme, procédures, KPIs)", en: "Key documents provided (org chart, procedures, KPIs)" },
    { id: "1-0-4", owner: "n1", fr: "Présentation formelle à l'équipe (réunion dédiée, pas improvisée)", en: "Formal introduction to the team (dedicated meeting, not improvised)" },
    { id: "1-0-5", owner: "manager", fr: "Premier contact individuel amorcé avec chaque membre de l'équipe", en: "First individual contact initiated with each team member" },
    { id: "1-0-6", owner: "manager", fr: "Cartographie initiale des parties prenantes clés réalisée", en: "Initial key stakeholder mapping completed" },
    { id: "1-0-7", owner: "n1", fr: "Documents clés pour la compréhension du business fournis", en: "Key documents for business relevance provided" },
    { id: "1-0-8", owner: "manager", fr: "Introductions aux parties prenantes internes clés effectuées", en: "Key internal stakeholder introductions completed" },
    { id: "1-0-9", owner: "manager", fr: "Réunions hebdomadaires de passation avec le prédécesseur planifiées pour les 60 premiers jours", en: "Set up weekly handover meetings with predecessor for the first 60 days" },
  ],
  "1-1": [
    { id: "1-1-1", owner: "n1", fr: "Objectifs à 30 / 60 / 90 jours formalisés avec le N+1", en: "30 / 60 / 90-day objectives formalised with N+1" },
    { id: "1-1-2", owner: "n1", fr: "Délégations décisionnelles clarifiées (budget, recrutement, gestion RH)", en: "Decision authority clarified (budget, recruitment, HR management)" },
    { id: "1-1-3", owner: "manager", fr: "Processus de reporting et cadence de réunions discutés avec le N+1", en: "Reporting process and meeting cadence discussed with N+1" },
  ],
  "2-0": [
    { id: "2-0-1", owner: "manager", fr: "Passation structurée avec le prédécesseur ou l'expert métier (processus, outils, fichiers, flux inter-équipes) — chaque domaine validé par une production autonome", en: "Structured handover with predecessor or subject-matter expert (processes, tools, files, inter-team flows) — each area validated by an independent output" },
    { id: "2-0-2", owner: "manager", fr: "Co-exécution supervisée d'un cycle opérationnel complet (shadow puis exécution accompagnée) avant prise d'autonomie", en: "Supervised co-execution of a complete operational cycle (shadow then supported execution) before taking full ownership" },
    { id: "2-0-3", owner: "manager", fr: "1-to-1 structurés avec chaque rapport direct (template : rôle, forces, difficultés, attentes, relation équipe)", en: "Structured 1-to-1 with each direct report (template: role, strengths, challenges, expectations, team dynamics)" },
    { id: "2-0-4", owner: "manager", fr: "Rencontres formelles avec les parties prenantes internes (pairs, fonctions support) et externes stratégiques", en: "Formal meetings with internal (peers, support functions) and key external stakeholders" },
  ],
  "2-1": [
    { id: "2-1-1", owner: "manager", fr: "Analyse des résultats et KPIs des 12 derniers mois réalisée", en: "Analysis of last 12 months' results and KPIs completed" },
    { id: "2-1-2", owner: "manager", fr: "Compréhension des tensions ou conflits existants dans l'équipe", en: "Understanding of existing tensions or conflicts within the team" },
    { id: "2-1-3", owner: "manager", fr: "Identification des hauts potentiels et des profils fragilisés", en: "Identification of high-potential profiles and at-risk employees" },
    { id: "2-1-4", owner: "manager", fr: "Connaissance terrain acquise — immersion opérationnelle au dépôt ou sur le terrain", en: "Field knowledge acquired — operational immersion at depot or on the ground" },
    { id: "2-1-5", owner: "rh", fr: "Session de suivi avec le mentor / référent interne effectuée", en: "Follow-up session with internal mentor / buddy completed" },
  ],
  "2-2": [
    { id: "2-2-1", owner: "manager", fr: "Rencontres formelles effectuées avec tous les managers pairs", en: "Formal meetings completed with all peer managers" },
    { id: "2-2-2", owner: "manager", fr: "Relations établies avec les fonctions support (RH, Finance, IT, Exploitation)", en: "Relationships established with support functions (HR, Finance, IT, Operations)" },
  ],
  "2-3": [
    { id: "2-3-1", owner: "manager", fr: "Livrable diagnostic remis au N+1 : analyse initiale de l'équipe (garder / développer / remplacer — hypothèse), risques opérationnels majeurs perçus, premières observations sur outils et processus clés", en: "Diagnostic deliverable submitted to N+1: initial team assessment (keep / develop / replace — hypothesis), top perceived operational risks, first observations on key tools and processes" },
    { id: "2-3-2", owner: "manager", fr: "Décision sur la fréquence et planification des réunions d'équipe arrêtée et communiquée", en: "Decision on team meeting frequency and schedule made and communicated" },
    { id: "2-3-3", owner: "rh", fr: "Bilan intermédiaire J+30 réalisé avec RH et N+1 — baselines et objectifs ajustés si nécessaire", en: "D+30 interim review completed with HR and N+1 — baselines and objectives adjusted if needed" },
    { id: "2-3-4", owner: "n1", fr: "Exécution d'un appel d'offres complet (sous supervision)", en: "Execution of 1 tender (supervised)" },
    { id: "2-3-5", owner: "n1", fr: "Compréhension des besoins CRM et première ébauche des exigences", en: "CRM understanding of needs and requirement draft" },
  ],
  "3-0": [
    { id: "3-0-1", owner: "manager", fr: "Le nouveau manager pilote la fonction de manière quasi autonome — le soutien du prédécesseur est réduit au minimum et ne se substitue plus à la décision", en: "The new manager leads the function almost independently — predecessor support is minimal and no longer substitutes for decision-making" },
    { id: "3-0-2", owner: "rh", fr: "Finalisation des décisions individuelles sur l'équipe et alignement avec le HRBP (garder, développer, remplacer — engagement écrit)", en: "Individual team decisions finalised and aligned with HRBP (keep, develop, replace — written commitment)" },
    { id: "3-0-3", owner: "manager", fr: "Appropriation des objectifs de la fonction — déclinaison en OKRs d'équipe et communication lors d'une réunion stratégique dédiée", en: "Full ownership of function objectives — broken down into team OKRs and communicated in a dedicated strategy meeting" },
  ],
  "3-1": [
    { id: "3-1-1", owner: "rh", fr: "Bilan J+60 réalisé avec RH et N+1 : validation de l'autonomie acquise, identification des ajustements nécessaires", en: "D+60 review completed with HR and N+1: validation of autonomy acquired, identification of necessary adjustments" },
    { id: "3-1-2", owner: "manager", fr: "Rituels managériaux en place et tenus à plus de 90% (réunions, 1-to-1, points de reporting)", en: "Management rituals in place and held at more than 90% adherence rate (meetings, 1-to-1s, reporting sessions)" },
    { id: "3-1-3", owner: "n1", fr: "Checkpoint officiel J+60 réalisé avec le N+1", en: "Official D+60 Checkpoint completed with N+1" },
  ],
  "4-0": [
    { id: "4-0-1", owner: "manager", fr: "Ownership complet des workflows administratifs et de la coordination des réclamations — sans dépendance au prédécesseur", en: "Full ownership of administrative workflows and claims coordination — no dependency on predecessor" },
    { id: "4-0-2", owner: "manager", fr: "Livraison autonome d'un livrable ou d'un cycle opérationnel majeur, accepté par le N+1 sans retravail significatif", en: "Autonomous delivery of a major operational deliverable or cycle, accepted by N+1 without significant rework" },
    { id: "4-0-3", owner: "manager", fr: "Identification des premières actions d'automatisation et optimisation des workflows pour déploiement au trimestre suivant", en: "Identification of first automation and workflow optimisation actions for deployment in the next quarter" },
    { id: "4-0-4", owner: "manager", fr: "Pilotage des interfaces transversales inter-fonctions (planification, escalade, arbitrages, comptes rendus)", en: "Management of cross-functional interfaces (planning, escalation, arbitration, reporting)" },
    { id: "4-0-5", owner: "manager", fr: "Premières améliorations de processus formalisées et soumises à validation du N+1 (réduction d'effort, réduction de risque d'erreur)", en: "First process improvements formalised and submitted for N+1 validation (effort reduction, error risk reduction)" },
    { id: "4-0-6", owner: "n1", fr: "Plan d'implémentation CRM présenté au N+1", en: "Present the CRM implementation plan to N+1" },
    { id: "4-0-7", owner: "n1", fr: "Processus appel d'offres opérationnel de A à Z", en: "Tender process operational from A to Z" },
  ],
  "4-1": [
    { id: "4-1-1", owner: "rh", fr: "Exécution du plan de formation lancée — actions en cours, processus de recrutement ou de remplacement initiés si nécessaire", en: "Training plan execution launched — actions underway, recruitment or replacement processes initiated as needed" },
    { id: "4-1-2", owner: "manager", fr: "Priorités d'action du semestre suivant définies (3 priorités) et partagées avec le N+1", en: "Action priorities for the next semester defined (3 priorities) and shared with N+1" },
    { id: "4-1-3", owner: "manager", fr: "Entretiens individuels réguliers instaurés avec chaque membre de l'équipe", en: "Regular individual reviews established with each team member" },
    { id: "4-1-4", owner: "manager", fr: "Rituels d'équipe consolidés et réguliers (point hebdo, rétrospective, partage de résultats)", en: "Team rituals consolidated and regular (weekly check-in, retrospective, results sharing)" },
    { id: "4-1-5", owner: "rh", fr: "Besoins de formation et de développement identifiés et remontés aux RH", en: "Training and development needs identified and reported to HR" },
  ],
  "4-2": [
    { id: "4-2-1", owner: "rh", fr: "Point structuré J+90 planifié et réalisé — inclut un premier feedback 360° (équipe, pairs, N+1)", en: "Structured D+90 review planned and completed — includes first 360° feedback (team, peers, N+1)" },
    { id: "4-2-2", owner: "manager", fr: "Posture managériale stabilisée — légitimité perçue et reconnue par l'équipe et les pairs", en: "Management posture established — authority perceived and recognised by the team and peers" },
    { id: "4-2-3", owner: "rh", fr: "Besoin de coaching ou de co-développement évalué avec les RH", en: "Coaching or co-development needs assessed with HR" },
    { id: "4-2-4", owner: "rh", fr: "Objectifs annuels posés et saisis dans l'outil de gestion de la performance", en: "Annual objectives set and entered in the performance management tool" },
  ],
};

// True when stored content is empty / missing — caller should fall back to
// DEFAULT_CONTENT (D1 strategy: no DB backfill).
export function isEmptyContent(content: unknown): boolean {
  return (
    !content ||
    typeof content !== "object" ||
    Object.keys(content as object).length === 0
  );
}

export function contentOrDefault(content: unknown): OnboardingContent {
  return isEmptyContent(content)
    ? DEFAULT_CONTENT
    : (content as OnboardingContent);
}

// ---- HTML rendering -------------------------------------------------------

// Escape for use in both attribute values (double-quoted) and text nodes.
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const CHECKBOX_HTML =
  '<div class="checkbox"><svg class="checkmark" width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';

export function buildItemHtml(it: ChecklistItem): string {
  const owner = OWNER_LABELS[it.owner] ? it.owner : "rh";
  const label = OWNER_LABELS[owner];
  const fr = esc(it.fr);
  const en = esc(it.en);
  return (
    `<div class="check-item" data-item-id="${esc(it.id)}">` +
    CHECKBOX_HTML +
    `<span class="check-text" data-fr="${fr}" data-en="${en}">${fr}</span>` +
    `<span class="tag tag-${owner}" data-fr="${esc(label.fr)}" data-en="${esc(
      label.en
    )}">${esc(label.fr)}</span>` +
    `</div>`
  );
}

// Replace each `<!--ITEMS:x-y-->` token in the shell with the rendered items
// for that card. Cards absent from `content` render empty.
export function buildGuideHtml(
  shell: string,
  content: OnboardingContent
): string {
  let html = shell;
  for (const cardId of CARD_IDS) {
    const items = (content[cardId] ?? []).map(buildItemHtml).join("");
    html = html.replace(`<!--ITEMS:${cardId}-->`, items);
  }
  return html;
}
