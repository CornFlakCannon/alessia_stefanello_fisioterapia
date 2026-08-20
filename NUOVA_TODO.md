# DESKTOP

1. Scheda contatti in alto a sx deve essere a comparsa
Riprendi il motivo del mobile, il tasto deve contenere la foto avatar di Alessia e dei richiami a telefono ed email.
On click deve scendere un menu a comparsa contenente le informazioni che ora sono sempre visibili nella scheda del contatto.
Semplicemente la nascondiamo per declutter.

2. Togliamo la mascotte dal sito

## HERO

1. Entrata foto su sfondo giallo da dx
Riprendiamo il leitmotiv delle sezioni che entrano da destra per far entrare sfondo giallo e foto.

Entrano in auto animation al loading del sito. Togliamo il video e mettiamo la foto presente in "./FOTO_ORIGINALI/HERO_PHOTO.png". La foto in png ha già lo sfondo trasparente, risolviamo qualsiasi problema di colore.
Diamole leggero rilievo a fine animazione con uno scale di 1.1 e una shadow sotto - questo effetto rimpiazza il leggero effetto di opacità e y++ attualmente in vigore.

2. Testo a sx CENTRATO con il RUOLO a 2 stanghette sx e dx
Centriamo il testo a sx tenendo il ruolo con 2 stanghette sx e dx tipo
"Alessia Stefanello"
"- Fisioterapista / OMTP -"
"..."

3. Rimuovere pulsante CONTATTAMI / numero, rimpiazzare con indirizzo

4. Ristrutturare lievemente toc 

Lavoro in ambito:

"A Domicilio" -> "Fisioterapia Domiciliare"

Separiamo formazione dal resto, tenendola un po' staccata:
"Formazione" -> "La mia formazione"

5. Linea verticale fuchsia nell'hero
Aggiungiamo un secondo contenitore berry che scrolla in anticipando il giallo dell'hero di qualche frame
cosa che accade sempre alla landing in auto, non allo scroll.

Il giallo lo va a coprire quasi totalmente, lasciando una barra di max 50px.

# Muscoloscheletrica

1. Metà già presente senza testo sport e poi compare
Come in tutte le sezioni successive, evitiamo la comparsa della sezione laterale dx.
Teniamola già in view e cicliamo solamente le foto con lo scroll.

La sezione focus appare vuota all'inizio con solo le foto, allo scroll si popola del testo e del logo delle olimpiadi, che entrano da dx.

2. Ingrandire logo olimpiadi nel focus

# Pavimento pelvico

1. Foto croppata sotto + foto lettino
Nel focus del pavimento pelvico mettiamo in duotone le foto ./FOTO_ORIGINALI/LETTINO.jpg e ./FOTO_ORIGINALI/PELVICO_CROPPATA.jpg
Rimuoviamo l'animazione lottie della tizia che spelvica.

2. Anche qui sezione che parte direttamente con la metà divisa testo a comparsa dopo

# Fisioterapia a domicilio

1. Togliere raggio azione su mappa e focus Padova centro
Togliamo il raggio d'azione in espansione e focalizziamo Padova Centro.

# Contattami

1. Duotone foto background + contrasto
La foto in background del contattami non è leggibile.
Aumentiamo contrasto e visibilità e ingrandiamo il testo della form contattami per assicurarci che sia leggibile.
Caratteri form + grandi x foto sotto

# Formazione

1. Compiliamo la formazione leggendo il curriculum in ./FOTO_ORIGINALI/CV_Alessia_Stefanello_2026.pdf 
Se le informazioni sono tante e non fittano, facciamo un'animazione di rimpiazzo laterale tipo foglio che si sovrappone
da dx verso sx entra scale 1.2 con shadow e arriva a scale 1 senza shadow così sembra che si sovrapponga, per le pagine successive.
Lo stesso vale per il mobile.

# MOBILE 

NEL MOBILE MANTENIAMO LE ANIMAZIONI DI SLIDE IN DELLE SEZIONI FOCUS LATERALI!!!

1. Top background full
Nel mobile on top c'è una banda bianca... togliamola e facciamo andare lo sfondo giallo fino in cima.
Anche qui la foto è già presente, ma la croppiamo in modo che si vedano la testa e mezzo busto, diamo importanza al viso.

2. Mappa mobile in anziani cluttered
La mappa nella versione mobile ha troppi pulsanti in overlap e non si vede dove punta.
Proviamo a declutterarla.


# ATTENZIONE

[browser] Uncaught NotFoundError: Element.setPointerCapture: Invalid pointer id
    at ScrollShell.useEffect.handlePointerDown (app/ScrollShell.tsx:116:30)
  114 |       dragging = true;
  115 |       lastPointerY = e.clientY;
> 116 |       mainContainer.current?.setPointerCapture(e.pointerId);
      |                              ^
  117 |     };
  118 |     const handlePointerMove = (e: PointerEvent) => {
  119 |       if (!dragging) return;

Errore dopo aver clickato su uno dei TOC a inizio sito
