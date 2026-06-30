// Read-only access to the CLI's own session store (~/.copilot/session-store.db):
// the chat title (summary) and the conversation history (turns). This is the same
// data the CLI session picker shows, so Vox stays in sync without depending on the
// experimental session metadata RPC. node:sqlite ships built-in on Node 24.
import { homedir } from "node:os";
import { join } from "node:path";

const DB_PATH = join(homedir(), ".copilot", "session-store.db");
const MAX_MSG = 4000;

async function openDb() {
    const { DatabaseSync } = await import("node:sqlite");
    return new DatabaseSync(DB_PATH, { readOnly: true });
}

function clip(s) {
    s = String(s || "").trim();
    return s.length > MAX_MSG ? `${s.slice(0, MAX_MSG)} …` : s;
}

// Voice turns reach the CLI wrapped as: [Vox voice mode] … User said: "the words".
// Show just the spoken words in the transcript so history reads naturally.
function unwrapSpoken(t) {
    const m = /User said:\s*"([\s\S]*)"\s*$/.exec(t || "");
    return m ? m[1] : t;
}

export async function readSummary(sessionId) {
    if (!sessionId) return "";
    try {
        const db = await openDb();
        try {
            const row = db.prepare("SELECT summary FROM sessions WHERE id = ?").get(sessionId);
            return (row && row.summary) || "";
        } finally {
            db.close();
        }
    } catch {
        return "";
    }
}

export async function readHistory(sessionId, limit = 300) {
    if (!sessionId) return [];
    try {
        const db = await openDb();
        try {
            const rows = db
                .prepare(
                    "SELECT turn_index, user_message, assistant_response FROM turns " +
                        "WHERE session_id = ? ORDER BY turn_index DESC LIMIT ?",
                )
                .all(sessionId, limit);
            rows.reverse(); // oldest first
            const out = [];
            for (const r of rows) {
                const u = (r.user_message || "").trim();
                const a = (r.assistant_response || "").trim();
                if (u) out.push({ role: "user", text: clip(unwrapSpoken(u)) });
                if (a) out.push({ role: "assistant", text: clip(a) });
            }
            return out;
        } finally {
            db.close();
        }
    } catch {
        return [];
    }
}
