![@typhonjs-tcg/scrydex](https://i.imgur.com/JlXSuWa.jpeg)

[![NPM](https://img.shields.io/npm/v/@typhonjs-tcg/scrydex.svg?label=npm)](https://www.npmjs.com/package/@typhonjs-tcg/scrydex)
[![Code Style](https://img.shields.io/badge/code%20style-allman-yellowgreen.svg?style=flat)](https://en.wikipedia.org/wiki/Indent_style#Allman_style)
[![License](https://img.shields.io/badge/license-MPLv2-yellowgreen.svg?style=flat)](https://github.com/typhonjs-tcg/scrydex/blob/master/LICENSE)
[![API Docs](https://img.shields.io/badge/API%20Documentation-476ff0)](https://typhonjs-tcg.github.io/scrydex/)
[![Discord](https://img.shields.io/discord/737953117999726592?label=TyphonJS%20Discord)](https://typhonjs.io/discord/)
[![Twitch](https://img.shields.io/twitch/status/typhonrt?style=social)](https://www.twitch.tv/typhonrt)

Note: This project is still in active development with an initial release very soon.
The best way to stay in touch is to join the [TyphonJS Discord](https://typhonjs.io/discord/)
and keep tabs in the `typhonjs-tcg` / `#scrydex` channel.

Scrydex is a **high-performance Magic: The Gathering collection toolkit**
for converting, organizing, and exporting MTG card data. Scrydex provides both
a **CLI tool** and a **TypeScript SDK**, enabling collectors and developers to
integrate MTG collection data into reliable long-term workflows. Scrydex emphasizes
**canonical card data**, **deterministic sorting**, and **portable open formats**,
ensuring that a collection can remain usable and maintainable for years to come.

It converts exports from deck builders and collection apps into **canonical,
feature-rich datasets** powered by the official [Scryfall card database](https://scryfall.com/).
The entire workflow can run **fully offline** using local Scryfall bulk data,
allowing collectors to build reproducible MTG data pipelines without relying
on external services.

Scrydex focuses on **final mile collection management** transforming
limited CSV exports presently from [ManaBox](https://www.manabox.app/) and
[Archidekt](https://archidekt.com/) into **rich, normalized collection databases**
suitable for:

- Rich spreadsheet reporting and inventory tracking providing:
  - Precise physical collection organization with rarity normalization.
  - Segmentation by the game formats you play.
  - Highlighting of newly acquired cards.
  - Color coded collection, binder, deck separation.
  - Identification of high-value cards for binder storage.
- Long-term archival storage.
- Export to CSV / text formats.
- Export to streamlined JSON datasets for LLM / AI analysis reducing token consumption.
- Analytics and custom tooling.
- Reproducible data pipelines.

At the core of Scrydex is **CardDB**, a structured JSON collection format that
preserves the **maximum amount of card metadata** available from Scryfall.
Unlike typical CSV collection exports that contain only a handful of fields,
CardDB records include full card identity, oracle data, set information,
rarity, type details, and additional metadata that can power advanced
queries, reporting, and custom applications.

## Core Principles

Scrydex is designed around a small set of guiding principles:

- **Canonical Data**
  Collections are resolved against the official Scryfall dataset to ensure
  consistent and accurate card metadata.

- **Deterministic Workflows**
  Scrydex emphasizes reproducible pipelines so the same inputs always produce
  the same structured collection output.

- **Offline First**
  All operations can run locally using Scryfall bulk data, enabling reliable
  collection management without depending on external services.

- **Rich Data Preservation**
  The CardDB format stores significantly more information than typical CSV
  exports, enabling advanced queries, analytics, and long-term archival use.

- **Open and Portable Formats**
  Collection data is stored in structured JSON designed to remain usable
  across tools, scripts, and future software systems.

### Import Limitations

Currently Scrydex supports CSV exports from **ManaBox** and **Archidekt**.

The primary requirement for importing a collection is that each card entry
includes a **Scryfall ID** along with the card quantity. This identifier
allows Scrydex to reliably resolve cards against the local Scryfall dataset
and enrich the collection with full canonical metadata.

Unfortunately there is **no universal CSV standard** for MTG collection
services and many apps do not include Scryfall card identifiers in their
exports. Without a stable identifier it becomes difficult to deterministically
match cards across sets, printings, and variants.

Support for additional collection services may be added in the future.

For the best compatibility today, it is recommended to use a collection
service that includes **Scryfall IDs in its export data** such as ManaBox
or Archidekt.
