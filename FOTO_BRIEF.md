# Foto in studio — come farle

Questo documento risponde al punto 3 delle considerazioni: **dove vanno le foto** sul sito
e **con che caratteristiche farle**. È scritto per essere letto da Alessia: si può girare
così com'è.

---

## Dove finiscono, sul sito

Le foto vanno **dentro le fasce colorate** che entrano da destra su ogni servizio (quella
fucsia dello sport, quella blu del post parto, quella oro del domicilio). È il posto giusto
per tre motivi: la fascia è già una cornice a tutta altezza, il colore del brand fa da
passe-partout e tiene insieme foto scattate in momenti diversi, e non ruba spazio al testo
— ogni schermata deve stare tutta in una videata, quindi non c'è spazio per una foto grande
sotto alla spiegazione.

Dove oggi c'è il disegno animato (l'atleta, l'esercizio del ponte) andrà la foto: **o la
foto o il disegno, non tutti e due**. Finché le foto non ci sono, resta il disegno — non ci
sono buchi da riempire nel frattempo.

Servono **tre foto principali**, una per servizio. Se ne vengono di più, meglio: si sceglie.

---

## Le caratteristiche

### Sfondo e luce

- **Sfondo chiaro e sgombro**: una parete bianca o chiarissima, lettino, niente armadi
  aperti, niente cartelloni, niente cavi o borse a terra. Quello che c'è nell'inquadratura
  deve essere lì apposta.
- **Luce di giorno, mai il flash**. Vicino alla finestra, con la luce che arriva *di lato* o
  di fronte a chi viene fotografato — mai alle spalle, o si diventa una sagoma scura.
- **Spegni i neon** se la luce naturale basta: mescolare neon e luce di finestra fa venire
  la pelle verdognola. Se il neon serve, tienilo acceso in tutte le foto della sessione.
- Giornata **nuvolosa** o luce non diretta: il sole pieno taglia ombre dure sui visi.

### Come vestirsi

- **Tu**: divisa da lavoro o tinta unita chiara/neutra (bianco, blu chiaro, sabbia).
  Niente scritte, loghi o fantasie: distraggono e invecchiano male. Capelli come li porti
  di solito al lavoro — devi sembrare te, non una modella.
- **Il paziente**: tinte **neutre o scure** (grigio, blu, nero), abbigliamento sportivo
  semplice. Serve il contrasto con lo sfondo chiaro, ed evita che sia il vestito ad
  attirare l'occhio.
- Niente orologi vistosi, niente smalto acceso, niente collane che ballano: le mani si
  vedono da vicino.

### Cosa fare durante lo scatto

- **Lavora davvero.** Le foto che funzionano sono quelle in cui stai facendo il gesto —
  una mano che valuta, una presa, la correzione di un esercizio — non quelle in cui guardi
  l'obiettivo sorridendo.
- **Non guardare la macchina**, guarda il paziente o le tue mani. Una sola foto delle tre
  può essere di te che guardi l'obiettivo (serve per la parte "chi sono"), le altre no.
- **Mani in primo piano, viso del paziente in secondo.** È la fisioterapia che si racconta,
  e risolve metà dei problemi di privacy.
- Fai **tante foto dello stesso gesto** cambiando poco (angolo, altezza, un passo avanti):
  la buona esce dalla quantità.
- **Verticale**, telefono in verticale. Le fasce del sito sono strette e alte.

### Privacy — importante

Se il paziente è riconoscibile, serve il suo **consenso scritto** per pubblicare la foto sul
sito: basta un foglio firmato che dica che acconsente all'uso della propria immagine sul sito
professionale. In alternativa si inquadrano solo le mani, il dettaglio, la schiena, oppure si
scatta con una persona di famiglia che fa da modello — è la soluzione più semplice e
funziona benissimo.

---

## La lista degli scatti

| # | serve per | cosa si vede | formato |
|---|---|---|---|
| 1 | Muscoloscheletrico / sport | Una **presa di terapia manuale** o la correzione di un esercizio: le tue mani sul ginocchio o sulla spalla, paziente in secondo piano. | verticale, 3:4 |
| 2 | Pavimento pelvico / post parto | Il momento più **delicato e rassicurante**: la spiegazione, tu seduta di fronte alla paziente, oppure la guida di un esercizio a terra. Niente di clinicamente esplicito. | verticale, 3:4 |
| 3 | Domicilio | Il **contesto di casa**: la borsa, il tappetino a terra in salotto, il lavoro con una persona anziana seduta in poltrona. Deve leggersi che non è lo studio. | verticale, 3:4 |
| 4 | *(bonus)* ritratto | Te, in studio, che **guardi l'obiettivo**. Sostituisce quella dell'hero se viene meglio. | verticale, 3:4 |
| 5 | *(bonus)* dettagli | Lo studio vuoto, il lettino, gli attrezzi, le mani da vicino. Riempitivi utilissimi. | libero |

**Come mandarle:** originali dal telefono, senza filtri e senza ritagliare (al ritaglio
penso io, ho bisogno del margine). WeTransfer o Drive, non WhatsApp — WhatsApp le
ricomprime e le rovina.

---

## Nota per lo sviluppatore

Quando arriva un file: metterlo in `public/` e inserirlo nello slab del servizio dentro
`app/page.tsx`, al posto della `ScrollLottie` di quel `FocusPanel` (o del logo, per il
pannello sport). Usare `next/image` con `width`/`height` reali, come già fa
`HeroPortrait.tsx`. Il pannello deve continuare a stare in `100svh`: se la foto non ci sta,
si accorcia lei (`max-h`), non si allunga il pannello.
