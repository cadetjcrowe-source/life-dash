import { body, handle, ok } from "@/lib/http";
import { getLocation, saveSettings } from "@/lib/settings";
import { deviceLocation } from "@/lib/validators";

// GET: the location server features are using right now.
export const GET = handle(async () => ok(await getLocation()));

// POST: the app reports where the device is. Saved as your last known location.
export const POST = handle(async (req: Request) => {
  const d = await body(req, deviceLocation);
  await saveSettings({
    lastLocation: {
      lat: Math.round(d.lat * 1e4) / 1e4, // ~10 m – plenty for weather
      lon: Math.round(d.lon * 1e4) / 1e4,
      name: d.name,
      accuracy: d.accuracy ?? null,
      at: new Date().toISOString(),
    },
  });
  return ok(await getLocation());
});
