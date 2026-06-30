// Extension: vox — thin entry.
// A voice-in / voice-out canvas for any Copilot session. /vox brings up a
// single fixed UI on port 4321 and routes spoken turns to the active session.
// All server/registry/proxy detail lives in voice.mjs and friends.

import { joinSession, createCanvas } from "@github/copilot-sdk/extension";
import { createVoice } from "./voice.mjs";

let voice = null;

const session = await joinSession({
    canvases: [
        createCanvas({
            id: "vox",
            displayName: "Vox",
            description:
                "Hands-free voice panel: talk to the agent out loud and hear it reply, with a reactive listening orb.",
            open: async () => {
                const url = await voice.start();
                return { title: "Vox", url, status: "Voice in / voice out" };
            },
        }),
    ],
    commands: [
        {
            name: "vox",
            description: "Start Vox voice mode and make this session the active voice target.",
            handler: async () => {
                try {
                    const url = await voice.start();
                    voice.activate();
                    session.log?.(`🎙️ Vox: ${voice.name} is now active — open ${url} and tap the orb.`);
                } catch (err) {
                    session.log?.(`vox: ${err?.message || err}`);
                }
            },
        },
        {
            name: "vox-stop",
            description: "Stop Vox for this session and release its voice server.",
            handler: async () => {
                voice.stop();
                session.log?.("🎙️ Vox: stopped for this session.");
            },
        },
        {
            name: "vox-who",
            description: "List the live Vox sessions and show which one is active.",
            handler: async () => {
                const { active, sessions } = voice.who();
                if (!sessions.length) { session.log?.("🎙️ Vox: no live sessions."); return; }
                const lines = sessions.map((s) => `${s.id === active ? "→" : " "} ${s.name} — ${s.id.slice(0, 8)}`).join("\n");
                session.log?.(`🎙️ Vox sessions:\n${lines}`);
            },
        },
    ],
});

voice = createVoice(session);

// Cleanup on teardown: the CLI stops extensions with SIGTERM (then SIGKILL) on
// exit / session replacement, so releasing the voice server here covers session
// end. (The SDK's onSessionEnd callback hook is rejected by the native runtime.)
for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => { try { voice.stop(); } catch {} process.exit(0); });
}

session.log?.(`🎙️ Vox loaded — run /vox to talk hands-free at ${voice.url}`);
