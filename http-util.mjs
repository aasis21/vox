// Small HTTP helpers shared by the internal + front servers.

/** Read a request body as UTF-8 text, rejecting payloads over the limit. */
export function readBody(req, limitBytes = 256 * 1024) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        req.on("data", (c) => {
            size += c.length;
            if (size > limitBytes) { reject(new Error("payload too large")); req.destroy(); return; }
            chunks.push(c);
        });
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
    });
}

/** Promisified server.listen on 127.0.0.1; rejects on bind error (e.g. EADDRINUSE). */
export function listen(server, port) {
    return new Promise((resolve, reject) => {
        const onError = (err) => { server.off("listening", onListening); reject(err); };
        const onListening = () => { server.off("error", onError); resolve(); };
        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(port, "127.0.0.1");
    });
}

/** Begin a Server-Sent Events stream and return an emit(obj) function. */
export function sse(res) {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
    });
    return (obj) => { try { res.write(`data: ${JSON.stringify(obj)}\n\n`); } catch {} };
}
