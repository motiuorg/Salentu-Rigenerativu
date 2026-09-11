# Salentu Rigenerativu

Mappa collaborativa del bioregione Salento: directory di organizzazioni, programmi e iniziative, ed eventi legati alla rigenerazione. Sito gemello di [Regenerant Catalunya Maps](https://motiuorg.github.io/Regenerant-Catalunya-Maps), basato sul sistema di design editoriale-organico di ReFi BCN e pubblicato come project page GitHub Pages di motiuorg.

## Struttura

Solo tre sezioni principali, alimentate dai database Notion del CRM e filtrate sul tag `salento` (colonna `2NDTAG` / `Select`):

- **/organizations/** — attori rigenerativi, con filtri per ruolo, territorio, temi e tag ontologici
- **/programs/** — programmi e iniziative collettive, con filtro per territorio
- **/events/** — calendario ed elenco eventi, ordinati per data

La home mostra il conteggio totale delle voci mappate, calcolato a build-time recuperando i record da Notion e filtrando quelli taggati `salento`.

## Esecuzione locale

```bash
npm install
npm run dev
# → http://localhost:4321/Salentu-Rigenerativu/
```

> Poiché il sito è configurato come project page (`/Salentu-Rigenerativu`), Astro lo serve sotto questo base path anche in development.

## Build

```bash
npm run build
# → dist/
```

Per testare la build di produzione:

```bash
npm run preview
```

## Integrazione Notion

1. L'integrazione Notion condivide i database del CRM (attori, programmi, eventi).
2. Le voci da mostrare sul sito sono quelle taggate con `salento` — la logica è in `src/lib/crm.ts` (`hasSalento`).
3. Gli ID dei database sono in `src/data/databases.yaml` (non sono segreti).
4. Per lo sviluppo locale, copia `.env.example` in `.env` e imposta `NOTION_API_KEY`; in produzione il token arriva dal secret `NOTION_API_KEY` del repository (GitHub Actions).

## Deploy

Il repository è configurato per il deploy automatico su GitHub Pages tramite GitHub Actions (`.github/workflows/deploy.yml`) a ogni push su `main`, con rebuild programmata ogni 6 ore per aggiornare i dati da Notion.

URL di destinazione: `https://motiuorg.github.io/Salentu-Rigenerativu/`

### Prima attivazione su GitHub Pages

1. In `https://github.com/motiuorg/Salentu-Rigenerativu/settings/pages`, sotto **Build and deployment** → **Source**, selezionare **GitHub Actions**.
2. Il workflow in `.github/workflows/deploy.yml` gestirà tutto dal push successivo.

## File principali

| File | Scopo |
|------|-------|
| `src/data/site.yaml` | Nome sito, URL, descrizione, nota legale |
| `src/data/databases.yaml` | Mapping dei database Notion (attori, programmi, eventi) |
| `src/lib/notion.ts` | Client Notion + normalizzazione record |
| `src/lib/crm.ts` | Normalizzazione CRM + filtro `hasSalento` |
| `src/pages/index.astro` | Home con conteggi e link alle tre sezioni |
| `src/pages/organizations.astro` | Directory organizzazioni |
| `src/pages/programs.astro` | Directory programmi e iniziative |
| `src/pages/events.astro` | Calendario/elenco eventi |
| `src/components/Nav.astro` | Voci di navigazione |
| `src/components/Footer.astro` | Link footer |
| `astro.config.mjs` | Site/base path per GitHub Pages |

## Licenze

- Codice: MIT
- Contenuti: CC BY-SA 4.0