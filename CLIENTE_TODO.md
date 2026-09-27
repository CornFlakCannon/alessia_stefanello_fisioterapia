# Considerazioni del cliente

1. La prima pagina forse non so se la farei tutta tutta gialla, la trovo un pò pesante. Non so che alternative ci siano in realtà (hai qualche idee? Bordi?). La foto, che poi farò al posto di quella che hai messo, la metterei dritta, non inclinata. Non so se per fare la pagina ‘meno gialla’ e ‘meno vuota’ poi si possa inserire qualcuna delle foto che farò.

- SVILUPPATORE: Per dare uniformità e occupare lo spazio correttamente, dobbiamo fornire una gerarchia degli elementi e suddividere lo spazio in maniera opportuna. 

- FATTO (branch `hero-restyle`): il giallo non è più il fondo della pagina ma una **fascia**
  su cui poggia la foto — a destra su desktop, dietro alla foto su telefono; il resto è
  bianco. Restano in oro solo gli accenti (il filetto accanto a "Fisioterapista", le spunte,
  i numeri dell'indice). La **foto è dritta** ed emerge da una linea orizzontale disegnata,
  che fa anche da confine tra l'oro e il bianco. Contro il vuoto: gerarchia rifatta
  (titolo più grande, testo più stretto e leggibile) e un **indice delle quattro sezioni**
  in fondo alla colonna — cliccando una voce la pagina scorre fino a quella sezione.
  Le foto in studio (punto 3) entrano volentieri qui: lo spazio è già suddiviso, basta
  sostituire la fascia oro con un'immagine o affiancarne una seconda.

2. Come sequenza delle cose che faccio metterei:
a. riabilitazione muscolo scheletrica,
a.1. E come Focus a ‘destra’ della riabilitazione muscolo scheletrica, la parte sportiva – con il ritorno allo sport in sicurezza. (per intenderci quella che ora è sulle olimpiadi e hai fatto in fucsia).

b. riabilitazione del pavimento pelvico,
c. riabilitazione domiciliare.

In realtà si potrebbe pensare di mettere un ‘focus a destra’ anche per le altre due sezioni

- FATTO (branch `sezioni-focus`): la sequenza è esattamente quella chiesta — muscolo­scheletrica,
  pavimento pelvico, domiciliare — e **la parte sportiva non è più una sezione a sé**: è il focus
  a destra della muscoloscheletrica, con dentro il logo Milano Cortina e l'atleta a firmare il
  percorso. Il focus a destra c'è anche sulle altre due: **post parto** per il pavimento pelvico
  (con l'esercizio del ponte, che prima faceva da sfondo), **la mappa di Padova col raggio** per
  il domicilio. I tre focus hanno colori diversi (fucsia, blu, oro) così tre fasce di fila non
  stancano l'occhio.

3. Le foto in studio, secondo te le mettiamo dove? Sotto alla spiegazione di quello che faccio (tipo dove c’è la gif per intenderci)? Rispetto a questo mi piacerebbe capire anche con te come farle, con che caratteristiche (sfondo chiaro, vestiti dei pz neutri\scuri, cosa fare io durante la foto).

- FATTO: le foto vanno **dentro le fasce colorate dei focus**, non sotto alla spiegazione: la
  fascia è già una cornice a tutta altezza e il colore fa da passe-partout, mentre sotto al testo
  non c'è spazio (ogni schermata deve stare in una videata). Dove ora c'è il disegno animato
  andrà la foto — o l'una o l'altro. Il "come farle" è scritto in **`FOTO_BRIEF.md`**: sfondo,
  luce, abbigliamento, cosa fare durante lo scatto, la questione consenso, e la lista dei 3+2
  scatti con le proporzioni giuste. È scritto per essere girato ad Alessia così com'è.

- FATTO (foto vere, 18/08): le foto dello studio sono arrivate e sono dentro il sito.
  - **Hero**: non una foto ferma ma il **video** — scrollando, Alessia incrocia le braccia.
  - **Muscoloscheletrica / sport** (fascia fucsia): tre foto che si susseguono mentre si
    scorre — la valutazione della spalla, la terapia manuale, il ritorno al gesto sportivo —
    e sopra resta il logo Milano Cortina. Il disegno dell'atleta è stato sostituito da loro.
  - **Domiciliare** (fascia oro): la foto con la signora anziana, e la **mappa di Padova
    diventa una card più piccola** appoggiata sopra, invece di occupare tutta la fascia.
  - **Contatti** e **Formazione**: la foto sta sul fondo, molto tenue, come texture — non
    c'era spazio in altezza per metterla in mezzo al testo. Sulla Formazione c'è anche il
    **ritratto** (quello in cui guardi l'obiettivo), in tondo, in basso a destra.
  - Tutte sono **filtrate col colore della sezione**: è quello che tiene insieme scatti fatti
    con luci e inquadrature diverse e le fa sembrare una famiglia sola.
  - ⚠️ **Manca solo il pavimento pelvico**: di quel servizio non c'è nessuna foto, quindi
    quella fascia tiene ancora il disegno (l'esercizio del ponte). È lo scatto n. 2 di
    `FOTO_BRIEF.md`.
  - ⚠️ **Consenso**: nelle foto ci sono pazienti riconoscibili. Prima di pubblicare serve la
    liberatoria firmata di ognuno di loro (vedi la sezione "Privacy" del brief).

4. Alla fine, o a ‘destra’ della parte dei contatti o dove tu ritieni sia più consono, metterei un posto in cui si vede la mia formazione, tipo cv. Perché credo sia importante far vedere la mia formazione e le mie esperienze. Ma appunto lo metterei alla fine di tutto.

- FATTO: pannello **Formazione** dopo i contatti e prima del footer — "alla fine di tutto" come
  chiedeva. Timeline compatta (anno · titolo · ente), due colonne su desktop.
  ⚠️ **Le voci sono segnaposto con dei trattini**: servono i dati veri di Alessia (laurea, master,
  corsi, esperienze) prima di pubblicare — non si inventano titoli di studio di una persona reale.

---

# Secondo giro (`NUOVA_TODO.md`, agosto 2026)

Le note del cliente dopo aver visto il branch `sezioni-focus` in funzione. Sotto, cosa è
stato fatto.

1. **Scheda contatti in alto a sinistra a comparsa.** — FATTO. Un solo motivo su tutti gli
   schermi, quello del telefono: una pillola con l'**avatar di Alessia** (il ritratto vero,
   non il cerchio segnaposto — a 32px una faccia si riconosce, un logo no), il richiamo
   telefono, il richiamo email e una freccetta che apre il dettaglio (nome, ruolo,
   indirizzo, "solo su prenotazione"). Telefono ed email restano link diretti **anche a
   scheda chiusa**: nascondere il numero di una fisioterapista dietro un click sarebbe
   declutterare la cosa sbagliata.
2. **Via la mascotte.** — FATTO. Sparisce l'omino che seguiva lo scroll.
3. **Hero.** — FATTO, per intero.
   - **La foto entra da destra insieme alla fascia oro**, in automatico al caricamento:
     prima una lama fucsia, poi l'oro che la copre lasciandone una barra di ~50px, poi la
     foto che si solleva (scale 1.1 + ombra sotto). Via il video.
   - Sorpresa tecnica: la foto `HERO_PHOTO.png` **sembrava** già scontornata ed era invece
     opaca, con la scacchiera *dipinta dentro*. È stata scontornata davvero. *(Se salta
     fuori il file originale con la trasparenza vera, tanto meglio: il nostro passaggio
     diventa superfluo.)*
   - **Il ritratto poggia sul bordo inferiore della videata** e ci sta tutto: il taglio
     dei pantaloni fa da base, così sembra che continui oltre l'inquadratura invece di
     finire per aria. Via l'ombra e via anche lo scale finale 1.1 — un ingrandimento
     all'ultimo istante litiga con una figura ancorata in basso e dimensionata per
     riempire la sua metà (la costringerebbe a stare il 10% sotto lo spazio disponibile),
     ed è proprio quel 10% che ha guadagnato.
   - **Alessia sta sul bianco e l'oro è passato alla metà del testo.** Sull'oro il ritaglio
     portava un alone chiaro attorno ai capelli, e non era una frangia da limare: quei
     pixel sono ~11k luci *dentro* di lei (pantaloni e capelli), e limarli vuol dire
     mangiarle i capelli. Misurato: su oro il più chiaro sta 83 livelli sopra il fondo, su
     bianco 29 sotto — invisibile. Non era una soglia da tarare, era il fondo da cambiare.
     La lama fucsia ci ha guadagnato: adesso cade sulla cucitura oro/bianco e fa da
     divisore invece che da bordo.
   - Conseguenza sui colori: sull'oro il blu del marchio regge solo come testo *grande*
     (3.75:1), quindi il titolo resta blu e tutto il resto passa al quasi-nero del
     marchio. Sul telefono la stessa cosa si ribalta: foto in alto su bianco, oro dietro
     al testo fino in fondo alla videata (con un filetto fucsia a segnare il confine).
   - Testo a sinistra **centrato**, con il ruolo fra due stanghette oro.
   - Via il pulsante "Contattami" e il numero, al loro posto **l'indirizzo dello studio**.
   - Indice ristrutturato: "Lavoro in ambito:" sopra i tre servizi, "A domicilio" diventa
     "Fisioterapia Domiciliare", e "La mia formazione" sta **staccata** sotto.
4. **Muscoloscheletrica: la fascia non compare più, è già lì.** — FATTO su desktop: la
   fascia arriva col pannello, già vestita delle foto che scorrono, e sono **il testo e il
   logo delle Olimpiadi** a entrare da destra. Sul telefono lo slide-in dell'intera fascia
   resta, come chiesto. Logo Olimpiadi ingrandito.
5. **Pavimento pelvico: le due foto nuove.** — FATTO. `PELVICO_CROPPATA.jpg` e
   `LETTINO.jpg` in duotone blu al posto del disegno animato del ponte. Era l'ultima
   sezione senza fotografie: **adesso non c'è più nessun disegno segnaposto sul sito.**
6. **Mappa: via il raggio, focus su Padova centro.** — FATTO, e risolve anche il "non si
   vede dove punta": ora c'è un **pin vero sull'indirizzo dello studio**. L'anello
   tratteggiato costringeva a inquadrare ~120 km di Veneto per starci dentro, ed è per
   quello che non si leggeva niente. Il raggio d'azione si dice a parole sul pannello.
7. **Contattami: la foto non era leggibile.** — FATTO, e il problema era peggiore di come
   si vedeva: il testo del titolo stava a **1.97:1** di contrasto (la soglia è 4.5). La
   foto però doveva diventare **più** visibile, non meno. Soluzione: la foto sale, e
   testo e form si appoggiano su una **card bianca traslucida** — così il contrasto torna
   a misurarsi sul bianco. Caratteri del form più grandi.
8. **Formazione dal CV.** — FATTO. Sedici voci vere (esperienza, esperienze extra,
   educazione, corsi) sfogliate in **fogli che si sovrappongono** entrando da destra,
   esattamente l'animazione chiesta: un CV più lungo aggiunge pagine, non altezza.
   Un foglio tiene un *numero* di voci, non un capitolo del CV: sul telefono la lista è a
   colonna singola, quindi le cinque voci di "Esperienza" sarebbero uscite dalla videata.
   Un capitolo che non ci sta diventa due fogli ("Esperienza · 1/2"). Sul desktop restano
   quattro fogli, sul telefono sono sei — e si sfogliano più in fretta, non più a lungo.
9. **Mobile: banda bianca in cima / crop della foto.** — FATTO, con una precisazione: la
   foto è inquadrata su **testa e mezzo busto** come chiesto, ma il fondo pieno in cima ora
   è **bianco**, non giallo — l'oro si è spostato sotto, dietro al testo, insieme al
   ribaltamento del punto 3. La banda bianca "di risulta" che avevi visto non c'è più: il
   colore arriva a filo del bordo, da una parte o dall'altra.
10. **Mappa mobile affollata.** — FATTO: la card non viene più rimpicciolita a 12rem (a
    quella misura i pulsanti di Google *erano* la mappa) e la nostra pillola "Apri in
    Google Maps" compare solo da tablet in su.
11. **L'errore in console cliccando l'indice.** — FATTO.

## ⚠️ Da chiedere ad Alessia prima di pubblicare

- **L'email.** Il CV riporta `alessiastefanello@gmail.com`, il sito pubblica
  `alessiastefanello.fisio@gmail.com`. Quale delle due?
- **Alcuni refusi nel CV**, resi qui nella forma che sembra corretta ma da confermare:
  *Kisesis medical* → Kinesis? · *Collaboratirce* → Collaboratrice · *Laura Triennale* →
  Laurea · *Strenght* → Strength · *NCSA* → NSCA? · *Phisiovit* → Physiovit?
- **Le Skills del CV** (lingue, database scientifici, soft skill) sono rimaste fuori dal
  sito: sono quello che un CV dice a chi assume, non quello su cui decide un paziente.
  Se le vuole, si aggiunge una quinta pagina.
- **Il consenso dei pazienti** resta il punto aperto di sempre: nelle foto ci sono persone
  riconoscibili, serve la liberatoria firmata di ognuna prima di andare online.

---

# Terzo giro (settembre 2026)

Le note del cliente dopo il secondo giro. Sotto, cosa è stato fatto.

1. **La linea fucsia in mezzo all'hero un po' più sottile.** — FATTO: da 50px a 36px.
   È una sola manopola (`--hero-blade` in `globals.css`): la lama e la colonna del testo
   si misurano entrambe su quella, così il testo resta centrato nell'oro visibile. Sul
   telefono il filetto sotto la foto era già sottile (4px) e resta com'è.
2. **Titoli troppo grandi rispetto al testo delle sezioni.** — FATTO: i titoli di sezione
   scendono di un gradino a ogni larghezza (30/36/48px invece di 36/48/60) e con loro i
   titoli dentro le fasce colorate (24/30 invece di 30/36), così restano un gradino sotto.
   Il nome nell'hero e nel footer non cambia.
3. **Prova con le fasce alternate destra/sinistra.** — In prova sul branch
   `alt-focus-alternati`: muscoloscheletrica a destra, pavimento pelvico a SINISTRA,
   domiciliare a destra. Il layout attuale resta questo branch; si sceglie dopo averli
   visti entrambi.
