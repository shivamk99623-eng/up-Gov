/**
 * Pre-warm file-backed data caches when the Node server starts so the first
 * user request after deploy does not pay the full Excel parse cost.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { warmDataCaches } = await import("@/lib/api-helpers");
  await warmDataCaches();

  const { getMPDirectory, getMLADirectory } = await import(
    "@/services/representatives"
  );
  getMPDirectory();
  getMLADirectory();
}
