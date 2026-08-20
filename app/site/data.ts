/**
 * Site content & constants for Alessia Stefanello — Fisioterapista.
 *
 * All copy here is a first draft to be reviewed/finalised by Alessia (esp. the
 * "Olimpiadi" claims — kept deliberately non-specific so nothing is overstated).
 * Contact details come from the biglietto da visita.
 */

export const CONTACT = {
  name: "Alessia Stefanello",
  role: "Fisioterapista, OMPT",
  phoneDisplay: "+39 342 752 2370",
  phoneHref: "+393427522370",
  email: "alessiastefanello.fisio@gmail.com",
  address: {
    line1: "Viale della Navigazione Interna 51",
    line2: "scala 8, 3° piano",
    city: "Padova (PD)",
  },
  note: "Solo su prenotazione",
  /** Studio address on Google Maps — the "apri in Google Maps" link on PadovaMap. */
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent("Viale della Navigazione Interna 51, Padova PD"),
} as const;

/** Action radius for home visits, around Padova centre. */
export const HOME_RADIUS_KM = 8;

/** Section (panel) indices — the order of the top-level <Section>s in page.tsx.
 *  There is no SPORT panel: the sport beat is the *focus slab* of the muscolo panel
 *  (the client's own sequencing — see CLIENTE_TODO.md §2), so it has no index of its
 *  own. CONTATTI is the target the "Contattami" CTA scrolls to once the engine ships
 *  the jump feature (see JUMP_TO_FEATURE.md); until then the CTA opens email. */
export const SECTION = {
  HERO: 0,
  MUSCOLO: 1,
  PELVICO: 2,
  DOMICILIARE: 3,
  CONTATTI: 4,
  FORMAZIONE: 5,
  FOOTER: 6,
} as const;

export const SERVICES = {
  muscolo: {
    eyebrow: "01 — Muscoloscheletrico",
    title: "Riabilitazione muscoloscheletrica",
    body:
      "Valutazione e trattamento di problematiche muscolo-tendinee e articolari. " +
        "Un percorso costruito su misura per ridurre il dolore e restituirti movimento sia nella gestione del dolore acuto/cronico che nei casi d'infortunio.",
    points: [
      "Terapia manuale",
      "Esercizio terapeutico personalizzato",
      "Educazione alla gestione del dolore",
    ],
  },
  /** The sport beat is a FOCUS, not a panel: it lives in the muscolo panel's slab
   *  (CLIENTE_TODO.md §2), hence the "Focus" eyebrow instead of a number. */
  sport: {
    eyebrow: "Focus",
    title: "Ritorno allo sport, in sicurezza",
    body:
      "Accompagno atleti di qualsiasi livello nel percorso post-chirurgico e post-infortunio, fino alla riatletizzazione, ritorno in campo e prevenzione delle recidive.",
    points: [
      "Percorso post-chirurgico",
      "Recupero post-infortunio",
      "Ritorno in campo guidato",
    ],
    /** The Olimpiadi beat is no longer a section of its own: it signs off the sport
     *  focus, as a caption under the Milano Cortina logo at the foot of the slab. */
    olimpiadi: {
      caption: "Milano Cortina 2026",
    },
  },
  pelvico: {
    eyebrow: "02 — Pavimento pelvico",
    title: "Riabilitazione del pavimento pelvico",
    body:
      "Un supporto delicato e competente per la salute del pavimento pelvico. " +
      "Un percorso che ti accompagna alla gestione del dolore e al recupero della funzionalità — con ascolto e riservatezza.",
    points: [
      "Percorsi pre e post parto",
      "Disfunzioni sessuali e dolore pelvico",
      "Problematiche di incontinenza",
    ],
    postParto: {
      eyebrow: "Focus",
      title: "Il percorso post parto",
      body:
        "Dopo il parto il corpo chiede del tempo e una guida. Valutiamo insieme diastasi, cicatrice e " +
          "funzionalità del pavimento pelvico. Costruiamo un ritorno graduale al movimento.",
      // TODO METTERE DUE FOTO SOTTO
    },
  },
  domiciliare: {
    eyebrow: "03 — A domicilio",
    title: "Fisioterapia a domicilio",
    body:
      "Quando spostarsi è difficile, vengo io da te. Trattamenti a domicilio per anziani e persone " +
        "con mobilità ridotta, nella zona del centro di Padova.",
    zona: {
      eyebrow: "Focus",
      title: "Dove arrivo",
      body:
        "Il domicilio copre Padova centro e i quartieri intorno. Se abiti poco fuori dall'area, " +
        "scrivimi lo stesso: si valuta caso per caso.",
    },
  },
} as const;

/**
 * Formazione / CV — the closing panel (CLIENTE_TODO.md §4).
 *
 * ⚠️ `items` are PLACEHOLDERS, not Alessia's real qualifications: nobody's degrees,
 * courses or employers may be invented on a public site. Every line must be replaced
 * with what she actually holds before this branch goes anywhere near production —
 * the underscores are there to make an unreplaced line impossible to miss.
 *
 * Keep it to SIX entries: the panel has to fit inside 100svh (see CLAUDE.md). A longer
 * CV gets shorter lines, not a taller panel.
 */
export const FORMAZIONE = {
  eyebrow: "05 — Formazione",
  title: "Formazione ed esperienza",
  intro:
    "Il percorso che c'è dietro ai trattamenti: studi, specializzazioni e i contesti in cui " +
    "ho lavorato.",
  items: [
    { year: "____", title: "Laurea in Fisioterapia", place: "Università di ____" },
    { year: "____", title: "Master / corso di specializzazione ____", place: "____" },
    { year: "____", title: "Corso ____ (pavimento pelvico)", place: "____" },
    { year: "____", title: "Corso ____ (riabilitazione sportiva)", place: "____" },
    { year: "____", title: "Esperienza presso ____", place: "____" },
    { year: "oggi", title: "Libera professione", place: "Padova" },
  ],
} as const;

export const HERO = {
  kicker: "Fisioterapia a Padova",
  name: CONTACT.name,
  role: CONTACT.role,
  tagline: "Formazione, professionalità e ascolto al servizio della tua salute.",
  scrollHint: "scorri",
} as const;

/** The hero's index of services (see `ServiceIndex`): the page's table of contents.
 *  Labels are short on purpose — the full titles live in SERVICES, these only have to
 *  name the beat. `section` is the panel each entry scrolls to (`useSectionJump`), and
 *  is the reason SECTION above is a real dependency and not just documentation.
 *
 *  `land` is how far into the target panel the jump keeps scrolling after arriving.
 *  The three service panels tell a staged story — the focus slab only starts entering
 *  at 960 — so landing at the hook's default (900) would drop the visitor on half a
 *  panel; 1350 puts them just past the slab's arrival (it lands at 1300). It must stay
 *  below the target's PANEL_END in page.tsx or the landing scrolls straight past it. */
export const HERO_INDEX = [
  { n: "01", label: "Muscoloscheletrico", section: SECTION.MUSCOLO, land: 1350 },
  { n: "02", label: "Pavimento pelvico", section: SECTION.PELVICO, land: 1350 },
  { n: "03", label: "A domicilio", section: SECTION.DOMICILIARE, land: 1350 },
  { n: "04", label: "Formazione", section: SECTION.FORMAZIONE, land: undefined },
] as const;

export const CONTACT_COPY = {
  eyebrow: "04 — Contatti",
  title: "Contattami",
  subtitle:
    "Raccontami di cosa hai bisogno: ti ricontatto per fissare un appuntamento.",
} as const;
