#!/usr/bin/env node
/**
 * Writes this repo's live OpenAPI document to docs/api/openapi.json.
 *
 * Variant: Express + swagger-jsdoc (insurance_be_v2, hr_be,
 * bsrealtyllc-be-v2, auth_be_v2). These repos already build a complete
 * OpenAPI document for swagger-ui-express to mount live — this script just
 * requires that module's default export and writes it to disk instead of
 * serving it. Never edit the JSON output directly; edit the swagger-jsdoc
 * `options` (tags, security schemes, JSDoc comments on routes) or
 * docs/api/descriptions.yaml (via scripts/enrich_openapi.py) instead.
 *
 * Wire into package.json:
 *   "generate:openapi": "npm run build && node scripts/generate-openapi.js"
 *
 * Adjust SPEC_MODULE_PATH below to match where each repo's build output
 * actually puts the compiled swagger module — don't assume it's the same
 * across repos.
 */

const fs = require("fs");
const path = require("path");

// hr_be's build script compiles src/ -> dist/src/, so its swagger.ts
// (which does `export default swaggerJsdoc(options)`) lands here. Update
// this path for repos with a different build layout (e.g. bsrealtyllc-be-v2
// isn't compiled at all — see the CommonJS notes below if this repo has no
// build step).
const SPEC_MODULE_PATH = "../dist/src/swagger";

const OUTPUT_PATH = path.join(__dirname, "..", "docs", "api", "openapi.json");

const mod = require(SPEC_MODULE_PATH);
const spec = mod.default ?? mod;

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(spec, null, 2));

console.log(`Wrote OpenAPI spec to ${OUTPUT_PATH}`);
