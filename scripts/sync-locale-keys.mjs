import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "..", "messages");

function deepMergeMissing(target, source, overrides = {}) {
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const overrideVal = overrides[key];
    if (
      srcVal &&
      typeof srcVal === "object" &&
      !Array.isArray(srcVal)
    ) {
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {};
      }
      deepMergeMissing(
        target[key],
        srcVal,
        overrideVal && typeof overrideVal === "object" ? overrideVal : {},
      );
    } else if (target[key] === undefined) {
      target[key] = overrideVal !== undefined ? overrideVal : srcVal;
    }
  }
  return target;
}

const en = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));

const overrides = fs.existsSync(path.join(__dirname, "locale-overrides.json"))
  ? JSON.parse(fs.readFileSync(path.join(__dirname, "locale-overrides.json"), "utf8"))
  : {};

for (const locale of ["ur", "de", "ar", "fr"]) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  const current = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let merged = deepMergeMissing(structuredClone(current), en, {});
  if (overrides[locale]) {
    merged = applyOverrides(merged, overrides[locale]);
  }
  fs.writeFileSync(filePath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  console.log(`Updated ${locale}.json`);
}

function applyOverrides(target, source) {
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    if (srcVal && typeof srcVal === "object" && !Array.isArray(srcVal)) {
      target[key] = target[key] && typeof target[key] === "object" ? target[key] : {};
      applyOverrides(target[key], srcVal);
    } else {
      target[key] = srcVal;
    }
  }
  return target;
}
