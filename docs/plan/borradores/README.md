# Borradores de narrativa — primera línea

> Salida de **T-A10**. El humano los corrige y completa en **T-H04** (I-01) antes de volcarlos a `src/content/projects/`.

## Archivos

| Proyecto | Archivo | Fuentes principales |
| --- | --- | --- |
| VIBO | [`vibo.md`](./vibo.md) | `docs/descripciones-proyectos-originales.md`, ficha `03` §3.1 |
| Pirp | [`pirp.md`](./pirp.md) | Descripción de *Análisis de reputación política*, ficha `03` §3.2; mucho `TODO(humano)` por I-08 |
| Naturalis | [`naturalis.md`](./naturalis.md) | Descripciones unificadas + partes Natuadmin / Web App, ficha `03` §3.3 |
| Banner 2.0 | [`banner-2.md`](./banner-2.md) | Banner 2.0 + contexto organización Banner Director, ficha `03` §3.4 |

## Convención

Cada borrador sigue el esquema de mensaje de `05-contenido.md` §1 (`oneLiner`, `problem`, `approach`, `decisions`, `challenges`, `impact`) más las preguntas de la plantilla §3.

- Texto usable tal cual se marca sin prefijo.
- Lo que solo el humano puede afirmar, corregir o desclasificar lleva `TODO(humano): …`.
- Números tomados del repo actual se citan como *dato del portafolio vigente*; si hay contradicción, se deja `TODO(humano)`.

## Orden del recorrido

Según `00` / ADR-007: Vibo → Pirp → Naturalis → Banner 2.0.
