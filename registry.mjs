import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { DIR, REGISTRY } from "./config.mjs";

function emptyRegistry() {
    return { active: null, front: null, sessions: {} };
}

function normalize(r) {
    if (!r || typeof r !== "object") return emptyRegistry();
    return {
        active: typeof r.active === "string" ? r.active : null,
        front: r.front && Number.isInteger(r.front.pid) ? { pid: r.front.pid } : null,
        sessions: r.sessions && typeof r.sessions === "object" ? r.sessions : {},
    };
}

export function load() {
    try {
        return normalize(JSON.parse(readFileSync(REGISTRY, "utf8")));
    } catch {
        return emptyRegistry();
    }
}

export function save(r) {
    mkdirSync(DIR || dirname(REGISTRY), { recursive: true });
    writeFileSync(REGISTRY, `${JSON.stringify(normalize(r), null, 2)}\n`);
}

export function pidAlive(pid) {
    if (!Number.isInteger(pid) || pid <= 0) return false;
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

export function prune(r) {
    r = normalize(r);
    for (const [id, session] of Object.entries(r.sessions)) {
        if (!pidAlive(session?.pid)) delete r.sessions[id];
    }
    if (r.active && !r.sessions[r.active]) r.active = null;
    if (r.front && !pidAlive(r.front.pid)) r.front = null;
    return r;
}

export function register(id, { name, summary, internalPort, pid }, makeActive = false) {
    const r = prune(load());
    const prev = r.sessions[id] || {};
    r.sessions[id] = { name, summary: summary ?? prev.summary, internalPort, pid, ts: Date.now() };
    if (makeActive || !r.active) r.active = id;
    save(r);
}

export function setSummary(id, summary) {
    const r = prune(load());
    if (r.sessions[id] && summary && r.sessions[id].summary !== summary) {
        r.sessions[id].summary = summary;
        save(r);
    }
}

export function unregister(id) {
    const r = prune(load());
    const pid = r.sessions[id]?.pid;
    delete r.sessions[id];
    if (r.active === id) r.active = Object.keys(r.sessions)[0] ?? null;
    if (pid && r.front?.pid === pid) r.front = null;
    save(r);
}

export function setActive(id) {
    const r = prune(load());
    if (r.sessions[id]) r.active = id;
    save(r);
    return r.active;
}

export function setFront(pid) {
    const r = prune(load());
    r.front = { pid };
    save(r);
}

export function list() {
    const r = prune(load());
    save(r);
    return {
        active: r.active,
        sessions: Object.entries(r.sessions).map(([id, session]) => ({
            id,
            name: session.name,
            summary: session.summary,
            active: id === r.active,
        })),
    };
}

export function isFrontAlive() {
    const r = prune(load());
    return !!r.front;
}
