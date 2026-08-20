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
