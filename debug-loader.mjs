export async function load(url, context, nextLoad) {
  console.log(`[LOADER] Loading: ${url}`);
  try {
    return await nextLoad(url, context);
  } catch (err) {
    console.error(`[LOADER] Error loading ${url}`);
    throw err;
  }
}
