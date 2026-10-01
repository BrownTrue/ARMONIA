import { createServer } from "node:http";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createPhonologyReviewDecision, getPhonologyReviewItems, summarizePhonologyReview } from "../lib/asset-bank/phonology-review.ts";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const htmlPath = fileURLToPath(new URL("./asset-phonology-review.html", import.meta.url));
const imageRoot = join(projectRoot, "public/armonia-assets/images");
export const DEFAULT_DECISIONS_PATH = join(projectRoot, "tmp/asset-phonology-review/decisions.json");

export function createDecisionStore(filePath = DEFAULT_DECISIONS_PATH) {
  return {
    filePath,
    async load() {
      try {
        const parsed = JSON.parse(await readFile(filePath, "utf8"));
        return parsed?.version === 1 && parsed.decisions && typeof parsed.decisions === "object" ? parsed.decisions : {};
      } catch (error) {
        if (error?.code === "ENOENT") return {};
        throw error;
      }
    },
    async save(decisions) {
      await mkdir(dirname(filePath), { recursive: true });
      const temporaryPath = `${filePath}.${process.pid}.tmp`;
      await writeFile(temporaryPath, `${JSON.stringify({ version: 1, decisions }, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
      await rename(temporaryPath, filePath);
    },
  };
}

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error("payload_too_large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function createReviewServer({ store = createDecisionStore() } = {}) {
  const items = getPhonologyReviewItems();
  const itemById = new Map(items.map((item) => [item.asset.id, item]));
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      if (request.method === "GET" && url.pathname === "/") {
        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
        response.end(await readFile(htmlPath, "utf8"));
        return;
      }
      if (request.method === "GET" && url.pathname === "/api/state") {
        const decisions = await store.load();
        sendJson(response, 200, { items: items.map((item) => ({ ...item, decision: decisions[item.asset.id] })), summary: summarizePhonologyReview(items, decisions) });
        return;
      }
      if (request.method === "POST" && url.pathname === "/api/decisions") {
        const body = await readJson(request), item = itemById.get(body?.assetId);
        if (!item) return sendJson(response, 404, { error: "Candidato non trovato." });
        const result = createPhonologyReviewDecision(item, body.status, body.metadata);
        if (!result.ok) return sendJson(response, 422, { error: "Correzione non valida.", details: result.errors });
        const decisions = await store.load();
        decisions[item.asset.id] = result.decision;
        await store.save(decisions);
        sendJson(response, 200, { decision: result.decision, summary: summarizePhonologyReview(items, decisions) });
        return;
      }
      if (request.method === "GET" && url.pathname.startsWith("/images/")) {
        const filename = decodeURIComponent(url.pathname.slice(8));
        if (!/^[a-z0-9][a-z0-9._-]*\.webp$/.test(filename)) return sendJson(response, 400, { error: "Immagine non valida." });
        const body = await readFile(join(imageRoot, filename));
        response.writeHead(200, { "Content-Type": extname(filename) === ".webp" ? "image/webp" : "application/octet-stream", "Cache-Control": "no-store" });
        response.end(body);
        return;
      }
      sendJson(response, 404, { error: "Risorsa non trovata." });
    } catch (error) {
      const status = error?.message === "payload_too_large" ? 413 : 500;
      sendJson(response, status, { error: status === 413 ? "Richiesta troppo grande." : "Errore locale del revisore." });
    }
  });
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const port = Number(process.env.ASSET_PHONOLOGY_REVIEW_PORT || 4173);
  const server = createReviewServer();
  server.listen(port, "127.0.0.1", () => console.log(`Revisore fonologico ARMONIA: http://localhost:${port}`));
}
