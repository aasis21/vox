// Voice facade: one per vox process. Hides the internal turn server, the
// fungible front proxy (4321), and the shared registry behind start/stop/who.
import { basename } from "node:path";
import { PUBLIC_PORT } from "./config.mjs";
import { renderHtml } from "./renderer.mjs";
import { streamTurn } from "./turn.mjs";
import { startInternal, closeInternal } from "./internal.mjs";
import { ensureFront, closeFront } from "./front.mjs";
import * as registry from "./registry.mjs";

const URL = `http://127.0.0.1:${PUBLIC_PORT}/`;

export function createVoice(session) {
    const id = session?.sessionId || `s-${process.pid}`;
    const name = basename(process.cwd());
    let internal = null;
    let front = null;

    return {
        id,
        name,
        url: URL,
        async start() {
            if (!internal) internal = await startInternal({ session });
            registry.register(id, { name, internalPort: internal.port, pid: process.pid }, true);
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
        stop() {
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
