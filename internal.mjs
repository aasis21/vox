import http from "node:http";
import { readBody, listen } from "./http-util.mjs";
import { renderHtml } from "./renderer.mjs";
import { streamTurn } from "./turn.mjs";

export async function startInternal({ session }) {
    const server = http.createServer(async (req, res) => {
        const url = new URL(req.url || "/", "http://127.0.0.1");

        try {
            if (req.method === "POST" && url.pathname === "/turn") {
                const raw = await readBody(req);
                const body = raw ? JSON.parse(raw) : {};
                await streamTurn(session, body?.text, res);
                return;
            }

            if (req.method === "GET") {
                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                res.end(renderHtml(session?.id ?? "vox"));
                return;
            }

            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("not found");
        } catch (err) {
            if (!res.headersSent) {
                res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
            }
            res.end(err?.message || String(err));
        }
    });

    await listen(server, 0);
    return { server, port: server.address().port };
}

export function closeInternal(state) {
    state?.server?.close();
}
