/**
 * Lighthouse CI — presupuestos de docs/plan/02-rendimiento-y-mobile.md §1.
 *
 * Corre contra el build local (`astro preview`), equivalente al preview de
 * producción. Si LHCI_URL está definido (p. ej. preview de Vercel), se usa
 * esa URL en lugar del servidor local.
 *
 * Presupuestos de 02 §1. En F0 la mayoría van en `warn` (el sitio aún no
 * cumple LCP/a11y/peso); CLS queda en `error`. T-A12 / T-A16 / T-A37 suben
 * el resto a `error` cuando el recorrido esté listo.
 */
const previewUrl = process.env.LHCI_URL || "http://127.0.0.1:4321/"

/** @type {import('@lhci/cli').Config} */
module.exports = {
  ci: {
    collect: {
      ...(process.env.LHCI_URL
        ? { url: [previewUrl] }
        : {
            startServerCommand: "npm run preview:static -- --port 4321",
            startServerReadyPattern: "Local",
            url: [previewUrl],
          }),
      numberOfRuns: 3,
      settings: {
        // Emulación mobile 4G para LCP de laboratorio (02 §1).
        formFactor: "mobile",
        throttlingMethod: "simulate",
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 2,
          disabled: false,
        },
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.9 }],
        "categories:accessibility": ["warn", { minScore: 0.95 }],
        "categories:best-practices": ["warn", { minScore: 0.95 }],
        "categories:seo": ["warn", { minScore: 0.95 }],
        // LCP ≤ 2,0 s (laboratorio, mobile 4G)
        "largest-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        // CLS ≤ 0,05
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        // Peso total: techo holgado; JS ≤ 90 KB “antes del 3D” se mira en stats.html.
        "total-byte-weight": ["warn", { maxNumericValue: 1600000 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
}
