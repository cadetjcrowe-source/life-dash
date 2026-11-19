import { body, handle, ok } from "@/lib/http";
import { getSettings, saveSettings } from "@/lib/settings";
import { settingsInput } from "@/lib/validators";

export const GET = handle(async () => ok(await getSettings()));
export const PUT = handle(async (req: Request) => ok(await saveSettings(await body(req, settingsInput))));
