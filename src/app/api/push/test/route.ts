import { bad, handle, ok } from "@/lib/http";
import { buildMorningSummary, pushConfigured, sendToAll } from "@/lib/push";

// Send the morning summary right now (to check it works).
export const POST = handle(async () => {
  if (!pushConfigured()) return bad("Push isn't set up yet", 503);
  const result = await sendToAll({ ...(await buildMorningSummary()), tag: "test" });
  return ok(result);
});
