// Shared constants for the Vox voice extension.
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const PUBLIC_PORT = 4321;
export const DIR = dirname(fileURLToPath(import.meta.url));
export const REGISTRY = join(DIR, "registry.json");
