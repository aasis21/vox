// Open the Vox UI as its own desktop-style window using an installed Chromium
// browser in "app mode" (--app=URL): a chrome-less standalone window that keeps
// the browser's Web Speech APIs (speech-to-text + speechSynthesis) working —
// which Electron and the native system webviews do not. Chrome is preferred,
// then Edge (both are Chromium and both support app mode and Web Speech).
//
// A dedicated, persistent profile dir gives the window its own identity and
// remembers the microphone permission across launches. Override the choice with
// VOX_BROWSER=chrome | edge | brave | chromium | <full path to executable>.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROFILE_DIR = join(homedir(), ".copilot", "vox-app-profile");

function candidates() {
    const plat = process.platform;
    if (plat === "win32") {
        const pf = process.env.ProgramFiles || "C:\\Program Files";
        const pfx = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
        const local = process.env.LOCALAPPDATA || join(homedir(), "AppData", "Local");
        return [
            { name: "Chrome", path: join(pf, "Google\\Chrome\\Application\\chrome.exe") },
            { name: "Chrome", path: join(pfx, "Google\\Chrome\\Application\\chrome.exe") },
            { name: "Chrome", path: join(local, "Google\\Chrome\\Application\\chrome.exe") },
            { name: "Edge", path: join(pf, "Microsoft\\Edge\\Application\\msedge.exe") },
            { name: "Edge", path: join(pfx, "Microsoft\\Edge\\Application\\msedge.exe") },
            { name: "Brave", path: join(pf, "BraveSoftware\\Brave-Browser\\Application\\brave.exe") },
            { name: "Brave", path: join(pfx, "BraveSoftware\\Brave-Browser\\Application\\brave.exe") },
        ];
    }
    if (plat === "darwin") {
        return [
            { name: "Chrome", path: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" },
            { name: "Edge", path: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" },
            { name: "Brave", path: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" },
            { name: "Chromium", path: "/Applications/Chromium.app/Contents/MacOS/Chromium" },
        ];
    }
    return [
        { name: "Chrome", path: "/usr/bin/google-chrome" },
        { name: "Chrome", path: "/usr/bin/google-chrome-stable" },
        { name: "Edge", path: "/usr/bin/microsoft-edge" },
        { name: "Brave", path: "/usr/bin/brave-browser" },
        { name: "Chromium", path: "/usr/bin/chromium" },
        { name: "Chromium", path: "/usr/bin/chromium-browser" },
    ];
}

// Pick the best available Chromium: an explicit VOX_BROWSER override wins, then
// the platform preference order (Chrome first, Edge next — Edge ships on Windows).
export function findBrowser() {
    const list = candidates();
    const override = (process.env.VOX_BROWSER || "").trim();
    if (override) {
        const lc = override.toLowerCase();
        if (["chrome", "edge", "brave", "chromium"].includes(lc)) {
            const hit = list.find((c) => c.name.toLowerCase() === lc && existsSync(c.path));
            if (hit) return hit;
        } else if (existsSync(override)) {
            return { name: "Custom", path: override };
        }
        // override not found — fall through to auto-detect
    }
    for (const c of list) {
        if (existsSync(c.path)) return c;
    }
    return null;
}

// Launch the URL as a standalone app window. Detached so it outlives this vox
// process. Returns { ok, browser, pid } or { ok:false, reason }.
export function launchApp(url) {
    const browser = findBrowser();
    if (!browser) return { ok: false, reason: "no-chromium" };
    const args = [
        `--app=${url}`,
        `--user-data-dir=${PROFILE_DIR}`,
        "--no-first-run",
        "--no-default-browser-check",
    ];
    try {
        const child = spawn(browser.path, args, { detached: true, stdio: "ignore" });
        child.unref();
        return { ok: true, browser: browser.name, pid: child.pid };
    } catch (e) {
        return { ok: false, reason: (e && e.message) || String(e) };
    }
}
