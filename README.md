# LucioBot

**A modular WhatsApp bot built with TypeScript and `whatsapp-web.js`.**

LucioBot is a **legacy development project from 2022**, organized around message-command modules, WhatsApp Web sessions and several utility integrations. The repository is useful as a reference for that architecture; its pinned 2022 dependencies and third-party APIs should not be assumed to work unchanged today.

| Messaging | Commands | Integrations |
| :-- | :-- | :-- |
| WhatsApp Web client, sessions and QR-based authentication code. | Admin, groups, help, stickers, polls and reminders. | Telegram, translation, YouTube, TikTok and other service modules. |

## Explore the code

- [`luciobot.ts`](luciobot.ts) — application entrypoint.
- [`modules/`](modules/) — independently organized command handlers.
- [`lib/`](lib/) — reusable integrations and utilities.
- [`prisma/schema.prisma`](prisma/schema.prisma) — persistence model.
- [`.env.template`](.env.template) — configuration variable names.

## Local development

The repository's `package.json` declares **Node.js 16.14.0** and these scripts:

```bash
npm install
npm run build
npm start
```

Before launching, review `.env.template` and provide your own required account, browser, database and integration settings. The file lists variable names only; it is **not** a ready-to-run environment file.

> [!CAUTION]
> This is historical code, not a supported WhatsApp deployment guide. Browser automation, messaging library compatibility and the behavior of external integrations may have changed. Do not use production accounts or sensitive credentials until you've reviewed and updated its dependencies.

## Stack and project status

TypeScript, Node.js, `whatsapp-web.js`, Prisma, Telegram integrations and module-based command dispatch. A Prisma migration history and a test scaffold are present, but no current compatibility or end-to-end run has been verified.

The package manifest declares **ISC** as its license; no standalone license file was found.
