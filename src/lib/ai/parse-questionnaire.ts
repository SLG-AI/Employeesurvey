import Anthropic from "@anthropic-ai/sdk";

export type ParsedScaleVariant =
  | "agreement"
  | "satisfaction"
  | "frequency"
  | "importance";

export type ParsedQuestion = {
  text_fr: string;
  text_en: string;
  type: "single_choice" | "multiple_choice" | "likert" | "likert_5" | "free_text";
  question_code: string;
  section: string;
  // "Consigne" for Likert scales (ignored for non-Likert types)
  scale_variant?: ParsedScaleVariant;
  options: { text_fr: string; text_en: string }[];
};

const SCALE_VARIANTS: ParsedScaleVariant[] = [
  "agreement",
  "satisfaction",
  "frequency",
  "importance",
];

export type ParseResult = {
  questions: ParsedQuestion[];
  documentTitle?: string;
};

const SYSTEM_PROMPT = `Tu es un assistant expert en analyse de questionnaires d'enquête.
Tu reçois le texte extrait d'un document (PDF ou Word) contenant un questionnaire destiné aux employés.

Ton rôle est d'extraire toutes les questions et de les structurer en JSON.

Règles :
- Pour chaque question, détermine le type le plus approprié :
  - "single_choice" : question à choix unique (une seule réponse possible)
  - "multiple_choice" : question à choix multiples (plusieurs réponses possibles)
  - "likert" : échelle de notation/satisfaction de 1 à 10
  - "likert_5" : échelle de notation/satisfaction de 1 à 5
  - "free_text" : question ouverte nécessitant une réponse libre
- Si des options de réponse sont listées dans le document, inclus-les.
- Si la question est une échelle (satisfaction, accord, fréquence), utilise le type "likert" (1-10) ou "likert_5" (1-5) selon le contexte. Par défaut, utilise "likert_5" sauf si le document indique explicitement une échelle sur 10.
- Pour les questions de type "likert" ou "likert_5", ajoute un champ "scale_variant" indiquant la consigne (les libellés des extrémités de l'échelle) : "agreement" (pas du tout d'accord -> tout à fait d'accord), "satisfaction" (pas du tout satisfait -> très satisfait), "frequency" (jamais -> toujours) ou "importance" (pas du tout important -> extrêmement important). Choisis la variante la plus cohérente avec la formulation de la question. Par défaut, utilise "agreement". N'ajoute pas ce champ pour les autres types de question.
- Fournis le texte en français (text_fr). Si une version anglaise est présente dans le document, inclus-la aussi (text_en), sinon laisse text_en vide.
- Pour les options, fournis aussi text_fr et text_en si disponible.
- Si le document a un titre identifiable, inclus-le dans documentTitle.

- Génère un code court et unique pour chaque question (question_code). Ce code servira à identifier la question de façon stable pour le suivi longitudinal. Utilise un préfixe thématique suivi d'un numéro, ex: "SAT-01", "ENG-03", "MGT-02", "ENV-01".
- Identifie les sections/thèmes du questionnaire. Chaque question doit avoir un champ "section" contenant le nom de la section à laquelle elle appartient (ex: "Satisfaction générale", "Management", "Environnement de travail"). Si le document ne contient pas de sections explicites, regroupe les questions par thème.

Retourne UNIQUEMENT un JSON valide (pas de markdown, pas de texte autour) avec ce format :
{
  "documentTitle": "Titre du questionnaire (optionnel)",
  "questions": [
    {
      "text_fr": "Texte de la question en français",
      "text_en": "",
      "type": "single_choice",
      "question_code": "SAT-01",
      "section": "Satisfaction générale",
      "options": [
        { "text_fr": "Option 1", "text_en": "" },
        { "text_fr": "Option 2", "text_en": "" }
      ]
    }
  ]
}`;

export async function parseQuestionnaire(
  documentText: string
): Promise<ParseResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your_anthropic_api_key_here") {
    throw new Error(
      "ANTHROPIC_API_KEY non configurée. Ajoutez votre clé API Anthropic dans .env.local"
    );
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Voici le texte extrait du document :\n\n---\n${documentText}\n---\n\nExtrais toutes les questions et retourne le JSON structuré.`,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Parse JSON from response (handle potential markdown wrapping)
  let jsonStr = responseText.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(jsonStr) as ParseResult;

  // Validate structure
  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error("Format de réponse IA invalide : pas de questions trouvées");
  }

  // Normalize questions
  parsed.questions = parsed.questions.map((q) => {
    const type = ["single_choice", "multiple_choice", "likert", "likert_5", "free_text"].includes(
      q.type
    )
      ? q.type
      : "free_text";
    const isLikert = type === "likert" || type === "likert_5";
    return {
      text_fr: q.text_fr || "",
      text_en: q.text_en || "",
      type,
      question_code: q.question_code || "",
      section: q.section || "",
      scale_variant: isLikert
        ? SCALE_VARIANTS.includes(q.scale_variant as ParsedScaleVariant)
          ? (q.scale_variant as ParsedScaleVariant)
          : "agreement"
        : undefined,
      options: Array.isArray(q.options)
        ? q.options.map((o) => ({
            text_fr: o.text_fr || "",
            text_en: o.text_en || "",
          }))
        : [],
    };
  });

  return parsed;
}
