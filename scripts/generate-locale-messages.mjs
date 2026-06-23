/**
 * Generates ur/de/ar/fr message files from en.json using Google Cloud Translation API.
 * Usage: GOOGLE_TRANSLATE_API_KEY=xxx node scripts/generate-locale-messages.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "..", "messages");
const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

const TARGETS = ["ur", "de", "ar", "fr"];

async function translateText(text, target) {
  if (!text || !text.trim()) return text;
  if (!apiKey) throw new Error("GOOGLE_TRANSLATE_API_KEY is required");

  const url = new URL("https://translation.googleapis.com/language/translate/v2");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source: "en", target, format: "text" }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Translate failed (${res.status}): ${err}`);
  }

  const json = await res.json();
  return json.data.translations[0].translatedText;
}

async function translateObject(obj, target) {
  if (typeof obj === "string") {
    await new Promise((r) => setTimeout(r, 50));
    return translateText(obj, target);
  }
  if (Array.isArray(obj)) {
    return Promise.all(obj.map((item) => translateObject(item, target)));
  }
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [key, value] of Object.entries(obj)) {
      out[key] = await translateObject(value, target);
    }
    return out;
  }
  return obj;
}

async function main() {
  const enPath = path.join(messagesDir, "en.json");
  const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

  for (const target of TARGETS) {
    console.log(`Translating to ${target}...`);
    const translated = await translateObject(en, target);
    const outPath = path.join(messagesDir, `${target}.json`);
    fs.writeFileSync(outPath, JSON.stringify(translated, null, 2) + "\n", "utf8");
    console.log(`Wrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
