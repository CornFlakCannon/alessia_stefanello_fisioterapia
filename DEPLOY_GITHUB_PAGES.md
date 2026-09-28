# Pubblicare il sito su GitHub Pages

Il sito è una pagina sola senza lato server (il form apre un `mailto:`, la mappa è un
`<iframe>`), quindi `next build` lo esporta come HTML statico in `out/` e GitHub Pages lo
serve gratis. Il deploy è automatico: **ogni push su `main` mette online la nuova
versione** tramite `.github/workflows/deploy.yml`.

Cosa è già predisposto nel repo:

- `next.config.ts` — `output: "export"`, `images.unoptimized`, `basePath` letto da
  `NEXT_PUBLIC_BASE_PATH`.
- `app/site/basePath.ts` — `asset()`, che prefissa gli URL scritti a mano (le foto del
  manifesto `photos.ts`, il JPEG delle Olimpiadi). Next prefissa da solo i propri
  `_next/`, non le stringhe che gli passiamo noi.
- `public/.nojekyll` — impedisce a Jekyll di ignorare la cartella `_next/` (serve solo se
  un giorno si pubblicasse da branch invece che via Actions; costa zero tenerlo).
- `.github/workflows/deploy.yml` — build + deploy. Sceglie il `basePath` da solo: se
  esiste `public/CNAME` (dominio proprio) il sito sta alla radice, altrimenti sotto
  `/alessia_stefanello_fisioterapia`. Non c'è niente da cambiare a mano quando arriva il dominio.

---

## 0. Prima di rendere pubblico il repo

GitHub Pages è gratuito **solo su repo pubblici** (sui privati serve GitHub Pro). Rendere
pubblico il repo rende pubbliche le foto in `public/foto/`, in cui ci sono pazienti
riconoscibili — **prima servono le liberatorie firmate** (vedi `FOTO_BRIEF.md`, sezione
Privacy). Gli originali in `FOTO_ORIGINALI/` sono gitignorati e non finiscono online.

Rendere pubblico: *Settings → General → Danger Zone → Change visibility → Public*.

## 1. Cosa va online: i tre branch, uno accanto all'altro

Il workflow pubblica **tutti e tre** i branch in un solo deploy, così la cliente può
confrontarli con tre link invece di aspettare uno scambio:

| percorso | branch |
|---|---|
| `/` | `main` — il sito |
| `/scroll-a-blocchi/` | `variante/scroll-a-blocchi` |
| `/focus-alternati/` | `variante/focus-alternati` |

Un push su uno qualunque dei tre ricostruisce tutti e tre dalle loro punte. Le varianti
sono escluse dall'indicizzazione (`robots.txt` generato dal workflow). L'ambiente
`github-pages` accetta deploy da `main` e da `variante/*` (*Settings → Environments →
github-pages → Deployment branches*): senza la seconda regola un push su una variante
fallisce al passo *deploy*.

Scelta la versione: si unisce il suo branch in `main` e si tolgono le varianti dal ciclo
`for` di `deploy.yml`.

## 2. Attivare Pages

*Settings → Pages → Build and deployment → Source:* scegli **GitHub Actions** (non
"Deploy from a branch"). Basta questo: il push del punto 1 fa partire il workflow, che
si segue nel tab *Actions*. Al termine il sito è su

```
https://cornflakcannon.github.io/alessia_stefanello_fisioterapia/
```

Se il workflow era già partito prima di questa impostazione, rilancialo da *Actions →
Deploy to GitHub Pages → Run workflow*.

## 3. Dominio proprio (~5 €/anno)

1. **Compra il dominio** dal registrar che preferisci (es. `alessiastefanello.it`).
2. **DNS**, nel pannello del registrar:

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

   (Gli IP sono quelli ufficiali di GitHub Pages; se cambiano stanno in
   https://docs.github.com/pages → "Managing a custom domain".)
3. **Nel repo**: crea `public/CNAME` con dentro solo il dominio, una riga:

   ```bash
   echo "alessiastefanello.it" > public/CNAME
   git add public/CNAME && git commit -m "pages: dominio" && git push
   ```

   È questo file che fa scegliere al workflow il `basePath` vuoto: da qui in poi il sito
   sta alla radice del dominio. Committarlo (invece di impostare solo il dominio dalla
   UI) evita che un deploy successivo lo perda.
4. *Settings → Pages → Custom domain*: scrivi il dominio e *Save*. GitHub controlla il
   DNS (può volerci da qualche minuto a qualche ora per la propagazione) e poi emette il
   certificato. Quando la spunta **Enforce HTTPS** diventa selezionabile, attivala.
5. Consigliato: *Settings (profilo) → Pages → Add a domain* e verifica il dominio con il
   record `TXT` che ti indica — impedisce che qualcun altro possa agganciarselo su Pages.

`www.alessiastefanello.it` reindirizza da solo al dominio principale.

## 4. Dopo

- **Aggiornare il sito** = push su `main` (o su una variante, per la sua anteprima). Un
  push su un altro branch non pubblica niente.
- **Tornare indietro** = `git revert <commit>` e push (oppure *Actions → Re-run* di un
  deploy precedente).
- **Anteprima identica alla produzione, in locale**:

  ```bash
  npm run build && npx serve out
  ```

  Per provare la variante sotto `/alessia_stefanello_fisioterapia`:
  `NEXT_PUBLIC_BASE_PATH=/alessia_stefanello_fisioterapia npm run build`, poi servire la cartella che
  *contiene* `out` rinominata `alessia_stefanello_fisioterapia`.
- **Costi**: hosting 0 €, dominio ~5 €/anno. Nessun limite pratico per un sito di
  questa taglia (Pages: 1 GB, 100 GB di banda al mese).
- `npm run dev` non cambia: `output: "export"` agisce solo su `next build`.
