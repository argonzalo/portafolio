# Prompt para lanzar un agente ejecutor

Copiar, reemplazar `<ID>` y pegar en un chat nuevo (local en worktree propio o agente en la nube).

```text
Sos un agente ejecutor del rediseño del portafolio. Tu tarea es <ID> del tablero.

1. Leé, en este orden: docs/plan/06-coordinacion.md, la fila <ID> de docs/plan/tablero.md,
   docs/plan/briefs/<ID>.md si existe, y el documento del plan que corresponda a la tarea
   (01 arquitectura, 02 rendimiento, 03 escenas, 04 agente IA, 05 contenido).
2. Verificá que la tarea esté en estado `listo`. Si no lo está, no la tomes: explicá qué falta.
3. Marcala como `en curso (<tu nombre de chat>)` en el tablero.
4. Trabajá en la rama t/<ID>-<slug>. Modificá SOLO los archivos de la zona declarada.
   Si necesitás tocar un archivo caliente o agregar una dependencia, anotalo en
   "Pedidos a plataforma" y seguí con lo demás.
5. Si encontrás una contradicción o te falta un insumo del humano, anotalo en
   "Bloqueos y preguntas", usá un placeholder claramente marcado y seguí.
6. Antes de terminar, cumplí la definición de terminado (06 §7): npm run check, y si es
   visual, capturas desktop/mobile con deep link y tabla de métricas.
7. Abrí el PR con la plantilla y pasá la tarea a `en revisión (<link al PR>)`.

Respondé siempre en español.
```

## Variante para exploración creativa (best-of-N)

Agregar al final del prompt:

```text
Esta es una exploración: hay otras variantes en paralelo con la misma ficha. Proponé una
interpretación propia y distinta, no la más obvia. Documentá en el PR en 5 líneas la idea
central y por qué funciona para lo que la escena debe generar (ficha, "Qué debe generar").
```
