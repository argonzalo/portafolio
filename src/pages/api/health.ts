/**
 * Smoke del adaptador Vercel: confirma que una ruta on-demand responde.
 * No importa `astro:env/server` para no forzar validación de secretos en builds sin `.env`.
 */
export const prerender = false

export function GET() {
  return Response.json({
    ok: true,
    service: "portafolio",
    ts: new Date().toISOString(),
  })
}
