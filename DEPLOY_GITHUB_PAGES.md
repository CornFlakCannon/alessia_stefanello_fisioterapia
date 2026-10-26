# Pubblicare il sito su GitHub Pages

Il sito non ha lato server (il form apre un `mailto:`, la mappa è un'immagine), quindi
`next build` lo esporta come HTML statico in `out/` e GitHub Pages lo serve gratis. Il
deploy è automatico: **ogni push su `main` mette online la nuova versione** tramite
`.github/workflows/deploy.yml`.

Cosa è già predisposto nel repo:

- `next.config.ts` — `output: "export"`, `images.unoptimized`, `basePath` letto da
  `NEXT_PUBLIC_BASE_PATH`.
- `app/site/basePath.ts` — `asset()`, che prefissa gli URL scritti a mano (le foto del
  manifesto `photos.ts`, il JPEG delle Olimpiadi). Next prefissa da solo i propri
  `_next/`, non le stringhe che gli passiamo noi.
- `public/.nojekyll` — impedisce a Jekyll di ignorare la cartella `_next/` (serve solo se
  un giorno si pubblicasse da branch invece che via Actions; costa zero tenerlo).
- `.github/workflows/deploy.yml` — build + deploy di `main`. Sceglie il `basePath` da solo:
  se esiste `public/CNAME` (dominio proprio) il sito sta alla radice, altrimenti sotto
  `/alessia_stefanello_fisioterapia`.

---

## 0. Le liberatorie

GitHub Pages è gratuito **solo su repo pubblici**, e un repo pubblico rende pubbliche le
foto in `public/foto/`, dove ci sono pazienti riconoscibili. **Le quattro liberatorie sono
firmate** (24/10/2026), una per ogni gruppo di foto di `scripts/liberatorie.mjs`, tutte con
sito, social e stampa spuntati. Le scansioni stanno in `LIBERATORIE_FIRMATE/`, gitignorata:
contengono nomi, date di nascita e telefoni, e **non entrano mai nel repo**.

Chi compare in una foto nuova firma prima che la foto vada online
(`docs/liberatorie/liberatoria-vuota.docx`).

## 1. Cosa va online

Solo `main`. La cliente ha scelto lo **scroll a blocchi** (ottobre 2026), che ora è `main`;
`variante/focus-alternati` resta nel repo ma non viene più pubblicata.

## 2. Attivare Pages

*Settings → Pages → Build and deployment → Source:* scegli **GitHub Actions** (non
"Deploy from a branch"). Un push su `main` fa partire il workflow, che si segue nel tab
*Actions*. Senza dominio il sito è su

```
https://cornflakcannon.github.io/alessia_stefanello_fisioterapia/
```

Se il workflow era già partito prima di questa impostazione, rilancialo da *Actions →
Deploy to GitHub Pages → Run workflow*.

## 3. Dominio proprio (~5-15 €/anno)

L'ordine conta: il `basePath` è scritto nella build, quindi tra il momento in cui GitHub
serve il sito alla radice del dominio e il momento in cui la build "da radice" è online, le
foto e gli stili non si caricano. Seguendo questi passi quella finestra dura un deploy
(~2 minuti).

1. **Compra il dominio** — preso: **`alessiastefanellofisioterapista.it`**, su **Aruba**. **Intestalo ad Alessia** (per un
   `.it` servono il suo codice fiscale o la P. IVA): il dominio è suo, non di chi le fa il
   sito. Tu ti fai dare l'accesso al pannello DNS.
2. **Verifica il dominio su GitHub**, prima di tutto il resto: *Settings del profilo (non
   del repo) → Pages → Add a domain*. GitHub dà un record `TXT`
   (`_github-pages-challenge-CornFlakCannon`): aggiungilo nel pannello DNS e premi
   *Verify*. Impedisce che qualcun altro possa agganciare il dominio al proprio Pages.
3. **DNS**, nel pannello del registrar. Prima **cancella** i record `A`/`AAAA` di `@` e il
   record di `www` che il registrar mette di default (pagina di parcheggio): se restano, una
   parte dei visitatori finisce lì. **Non toccare** `MX` e i `TXT` della posta, se ci sono.
   Su Aruba i default sono `A @ 62.149.128.40` (il parcheggio) e `www` → il dominio stesso;
   l'`MX` (`mx.alessiastefanellofisioterapista.it`) è la loro posta: resta.

   | tipo | nome | valore |
   |---|---|---|
   | `A` | `@` | `185.199.108.153` |
   | `A` | `@` | `185.199.109.153` |
   | `A` | `@` | `185.199.110.153` |
   | `A` | `@` | `185.199.111.153` |
   | `AAAA` | `@` | `2606:50c0:8000::153` |
   | `AAAA` | `@` | `2606:50c0:8001::153` |
   | `AAAA` | `@` | `2606:50c0:8002::153` |
   | `AAAA` | `@` | `2606:50c0:8003::153` |
   | `CNAME` | `www` | `cornflakcannon.github.io` |

   Gli `AAAA` (IPv6) sono facoltativi: senza, il sito va su IPv4, che arriva ovunque.
   (IP ufficiali di GitHub Pages, ricontrollati a ottobre 2026. Se cambiano, stanno su
   https://docs.github.com/pages → "Managing a custom domain".)
4. **Aspetta che il DNS risponda.** Quando questo restituisce i quattro IP, vai avanti:

   ```bash
   dig +short alessiastefanellofisioterapista.it
   dig +short www.alessiastefanellofisioterapista.it   # → cornflakcannon.github.io + i quattro IP
   ```

   **Aruba ha quattro nameserver e non si aggiornano insieme** (il 26/10 `dns2`, `dns3` e
   `dns4` avevano già i record nuovi, `dns.technorail.com` ancora il parcheggio). Finché
   uno è indietro, una parte dei visitatori — e il controllo di GitHub per il certificato —
   può finire sul vecchio indirizzo. Vai avanti quando tutti e quattro rispondono i
   quattro IP:

   ```bash
   for ns in dns.technorail.com dns2.technorail.com dns3.arubadns.net dns4.arubadns.cz; do
     echo "$ns: $(dig +short @$ns alessiastefanellofisioterapista.it | sort | tr '\n' ' ')"
   done
   ```

5. **Nel repo**: *Settings → Pages → Custom domain*, scrivi il dominio e *Save*. Subito
   dopo, crea `public/CNAME` (solo il dominio, una riga) e fai push:

   ```bash
   echo "alessiastefanellofisioterapista.it" > public/CNAME
   git add public/CNAME && git commit -m "pages: dominio" && git push
   ```

   I due passi vanno insieme. *Settings* è ciò che fa servire il sito sul dominio (con il
   deploy via Actions, GitHub **ignora** il file `CNAME`). Il file serve al workflow: è ciò
   che gli fa costruire il sito alla radice invece che sotto `/alessia_stefanello_fisioterapia`.
6. **HTTPS.** GitHub emette il certificato da solo (da qualche minuto a qualche ora). Quando
   la spunta **Enforce HTTPS** diventa selezionabile, attivala.
7. **Controlla**: `https://alessiastefanellofisioterapista.it` carica foto e mappa, `www.` e il vecchio
   indirizzo `cornflakcannon.github.io/alessia_stefanello_fisioterapia/` reindirizzano al
   dominio.

## 4. Dopo

- **Aggiornare il sito** = push su `main`. Un push su un altro branch non pubblica niente.
- **Tornare indietro** = `git revert <commit>` e push (oppure *Actions → Re-run* di un
  deploy precedente).
- **Anteprima identica alla produzione, in locale**:

  ```bash
  npm run build && npx serve out
  ```

  Per provarla sotto `/alessia_stefanello_fisioterapia` (com'è prima del dominio):
  `NEXT_PUBLIC_BASE_PATH=/alessia_stefanello_fisioterapia npm run build`, poi servire la
  cartella che *contiene* `out` rinominata `alessia_stefanello_fisioterapia`.
- **Costi**: hosting 0 €, dominio ~5-15 €/anno. Nessun limite pratico per un sito di
  questa taglia (Pages: 1 GB, 100 GB di banda al mese).
- `npm run dev` non cambia: `output: "export"` agisce solo su `next build`.

## 5. Farsi trovare su Google

Il sito fa già la sua parte: titolo e descrizione, URL canonico, anteprima per
WhatsApp/Facebook, dati strutturati da studio di fisioterapia, `robots.txt`, `sitemap.xml`
e favicon (vedi `app/site/seo.ts`). Tutti gli indirizzi seguono `public/CNAME`, quindi col
dominio a posto non c'è niente da toccare nel codice. Il resto si fa fuori, in quest'ordine:

1. **Google Search Console** (search.google.com/search-console) → *Aggiungi proprietà* →
   **Dominio** → il dominio. Chiede un record `TXT` su `@`: va nello stesso pannello DNS del
   §3 e non tocca né i record di GitHub né la posta. Meglio farlo dall'account Google di
   Alessia, o aggiungerla subito come proprietaria.
2. In Search Console: **Sitemap** → `sitemap.xml` → *Invia*.
3. **Controllo URL** sulla home → *Richiedi indicizzazione*. Lo stesso strumento
   (*Visualizza pagina sottoposta a scansione*) mostra l'HTML letto da Google: i testi di
   tutti i pannelli devono esserci, anche quelli che compaiono solo scorrendo.
4. **Test dei risultati multimediali** (search.google.com/test/rich-results) sull'URL: deve
   trovare un'attività locale senza errori.
5. **Anteprima dei link**: manda l'URL in una chat WhatsApp con te stesso — foto, titolo e
   descrizione. Facebook la tiene in cache: si rinfresca da
   developers.facebook.com/tools/debug.
6. **Profilo dell'attività su Google** (business.google.com). **È la cosa che pesa di più**
   per una ricerca come "fisioterapista Padova", più del sito: è il riquadro con la mappa in
   cima ai risultati. Va fatto da Alessia, col suo account. Nome, indirizzo e telefono
   **identici** a quelli del sito (`Alessia Stefanello — Fisioterapista`, +39 342 752 2370,
   l'indirizzo col CAP), categoria *Fisioterapista*, sito web = il dominio, foto dello
   studio. Google verifica che l'attività esista (cartolina, video o telefonata).
7. **Recensioni**: chiederle ai pazienti soddisfatti, sul profilo Google. Senza offrire
   niente in cambio, e senza ripubblicarle sul sito: la pubblicità sanitaria deve restare
   informativa — nel dubbio, chiedere all'Ordine.
8. Quando il profilo esiste (e se Alessia ha pagine social professionali), i loro link vanno
   in `sameAs` nei dati strutturati (`seo.ts`): dice a Google che sono la stessa attività.
