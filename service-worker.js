/* Offline-first service worker for Dynamic Calc */

const CACHE_NAME = "dynamic-calc-offline-v1";

// These are the assets referenced directly by your current index.html (plus a few essentials).
// If you later change file hashes (?abcd123), bump CACHE_NAME to v2.
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./sw-register.js",

  "./js/vendor/select2/select2.css?01",
  "./css/main.css?2f51c969f",
  "./css/encounters.css?2f51c970",
  "./css/settings-ui.css?2f51c970",
  "./css/vendor/bootstrap.css?1",

  "./img/menu.svg",
  "./img/pokesprite/abomasnow.png",

  "./js/vendor/jquery-1.9.1.min.js",
  "./js/vendor/select2/select2.min.js",
  "./js/vendor/url-search-params-0.1.2.min.js",

  "./backups/title_to_backup_mappings.js?5",
  "./js/console_watcher.js?8fa0c7fc",
  "./js/expert_ai.js?8fa0c7fc",

  "./calc/util.js?8fa0c7fe",
  "./calc/stats.js?da4066fa",
  "./calc/data/species.js?66abc353",
  "./calc/data/types.js?b935c17c",
  "./calc/data/evos.js?b935c17c",
  "./calc/data/splits.js?b935c17c",
  "./calc/data/natures.js?407b5243",
  "./calc/data/abilities.js?c1788577",
  "./calc/data/moves.js?dcd8d232",
  "./calc/data/items.js?4724e4b3",
  "./calc/data/index.js?083d2bca",

  "./calc/move.js?de87e36d",
  "./calc/pokemon.js?59377ee4",
  "./calc/field.js?51ae3fda",
  "./calc/items.js?6c1bfef0",

  "./calc/mechanics/util.js?13c1ef49",
  "./calc/mechanics/gen78.js?b5cb13cc",
  "./calc/mechanics/gen56.js?326e5780",
  "./calc/mechanics/gen4.js?7d2b7681",
  "./calc/mechanics/gen3.js?2fa3d6a2",
  "./calc/mechanics/gen12.js?468bc07c",

  "./calc/calc.js?d7fc4fbd",
  "./calc/desc.js?0d17c5d7",
  "./calc/result.js?d5c7552c",
  "./calc/adaptable.js?afeb3759",
  "./calc/index.js?2377cbc8",

  "./js/data/sets/gen8.js?6f60aa5c",
  "./js/data/sets/gen7.js?b8c1b790",
  "./js/data/sets/gen6.js?2219279f",
  "./js/data/sets/gen4.js?57f6a825",
  "./js/data/sets/gen3.js?13854f5e",
  "./js/data/sets/gen2.js?4cb8be40",
  "./js/data/sets/gen1.js?a2f6e086",

  "./js/rom_specific_configs.js?100196",
  "./js/switch_prediction.js?100197",
  "./js/showdown_hooks.js?100196",
  "./js/battle_notes.js?100161",
  "./js/balance_testing.js?100000",
  "./js/move_choice_ai/basic.js?100000",
  "./js/enums.js?100135",
  "./js/savereader.js?100148",
  "./js/savereader_pokeemerald.js?100150",
  "./js/shared_controls.js?0b3ea09d",
  "./js/index_randoms_controls.js?3375d6ff",
  "./js/moveset_import.js?a707186",
  "./js/frags.js?100009",

  // PWA icons:
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

function isCacheableRequest(requestUrl) {
  // Cache everything from your own GitHub Pages origin,
  // and also cache common external JSON sources once fetched successfully.
  const origin = self.location.origin;
  return (
    requestUrl.origin === origin ||
    requestUrl.hostname.endsWith("npoint.io") ||
    requestUrl.hostname.endsWith("githubusercontent.com")
  );
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // For navigation requests, try cache first, then network, then cached index.html.
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((resp) => {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return resp;
          })
          .catch(() => caches.match("./index.html"));
      })
    );
    return;
  }

  // For everything else: cache-first + populate cache on network success.
  if (!isCacheableRequest(url)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((resp) => {
          // Only cache successful basic/cors responses (avoid caching opaque failures)
          if (resp && (resp.type === "basic" || resp.type === "cors") && resp.status === 200) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return resp;
        });
    })
  );
});
