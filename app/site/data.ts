/**
 * Site content & constants for Alessia Stefanello — Fisioterapista.
 *
 * All copy here is a first draft to be reviewed/finalised by Alessia (esp. the
 * "Olimpiadi" claims — kept deliberately non-specific so nothing is overstated).
 * Contact details come from the biglietto da visita.
 */

/** The address as GOOGLE should read it — no "(PD)" parenthetical, which is how it is
 *  written for people but not what a geocoder wants. One string, so the embedded map and
 *  the "apri in Google Maps" link can never end up pointing at two different places. */
const MAPS_QUERY = "Forcellini, Padova PD";

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
  /** What PadovaMap's embed geocodes (see MAPS_QUERY above). */
  mapsQuery: MAPS_QUERY,
  /** Studio address on Google Maps — the "apri in Google Maps" link on PadovaMap. */
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(MAPS_QUERY),
} as const;

/** Section (panel) indices — the order of the top-level <Section>s in page.tsx.
 *  There is no SPORT panel: the sport beat is the *focus slab* of the muscolo panel
 *  (the client's own sequencing — see CLIENTE_TODO.md §2), so it has no index of its
 *  own. CONTATTI is where the hero index's "Contattami" entry scrolls to (via
 *  `useSectionJump`, the site-side workaround for the engine's missing jump API). */
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
      "Un percorso costruito su misura per ridurre il dolore, sia acuto che cronico, e restituirti movimento.",
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
    body: "Accompagno atleti di qualsiasi livello nel percorso post-chirurgico e post-infortunio, fino alla riatletizzazione e al ritorno allo sport in sicurezza. Con un'attenzione particolare nel lavoro per la prevenzione delle recidive.",
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
    body: "Un supporto competente per prenderti cura del pavimento pelvico. Ti accompagno, con ascolto e riservatezza, nella gestione del dolore e delle disfunzioni uro-ginecologiche.",
    points: [
      "Percorsi di riabilitazione post-parto",
      "Dolore pelvico e disfunzioni sessuali",
      "Problematiche di incontinenza",
    ],
    postParto: {
      eyebrow: "Focus",
      title: "Il percorso post parto",
      body:
        "Dopo il parto il corpo chiede del tempo e una guida. Valutiamo insieme diastasi, cicatrice e " +
        "funzionalità del pavimento pelvico. Costruiamo un ritorno graduale al movimento.",
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
      /** The reach, in words. It used to be a dashed ring drawn over the map, scaled from
       *  a `HOME_RADIUS_KM` constant — which forced the map to frame ~120 km of Veneto to
       *  fit the ring, and at that zoom nothing on it was legible. Said here instead, the
       *  map is free to sit on the studio's own street. */
      range: "Padova centro e quartieri limitrofi.",
    },
  },
} as const;

/**
 * Formazione / CV — the closing panel (CLIENTE_TODO.md §4).
 *
 * These are Alessia's REAL credentials, transcribed from
 * `FOTO_ORIGINALI/CV_Alessia_Stefanello_2026.pdf`. The panel used to carry six
 * placeholder lines full of underscores; nobody's degrees may be invented on a public
 * site, and that warning is now spent.
 *
 * ## Why it is paged rather than listed
 * The CV has sixteen entries across four headings and the panel has to fit inside 100svh.
 * A longer CV therefore adds PAGES, not height — `CvSheets` deals them in from the right
 * as you scroll, one sheet over the last (NUOVA_TODO.md §Formazione/1). Adding an entry
 * here is free until a single page outgrows the box; adding a fifth page costs scroll,
 * which `PANEL_END[5]` derives from the page count rather than hard-coding.
 *
 * Order is deliberate: what she does now, then the two experiences that are actually
 * stories, then the qualifications, then the courses. Skills (languages, literature
 * search, soft skills) are on the CV but stay off the site — they are what a CV says to a
 * hiring manager, not what a patient is deciding on.
 *
 * ⚠️ TO CONFIRM WITH ALESSIA before publishing (do not silently "fix" a real person's
 * record — these are transcription calls, not typos in our copy):
 *   - the CV writes "Kisesis medical" (Kinesis?), "Collaboratirce", "Laura Triennale",
 *     "Strenght and Conditioning", "NCSA" (NSCA?), "Phisiovit" (Physiovit?). Rendered here
 *     in their corrected form on the assumption they are slips in the PDF.
 *   - the CV's header gives `alessiastefanello@gmail.com`; the site publishes
 *     `alessiastefanello.fisio@gmail.com` (CONTACT above). One of the two is wrong.
 */
export const FORMAZIONE = {
  eyebrow: "05 — Formazione",
  title: "Formazione ed esperienza",
  intro:
    "Il percorso che c'è dietro ai trattamenti: studi, specializzazioni e i contesti in cui " +
    "ho lavorato.",
  pages: [
    {
      id: "esperienza",
      label: "Esperienza",
      items: [
        {
          year: "2025 — oggi",
          title: "Fisioterapia muscoloscheletrica e ortopedica",
          place: "Kinesis Medical",
        },
        {
          year: "2022 — oggi",
          title:
            "Libera professione — muscoloscheletrico, ortopedico, sportivo",
          place: "Padova",
        },
        {
          year: "2022 — oggi",
          title: "Collaboratrice alla docenza — distretto toraco-lombare",
          place: "Università di Genova",
        },
        {
          year: "2022 — 2024",
          title: "Muscoloscheletrico, ortopedico e neurologico",
          place: "Policlinico San Marco (VE)",
        },
        {
          year: "2021 — 2022",
          title: "Muscoloscheletrico e ortopedico",
          place: "FisioRED (PD)",
        },
      ],
    },
    {
      id: "extra",
      label: "Esperienze extra",
      items: [
        {
          year: "2026",
          title: "Fisioterapista ai Giochi olimpici invernali",
          place: "Villaggio olimpico — Milano Cortina 2026",
        },
        {
          year: "2024",
          title: "Volontariato — neurologico, ortopedico ed età evolutiva",
          place: "Ospedale di Andavadoaka, Madagascar",
        },
      ],
    },
    {
      id: "educazione",
      label: "Educazione",
      items: [
        {
          year: "2020 — 2022",
          title:
            "Master in Riabilitazione dei disturbi muscoloscheletrici — 110 e lode",
          place: "Università di Genova",
        },
        {
          year: "2017 — 2020",
          title: "Laurea triennale in Fisioterapia — 110 e lode",
          place: "Università di Padova",
        },
        {
          year: "2012 — 2017",
          title: "Diploma di maturità scientifica",
          place: "Liceo Enrico Fermi (PD)",
        },
      ],
    },
    {
      id: "corsi",
      label: "Corsi",
      items: [
        {
          year: "2025 — 2026",
          title: "Master in Riabilitazione del pavimento pelvico",
          place: "Fisiokines",
        },
        {
          year: "2025",
          title: "Tecnico di 1° livello — Strength and Conditioning",
          place: "NSCA · Physiovit",
        },
        {
          year: "2024",
          title: "Gestione del paziente neurologico — lavoro in team",
          place: "Policlinico San Marco",
        },
        {
          year: "2024",
          title: "La riabilitazione nella cooperazione internazionale",
          place: "Fisioterapisti senza frontiere",
        },
        {
          year: "2023",
          title: "Evidence Based Practice: strumenti e metodi",
          place: "ECM · SPES",
        },
        {
          year: "2022",
          title: "LCA rehab: dalla chirurgia al ritorno in campo",
          place: "FisioScience",
        },
      ],
    },
  ],
} as const;

export const HERO = {
  name: CONTACT.name,
  /** Not `CONTACT.role`: in the hero the title hangs between two gold rules
   *  (— Fisioterapista / OMPT —), and a comma inside that frame reads as a stumble.
   *  The slash is the client's own notation (NUOVA_TODO.md §HERO/2). Everywhere else
   *  — footer, targhetta — keeps the prose form in CONTACT.role.
   *  OMPT, not OMTP: the CV's own header spells it OMPT. */
  role: "Fisioterapista / OMPT",
  /** The line break is the client's: the hero renders this `whitespace-pre-line`. */
  tagline: "Formazione, professionalità e ascolto\nal servizio della tua salute.",
  scrollHint: "scorri",
} as const;

/** The hero's index (see `ServiceIndex`): the page's table of contents.
 *
 *  It is deliberately TWO lists. The three services answer "lavoro in ambito…" and read
 *  as one group; the CV is not a service and was being read as a fourth one, so it sits
 *  apart, under its own rule and in the first person ("la mia formazione"). That split is
 *  the client's own (NUOVA_TODO.md §HERO/4) and it lives here rather than in the
 *  component, which has no per-entry branching.
 *
 *  Labels name the beat — the full titles live in SERVICES. `section` is the panel each
 *  entry scrolls to (`useSectionJump`), which is why SECTION above is a real dependency
 *  and not just documentation.
 *
 *  `land` is how far into the target panel the jump keeps scrolling after arriving.
 *  The three service panels tell a staged story — the focus content only starts entering
 *  at 960 — so landing at the hook's default (900) would drop the visitor on half a
 *  panel; 1350 puts them just past its arrival (it lands at 1300). It must stay below the
 *  target's PANEL_END in page.tsx or the landing scrolls straight past it. */
export const HERO_INDEX = [
  {
    n: "01",
    label: "Muscoloscheletrico",
    section: SECTION.MUSCOLO,
    land: 1350,
  },
  { n: "02", label: "Pavimento pelvico", section: SECTION.PELVICO, land: 1350 },
  {
    n: "03",
    label: "Fisioterapia Domiciliare",
    section: SECTION.DOMICILIARE,
    land: 1350,
  },
] as const;

/** Heading over the three services above. */
export const HERO_INDEX_TITLE = "Lavoro in ambito:";

/** The two entries that are NOT services, held apart from them (see above): the contact
 *  panel and the CV. No `land` on either: both panels tell their story from their own
 *  landing, so the hook's default (900) is right — contatti hands off at 1430, formazione
 *  later still, so neither is overshot. */
export const HERO_INDEX_EXTRAS = [
  { label: "Contattami", section: SECTION.CONTATTI },
  { label: "La mia formazione", section: SECTION.FORMAZIONE },
] as const;

export const CONTACT_COPY = {
  eyebrow: "04 — Contatti",
  title: "Contattami",
  subtitle:
    "Raccontami di cosa hai bisogno: ti ricontatto per fissare un appuntamento.",
} as const;
