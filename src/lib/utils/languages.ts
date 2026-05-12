import { LIKERT_SCALE_VARIANTS, type QuestionScaleConfig, type ScaleVariant } from "@/lib/types";

export type LanguageCode = "fr" | "en" | "de" | "es" | "it" | "pt" | "ar" | "nl" | "lb" | "sh" | "ro";

export type LanguageInfo = {
  code: LanguageCode;
  nativeLabel: string;
  flag: string;
};

export const AVAILABLE_LANGUAGES: LanguageInfo[] = [
  { code: "fr", nativeLabel: "Français", flag: "🇫🇷" },
  { code: "en", nativeLabel: "English", flag: "🇬🇧" },
  { code: "de", nativeLabel: "Deutsch", flag: "🇩🇪" },
  { code: "es", nativeLabel: "Español", flag: "🇪🇸" },
  { code: "it", nativeLabel: "Italiano", flag: "🇮🇹" },
  { code: "pt", nativeLabel: "Português", flag: "🇵🇹" },
  { code: "ar", nativeLabel: "العربية", flag: "🇸🇦" },
  { code: "nl", nativeLabel: "Nederlands", flag: "🇳🇱" },
  { code: "lb", nativeLabel: "Lëtzebuergesch", flag: "🇱🇺" },
  { code: "sh", nativeLabel: "Srpskohrvatski", flag: "🇷🇸" },
  { code: "ro", nativeLabel: "Română", flag: "🇷🇴" },
];

// Respondent-facing UI strings per language
const UI_STRINGS: Record<string, Record<string, string>> = {
  fr: {
    anonymous_notice:
      "Vos réponses sont totalement anonymes. Aucune information personnelle n'est collectée.",
    enter_token: "Saisissez votre token d'accès",
    paste_token: "Collez votre token ici...",
    validate: "Valider",
    token_validated: "Token validé. Cliquez sur Suivant pour commencer.",
    confirm_title: "Confirmer l'envoi",
    confirm_warning:
      "Une fois envoyées, vos réponses ne pourront pas être modifiées.",
    submit: "Envoyer mes réponses",
    sending: "Envoi...",
    previous: "Précédent",
    next: "Suivant",
    strongly_disagree: "Pas du tout d'accord",
    strongly_agree: "Tout à fait d'accord",
    scale_satisfaction_min: "Pas du tout satisfait·e",
    scale_satisfaction_max: "Très satisfait·e",
    scale_frequency_min: "Jamais",
    scale_frequency_max: "Toujours",
    scale_importance_min: "Pas du tout important",
    scale_importance_max: "Extrêmement important",
    your_choice: "Votre choix :",
    enter_answer: "Saisissez votre réponse...",
    answered_count: "Vous avez répondu à {answered} question(s) sur {total}.",
    translating: "Traduction en cours...",
  },
  en: {
    anonymous_notice:
      "Your answers are completely anonymous. No personal information is collected.",
    enter_token: "Enter your access token",
    paste_token: "Paste your token here...",
    validate: "Validate",
    token_validated: "Token validated. Click Next to start.",
    confirm_title: "Confirm submission",
    confirm_warning: "Once submitted, your answers cannot be changed.",
    submit: "Submit my answers",
    sending: "Sending...",
    previous: "Previous",
    next: "Next",
    strongly_disagree: "Strongly disagree",
    strongly_agree: "Strongly agree",
    scale_satisfaction_min: "Very dissatisfied",
    scale_satisfaction_max: "Very satisfied",
    scale_frequency_min: "Never",
    scale_frequency_max: "Always",
    scale_importance_min: "Not at all important",
    scale_importance_max: "Extremely important",
    your_choice: "Your choice:",
    enter_answer: "Enter your answer...",
    answered_count: "You answered {answered} out of {total} question(s).",
    translating: "Translating...",
  },
  de: {
    anonymous_notice:
      "Ihre Antworten sind vollständig anonym. Es werden keine persönlichen Daten erhoben.",
    enter_token: "Geben Sie Ihren Zugangstoken ein",
    paste_token: "Token hier einfügen...",
    validate: "Bestätigen",
    token_validated: "Token bestätigt. Klicken Sie auf Weiter, um zu beginnen.",
    confirm_title: "Absenden bestätigen",
    confirm_warning:
      "Nach dem Absenden können Ihre Antworten nicht mehr geändert werden.",
    submit: "Antworten absenden",
    sending: "Wird gesendet...",
    previous: "Zurück",
    next: "Weiter",
    strongly_disagree: "Stimme überhaupt nicht zu",
    strongly_agree: "Stimme voll und ganz zu",
    scale_satisfaction_min: "Sehr unzufrieden",
    scale_satisfaction_max: "Sehr zufrieden",
    scale_frequency_min: "Nie",
    scale_frequency_max: "Immer",
    scale_importance_min: "Überhaupt nicht wichtig",
    scale_importance_max: "Äußerst wichtig",
    your_choice: "Ihre Wahl:",
    enter_answer: "Geben Sie Ihre Antwort ein...",
    answered_count:
      "Sie haben {answered} von {total} Frage(n) beantwortet.",
    translating: "Übersetzung läuft...",
  },
  es: {
    anonymous_notice:
      "Sus respuestas son completamente anónimas. No se recopila información personal.",
    enter_token: "Ingrese su token de acceso",
    paste_token: "Pegue su token aquí...",
    validate: "Validar",
    token_validated: "Token validado. Haga clic en Siguiente para comenzar.",
    confirm_title: "Confirmar envío",
    confirm_warning:
      "Una vez enviadas, sus respuestas no podrán ser modificadas.",
    submit: "Enviar mis respuestas",
    sending: "Enviando...",
    previous: "Anterior",
    next: "Siguiente",
    strongly_disagree: "Totalmente en desacuerdo",
    strongly_agree: "Totalmente de acuerdo",
    scale_satisfaction_min: "Nada satisfecho/a",
    scale_satisfaction_max: "Muy satisfecho/a",
    scale_frequency_min: "Nunca",
    scale_frequency_max: "Siempre",
    scale_importance_min: "Nada importante",
    scale_importance_max: "Extremadamente importante",
    your_choice: "Su elección:",
    enter_answer: "Ingrese su respuesta...",
    answered_count: "Ha respondido {answered} de {total} pregunta(s).",
    translating: "Traduciendo...",
  },
  it: {
    anonymous_notice:
      "Le tue risposte sono completamente anonime. Nessuna informazione personale viene raccolta.",
    enter_token: "Inserisci il tuo token di accesso",
    paste_token: "Incolla il tuo token qui...",
    validate: "Convalida",
    token_validated: "Token convalidato. Clicca su Avanti per iniziare.",
    confirm_title: "Conferma invio",
    confirm_warning:
      "Una volta inviate, le risposte non potranno essere modificate.",
    submit: "Invia le mie risposte",
    sending: "Invio...",
    previous: "Precedente",
    next: "Avanti",
    strongly_disagree: "Per niente d'accordo",
    strongly_agree: "Completamente d'accordo",
    scale_satisfaction_min: "Per niente soddisfatto/a",
    scale_satisfaction_max: "Molto soddisfatto/a",
    scale_frequency_min: "Mai",
    scale_frequency_max: "Sempre",
    scale_importance_min: "Per niente importante",
    scale_importance_max: "Estremamente importante",
    your_choice: "La tua scelta:",
    enter_answer: "Inserisci la tua risposta...",
    answered_count: "Hai risposto a {answered} domanda/e su {total}.",
    translating: "Traduzione in corso...",
  },
  pt: {
    anonymous_notice:
      "As suas respostas são completamente anónimas. Nenhuma informação pessoal é recolhida.",
    enter_token: "Introduza o seu token de acesso",
    paste_token: "Cole o seu token aqui...",
    validate: "Validar",
    token_validated: "Token validado. Clique em Seguinte para começar.",
    confirm_title: "Confirmar envio",
    confirm_warning:
      "Após o envio, as suas respostas não poderão ser alteradas.",
    submit: "Enviar as minhas respostas",
    sending: "A enviar...",
    previous: "Anterior",
    next: "Seguinte",
    strongly_disagree: "Discordo totalmente",
    strongly_agree: "Concordo totalmente",
    scale_satisfaction_min: "Nada satisfeito/a",
    scale_satisfaction_max: "Muito satisfeito/a",
    scale_frequency_min: "Nunca",
    scale_frequency_max: "Sempre",
    scale_importance_min: "Nada importante",
    scale_importance_max: "Extremamente importante",
    your_choice: "A sua escolha:",
    enter_answer: "Introduza a sua resposta...",
    answered_count: "Respondeu a {answered} de {total} pergunta(s).",
    translating: "A traduzir...",
  },
  ar: {
    anonymous_notice:
      "إجاباتك مجهولة تمامًا. لا يتم جمع أي معلومات شخصية.",
    enter_token: "أدخل رمز الوصول الخاص بك",
    paste_token: "الصق الرمز هنا...",
    validate: "تأكيد",
    token_validated: "تم التحقق من الرمز. انقر على التالي للبدء.",
    confirm_title: "تأكيد الإرسال",
    confirm_warning: "بمجرد الإرسال، لا يمكن تعديل إجاباتك.",
    submit: "إرسال إجاباتي",
    sending: "جارٍ الإرسال...",
    previous: "السابق",
    next: "التالي",
    strongly_disagree: "لا أوافق بشدة",
    strongly_agree: "أوافق بشدة",
    scale_satisfaction_min: "غير راضٍ إطلاقاً",
    scale_satisfaction_max: "راضٍ جداً",
    scale_frequency_min: "أبداً",
    scale_frequency_max: "دائماً",
    scale_importance_min: "غير مهم إطلاقاً",
    scale_importance_max: "مهم للغاية",
    your_choice: "اختيارك:",
    enter_answer: "أدخل إجابتك...",
    answered_count: "لقد أجبت على {answered} من {total} سؤال(أسئلة).",
    translating: "جارٍ الترجمة...",
  },
  nl: {
    anonymous_notice:
      "Uw antwoorden zijn volledig anoniem. Er worden geen persoonlijke gegevens verzameld.",
    enter_token: "Voer uw toegangstoken in",
    paste_token: "Plak uw token hier...",
    validate: "Bevestigen",
    token_validated: "Token bevestigd. Klik op Volgende om te beginnen.",
    confirm_title: "Verzending bevestigen",
    confirm_warning:
      "Eenmaal verzonden kunnen uw antwoorden niet meer worden gewijzigd.",
    submit: "Mijn antwoorden verzenden",
    sending: "Verzenden...",
    previous: "Vorige",
    next: "Volgende",
    strongly_disagree: "Helemaal oneens",
    strongly_agree: "Helemaal eens",
    scale_satisfaction_min: "Helemaal niet tevreden",
    scale_satisfaction_max: "Zeer tevreden",
    scale_frequency_min: "Nooit",
    scale_frequency_max: "Altijd",
    scale_importance_min: "Helemaal niet belangrijk",
    scale_importance_max: "Uiterst belangrijk",
    your_choice: "Uw keuze:",
    enter_answer: "Voer uw antwoord in...",
    answered_count: "U heeft {answered} van de {total} vra(a)g(en) beantwoord.",
    translating: "Vertalen...",
  },
  lb: {
    anonymous_notice:
      "Är Äntwerten si komplett anonym. Et gi keng perséinlech Informatiounen gesammelt.",
    enter_token: "Gitt Ären Zougangstoken an",
    paste_token: "Setzt Ären Token hei an...",
    validate: "Bestätegen",
    token_validated: "Token bestätegt. Klickt op Weider fir unzefänken.",
    confirm_title: "Ofschécken bestätegen",
    confirm_warning:
      "Wann ofgeschéckt, kënnen Är Äntwerten net méi geännert ginn.",
    submit: "Meng Äntwerten ofschécken",
    sending: "Gëtt geschéckt...",
    previous: "Zeréck",
    next: "Weider",
    strongly_disagree: "Guer net averstanen",
    strongly_agree: "Komplett averstanen",
    scale_satisfaction_min: "Guer net zefridden",
    scale_satisfaction_max: "Ganz zefridden",
    scale_frequency_min: "Ni",
    scale_frequency_max: "Ëmmer",
    scale_importance_min: "Guer net wichteg",
    scale_importance_max: "Extrem wichteg",
    your_choice: "Är Wiel:",
    enter_answer: "Gitt Är Äntwert an...",
    answered_count: "Dir hutt {answered} vun {total} Fro(en) beäntwert.",
    translating: "Iwwersetzung leeft...",
  },
  sh: {
    anonymous_notice:
      "Vaši odgovori su potpuno anonimni. Ne prikupljaju se lični podaci.",
    enter_token: "Unesite vaš pristupni token",
    paste_token: "Zalijepite vaš token ovdje...",
    validate: "Potvrdi",
    token_validated: "Token potvrđen. Kliknite Dalje za početak.",
    confirm_title: "Potvrdite slanje",
    confirm_warning:
      "Nakon slanja, vaši odgovori se ne mogu mijenjati.",
    submit: "Pošalji moje odgovore",
    sending: "Slanje...",
    previous: "Prethodno",
    next: "Dalje",
    strongly_disagree: "Uopće se ne slažem",
    strongly_agree: "Potpuno se slažem",
    scale_satisfaction_min: "Uopće nisam zadovoljan/na",
    scale_satisfaction_max: "Veoma sam zadovoljan/na",
    scale_frequency_min: "Nikada",
    scale_frequency_max: "Uvijek",
    scale_importance_min: "Uopće nije važno",
    scale_importance_max: "Izuzetno važno",
    your_choice: "Vaš izbor:",
    enter_answer: "Unesite vaš odgovor...",
    answered_count: "Odgovorili ste na {answered} od {total} pitanja.",
    translating: "Prevođenje...",
  },
  ro: {
    anonymous_notice:
      "Răspunsurile dumneavoastră sunt complet anonime. Nu se colectează informații personale.",
    enter_token: "Introduceți tokenul de acces",
    paste_token: "Lipiți tokenul aici...",
    validate: "Validare",
    token_validated: "Token validat. Faceți clic pe Următorul pentru a începe.",
    confirm_title: "Confirmați trimiterea",
    confirm_warning:
      "Odată trimise, răspunsurile nu mai pot fi modificate.",
    submit: "Trimite răspunsurile mele",
    sending: "Se trimite...",
    previous: "Anterior",
    next: "Următorul",
    strongly_disagree: "Total dezacord",
    strongly_agree: "Total de acord",
    scale_satisfaction_min: "Deloc mulțumit/ă",
    scale_satisfaction_max: "Foarte mulțumit/ă",
    scale_frequency_min: "Niciodată",
    scale_frequency_max: "Întotdeauna",
    scale_importance_min: "Deloc important",
    scale_importance_max: "Extrem de important",
    your_choice: "Alegerea dumneavoastră:",
    enter_answer: "Introduceți răspunsul...",
    answered_count: "Ați răspuns la {answered} din {total} întrebare(ări).",
    translating: "Se traduce...",
  },
};

/**
 * Get a UI string for the respondent page in the given language.
 * Falls back to French if the key or language is missing.
 */
export function getUIString(
  lang: string,
  key: string,
  replacements?: Record<string, string | number>
): string {
  const str =
    UI_STRINGS[lang]?.[key] || UI_STRINGS.fr[key] || key;
  if (!replacements) return str;
  return Object.entries(replacements).reduce(
    (s, [k, v]) => s.replace(`{${k}}`, String(v)),
    str
  );
}

/**
 * Resolve the min/max anchor labels for a Likert question's "consigne" in the
 * given respondent language. Preset variants are fully translated; the "custom"
 * variant uses the admin-typed FR/EN labels (EN only when lang === "en",
 * otherwise the FR label is used as the fallback for every other language).
 */
export function getScaleLabels(
  lang: string,
  config: QuestionScaleConfig | null | undefined
): { min: string; max: string } {
  const variant = (config?.scale_variant as ScaleVariant) || "agreement";

  if (variant === "custom") {
    const minFr = config?.scale_min_label_fr?.trim() || "";
    const minEn = config?.scale_min_label_en?.trim() || "";
    const maxFr = config?.scale_max_label_fr?.trim() || "";
    const maxEn = config?.scale_max_label_en?.trim() || "";
    return {
      min:
        (lang === "en" ? minEn : "") ||
        minFr ||
        getUIString(lang, "strongly_disagree"),
      max:
        (lang === "en" ? maxEn : "") ||
        maxFr ||
        getUIString(lang, "strongly_agree"),
    };
  }

  const cfg =
    LIKERT_SCALE_VARIANTS[variant as Exclude<ScaleVariant, "custom">] ||
    LIKERT_SCALE_VARIANTS.agreement;
  return {
    min: getUIString(lang, cfg.minKey),
    max: getUIString(lang, cfg.maxKey),
  };
}
