// Voice facade: one per vox process. Hides the internal turn server, the
// fungible front proxy (4321), and the shared registry behind start/stop/who.
import { basename } from "node:path";
import { PUBLIC_PORT } from "./config.mjs";
import { renderHtml } from "./renderer.mjs";
import { streamTurn } from "./turn.mjs";
import { startInternal, closeInternal } from "./internal.mjs";
import { ensureFront, closeFront } from "./front.mjs";
import * as registry from "./registry.mjs";
import { readSummary } from "./store.mjs";
import { launchApp } from "./browser.mjs";

const URL = `http://127.0.0.1:${PUBLIC_PORT}/`;

export function createVoice(session) {
    const id = session?.sessionId || `s-${process.pid}`;
    const name = basename(process.cwd());
    let internal = null;
    let front = null;
    let summaryTimer = null;

    // The CLI derives a short "chat title" (summary) for the session as the
    // conversation grows. Prefer the live session RPC; fall back to reading the
    // CLI's own session store (same source as the CLI session picker) so the Vox
    // picker shows a real title even when the experimental RPC yields nothing.
    async function fetchSummary() {
        try {
            const snap = await session?.rpc?.metadata?.snapshot?.();
            const live = (snap && (snap.summary || snap.initialName)) || "";
            if (live) return live;
        } catch {}
        return readSummary(session?.sessionId);
    }
    async function refreshSummary() {
        const s = await fetchSummary();
        if (s) registry.setSummary(id, s);
    }

    return {
        id,
        name,
        url: URL,
        async start() {
            if (!internal) internal = await startInternal({ session });
            registry.register(id, { name, internalPort: internal.port, pid: process.pid }, true);
            refreshSummary().catch(() => {});
            if (!summaryTimer) {
                summaryTimer = setInterval(() => { refreshSummary().catch(() => {}); }, 15000);
                summaryTimer.unref?.();
            }
            if (!front) {
                front = await ensureFront({
                    selfId: id,
                    selfInternalPort: internal.port,
                    servePage: (res) => {
                        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                        res.end(renderHtml(id));
                    },
                    localTurn: (text, res) => streamTurn(session, text, res),
                    localListen: (res) => internal.addListenClient(res),
                });
            }
            return URL;
        },
        // Open the UI as its own standalone app window (Chrome/Edge app mode),
        // reusing the existing window if one is already open. Returns a small
        // status object the command handler turns into a log line.
        openApp() {
            if (registry.isAppAlive()) return { ok: true, reused: true };
            const r = launchApp(URL);
            if (r.ok && Number.isInteger(r.pid)) registry.setApp(r.pid);
            return r;
        },
        stop() {
            if (summaryTimer) { clearInterval(summaryTimer); summaryTimer = null; }
            registry.unregister(id);
            closeFront(front);
            closeInternal(internal);
            front = null;
            internal = null;
        },
        activate() {
            return registry.setActive(id);
        },
        who() {
            return registry.list();
        },
    };
}
