// Extension: halo — thin entry.
// A voice-in / voice-out canvas for any Copilot session. /halo brings up a
// single fixed UI on port 4321 and routes spoken turns to the active session.
// All server/registry/proxy detail lives in voice.mjs and friends.

import { joinSession, createCanvas } from "@github/copilot-sdk/extension";
import { createVoice } from "./voice.mjs";

let voice = null;

const session = await joinSession({
    canvases: [
        createCanvas({
            id: "halo",
            displayName: "Halo",
            description:
                "Hands-free voice panel: talk to the agent out loud and hear it reply, with a reactive listening orb.",
            open: async () => {
                const url = await voice.start();
                return { title: "Halo", url, status: "Voice in / voice out" };
            },
        }),
    ],
    commands: [
        {
            name: "halo",
            description: "Start Halo voice mode and make this session the active voice target.",
            handler: async () => {
                try {
                    const url = await voice.start();
                    voice.activate();
                    session.log?.(`🎙️ Halo: ${voice.name} is now active — open ${url} and tap the orb.`);
                } catch (err) {
                    session.log?.(`halo: ${err?.message || err}`);
                }
            },
        },
        {
            name: "halo-stop",
            description: "Stop Halo for this session and release its voice server.",
            handler: async () => {
                voice.stop();
                session.log?.("🎙️ Halo: stopped for this session.");
            },
        },
        {
            name: "halo-who",
            description: "List the live Halo sessions and show which one is active.",
            handler: async () => {
                const { active, sessions } = voice.who();
                if (!sessions.length) { session.log?.("🎙️ Halo: no live sessions."); return; }
                const lines = sessions.map((s) => `${s.id === active ? "→" : " "} ${s.name}`).join("\n");
                session.log?.(`🎙️ Halo sessions:\n${lines}`);
            },
        },
    ],
    hooks: {
        onSessionEnd: async () => {
            voice.stop();
            return { cleanupActions: ["Stopped Halo voice server"] };
        },
    },
});

voice = createVoice(session);

for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => { try { voice.stop(); } catch {} process.exit(0); });
}

session.log?.(`🎙️ Halo loaded — run /halo to talk hands-free at ${voice.url}`);
