/**
 * Site content & constants for Alessia Stefanello — Fisioterapista.
 *
 * All copy here is a first draft to be reviewed/finalised by Alessia (esp. the
 * "Olimpiadi" claims — kept deliberately non-specific so nothing is overstated).
 * Contact details come from the biglietto da visita.
 */

export const CONTACT = {
  name: "Alessia Stefanello",
  role: "Fisioterapista",
  phoneDisplay: "+39 342 752 2370",
  phoneHref: "+393427522370",
  email: "alessiastefanello.fisio@gmail.com",
  address: {
    line1: "Viale della Navigazione Interna 51",
    line2: "scala 8, 3° piano",
    city: "Padova (PD)",
  },
  note: "Solo su prenotazione",
} as const;

/** Action radius for home visits, around Padova centre. */
export const HOME_RADIUS_KM = 8;

/** Section (panel) indices — the order of the top-level <Section>s in page.tsx.
 *  CONTATTI is the target the "Contattami" CTA scrolls to once the engine ships
 *  the jump feature (see JUMP_TO_FEATURE.md); until then the CTA opens email. */
export const SECTION = {
  HERO: 0,
  MUSCOLO: 1,
  SPORT: 2,
  PELVICO: 3,
  DOMICILIARE: 4,
  CONTATTI: 5,
  FOOTER: 6,
} as const;

export const SERVICES = {
  muscolo: {
    eyebrow: "01 — Muscoloscheletrico",
    title: "Riabilitazione muscoloscheletrica",
    body:
      "Valutazione e trattamento di dolori e disfunzioni di muscoli, articolazioni e colonna. " +
      "Un percorso costruito sul tuo caso — terapia manuale, esercizio terapeutico ed educazione — " +
      "per ridurre il dolore e restituirti movimento.",
    points: [
      "Terapia manuale mirata",
      "Esercizio terapeutico personalizzato",
      "Gestione del dolore acuto e cronico",
    ],
  },
  sport: {
    eyebrow: "02 — Sportivi & Giovani",
    title: "Ritorno allo sport, in sicurezza",
    body:
      "Accompagno atleti e giovani nel percorso post-chirurgico e post-infortunio, fino al ritorno " +
      "in campo. Riatletizzazione progressiva, criteri oggettivi di return-to-play e prevenzione " +
      "delle recidive.",
    points: [
      "Percorso post-chirurgico",
      "Recupero post-infortunio",
      "Ritorno in campo guidato",
    ],
    olimpiadi: {
      eyebrow: "Sottosezione",
      title: "Verso le Olimpiadi",
      body:
        "Un approccio che guarda in alto: preparazione e recupero pensati per lo sport ad alto " +
        "livello, con la cura e il metodo che accompagnano un atleta fino al suo palcoscenico più grande.",
    },
  },
  pelvico: {
    eyebrow: "03 — Pavimento pelvico",
    title: "Pavimento pelvico & post parto",
    body:
      "Un supporto delicato e competente per la salute del pavimento pelvico: percorsi pre e post " +
      "parto, incontinenza, dolore e recupero della funzionalità — con ascolto e riservatezza.",
    points: [
      "Percorsi pre e post parto",
      "Incontinenza e dolore pelvico",
      "Recupero della funzionalità",
    ],
  },
  domiciliare: {
    eyebrow: "04 — A domicilio",
    title: "Fisioterapia a domicilio",
    body:
      "Quando spostarsi è difficile, vengo io da te. Trattamenti a domicilio per anziani e persone " +
      "con mobilità ridotta, nella zona del centro di Padova.",
  },
} as const;

export const HERO = {
  kicker: "Fisioterapia a Padova",
  name: CONTACT.name,
  role: CONTACT.role,
  tagline: "Formazione, metodo e ascolto al servizio del tuo movimento.",
  scrollHint: "scorri",
} as const;

export const CONTACT_COPY = {
  eyebrow: "05 — Contatti",
  title: "Contattami",
  subtitle:
    "Raccontami di cosa hai bisogno: ti ricontatto per fissare un appuntamento.",
} as const;
