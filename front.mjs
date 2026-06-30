import http from "node:http";
import { PUBLIC_PORT } from "./config.mjs";
import { listen, readBody } from "./http-util.mjs";
import * as registry from "./registry.mjs";
import { readHistory } from "./store.mjs";

function sendJson(res, status, obj) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(obj));
}

async function readJson(req) {
    const raw = await readBody(req);
    if (!raw.trim()) return {};
    return JSON.parse(raw);
}

function pipeTurn(session, body, res) {
    const upstream = http.request(
        {
            hostname: "127.0.0.1",
            port: session.internalPort,
            path: "/turn",
            method: "POST",
            headers: { "Content-Type": "application/json" },
        },
        (proxyRes) => {
            res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
            proxyRes.pipe(res);
        },
    );

    upstream.on("error", () => {
        if (!res.headersSent) res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "session unavailable" }));
    });
    upstream.end(JSON.stringify(body));
}

const SSE_HEADERS = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
};

// Keep an SSE socket open even when there's no target session yet, so the browser
// EventSource doesn't reconnect-storm; it reconnects with a session once one exists.
function idleListen(res) {
    res.writeHead(200, SSE_HEADERS);
    res.write(": vox-listen idle\n\n");
    const ping = setInterval(() => { try { res.write(": ping\n\n"); } catch {} }, 25_000);
    res.on("close", () => clearInterval(ping));
}

function pipeListen(session, res) {
    const upstream = http.request(
        { hostname: "127.0.0.1", port: session.internalPort, path: "/listen", method: "GET" },
        (proxyRes) => {
            res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
            proxyRes.pipe(res);
        },
    );
    upstream.on("error", () => { try { res.end(); } catch {} });
    res.on("close", () => { try { upstream.destroy(); } catch {} });
    upstream.end();
}

export async function ensureFront({ selfId, selfInternalPort, servePage, localTurn, localListen }) {
    if (registry.isFrontAlive()) return { hosting: false };

    const server = http.createServer(async (req, res) => {
        try {
            const url = new URL(req.url ?? "/", "http://127.0.0.1");

            if (req.method === "GET" && url.pathname === "/") {
                servePage(res);
                return;
            }

            if (req.method === "GET" && url.pathname === "/sessions") {
                sendJson(res, 200, registry.list());
                return;
            }

            // Full prior conversation for a session, read from the CLI's own store,
            // so the transcript shows everything that happened before Vox attached.
            if (req.method === "GET" && url.pathname === "/history") {
                const sid = url.searchParams.get("session") || registry.list().active || "";
                const turns = await readHistory(sid);
                sendJson(res, 200, { session: sid, turns });
                return;
            }

            // SSE channel that speaks assistant replies from typed CLI turns.
            if (req.method === "GET" && url.pathname === "/listen") {
                const listed = registry.list();
                const target = url.searchParams.get("session") || listed.active;
                if (!target) { idleListen(res); return; }
                if (target === selfId) { localListen(res); return; }
                const r = registry.load();
                const session = r.sessions[target];
                if (!session) { idleListen(res); return; }
                pipeListen(session, res);
                return;
            }

            if (req.method === "POST" && url.pathname === "/select") {
                const body = await readJson(req);
                const active = registry.setActive(body.session);
                sendJson(res, 200, { active });
                return;
            }

            if (req.method === "POST" && url.pathname === "/turn") {
                const body = await readJson(req);
                const listed = registry.list();
                const target = body.session || listed.active;
                if (!target) {
                    sendJson(res, 404, { error: "no active session" });
                    return;
                }
                if (target === selfId) {
                    await localTurn(body.text, res);
                    return;
                }

                const r = registry.load();
                const session = r.sessions[target];
                if (!session) {
                    sendJson(res, 404, { error: "session not found" });
                    return;
                }
                pipeTurn(session, body, res);
                return;
            }

            sendJson(res, 404, { error: "not found" });
        } catch (err) {
            sendJson(res, 400, { error: err instanceof Error ? err.message : String(err) });
        }
    });

    try {
        await listen(server, PUBLIC_PORT);
    } catch (err) {
        server.close();
        if (err?.code === "EADDRINUSE") return { hosting: false };
        throw err;
    }

    registry.setFront(process.pid);
    return { server, hosting: true };
}

export function closeFront(state) {
    state?.server?.close();
}
