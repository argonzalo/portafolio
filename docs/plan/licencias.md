# Licencias, permisos y atribuciones

Registro de assets y datos de terceros o sensibles usados en el portafolio.

## Vibo (I-02 / T-H07)

| Ítem | Detalle |
| --- | --- |
| Origen Firebase | Proyecto propio `vibo-beta-2e60f`, colección `videos` → `analysisResults` |
| Origen MVP UI | Snapshot local `ui-mvp-public/` (gitignored); extractos en `assets-src/vibo/mvp-ref/` |
| Uso | Overlays y métricas de la escena Vibo (ADR-011) |
| Anonimización | Sin `userId`, emails, URLs de storage ni nombres de archivo en el paquete curado |
| Pose / bbox | Reales del pipeline (export MVP `analyze-video-1.json`); no inventados |
| Videos / frames | `demo_point.mp4`, `video_padel.mp4`, `punto_1.mp4`, stills de golpes — material propio de demos Vibo |
| Permiso | Datos de entorno beta propio; OK mostrar métricas y eventos de golpe anonimizados |
| Ruta local | `assets-src/vibo/` |

## Kit dispositivos (fuente)

| Ítem | Detalle |
| --- | --- |
| Modelos | `assets-src/kit/models/phone*.glb` copiados del MVP UI |
| Uso previsto | T-A19 (kit Phone/Laptop); optimizar antes de `public/models/` |
| Permiso | Assets propios del MVP Vibo |
