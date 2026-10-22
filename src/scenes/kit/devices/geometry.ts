import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Shape,
  ShapeGeometry,
} from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"

import type { RenderTier } from "./specs"

/** Segmentos de curva por esquina según nivel de calidad. */
export const CURVE_SEGMENTS: Record<RenderTier, number> = {
  high: 10,
  medium: 7,
  low: 4,
}

export const BEVEL_SEGMENTS: Record<RenderTier, number> = {
  high: 4,
  medium: 3,
  low: 1,
}

/** Rectángulo redondeado centrado en el origen (plano XY). */
export function roundedRectShape(
  width: number,
  height: number,
  radius: number,
  cx = 0,
  cy = 0
): Shape {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2))
  const x = cx - width / 2
  const y = cy - height / 2
  const shape = new Shape()
  shape.moveTo(x + r, y)
  shape.lineTo(x + width - r, y)
  if (r > 0) shape.absarc(x + width - r, y + r, r, -Math.PI / 2, 0, false)
  shape.lineTo(x + width, y + height - r)
  if (r > 0) shape.absarc(x + width - r, y + height - r, r, 0, Math.PI / 2, false)
  shape.lineTo(x + r, y + height)
  if (r > 0) shape.absarc(x + r, y + height - r, r, Math.PI / 2, Math.PI, false)
  shape.lineTo(x, y + r)
  if (r > 0) shape.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  return shape
}

/**
 * Losa redondeada con bisel suave (cuerpo de dispositivo), centrada en el
 * origen, con su grosor sobre el eje Z. El bisel queda **dentro** de las
 * medidas pedidas: el contorno exterior mide exactamente `width × height`.
 */
export function createRoundedSlabGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number,
  bevel: number,
  tier: RenderTier
): BufferGeometry {
  const b = Math.max(0, Math.min(bevel, depth / 2 - 1e-4, radius))
  const shape = roundedRectShape(width - b * 2, height - b * 2, radius - b)
  const geometry = new ExtrudeGeometry(shape, {
    depth: Math.max(1e-4, depth - b * 2),
    bevelEnabled: b > 0,
    bevelThickness: b,
    bevelSize: b,
    bevelOffset: 0,
    bevelSegments: BEVEL_SEGMENTS[tier],
    curveSegments: CURVE_SEGMENTS[tier],
  })
  geometry.translate(0, 0, -(depth - b * 2) / 2)
  geometry.computeVertexNormals()
  return geometry
}

/**
 * Plano redondeado con UV normalizadas a `[0, 1]` sobre su caja (para mapear
 * capturas sin deformarlas).
 */
export function createRoundedPlaneGeometry(
  width: number,
  height: number,
  radius: number,
  tier: RenderTier
): BufferGeometry {
  const geometry = new ShapeGeometry(
    roundedRectShape(width, height, radius),
    CURVE_SEGMENTS[tier]
  )
  const position = geometry.getAttribute("position")
  const uv = new Float32Array(position.count * 2)
  for (let i = 0; i < position.count; i++) {
    uv[i * 2] = position.getX(i) / width + 0.5
    uv[i * 2 + 1] = position.getY(i) / height + 0.5
  }
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2))
  return geometry
}

export type KeyRect = {
  /** Centro en el plano del teclado (x a la derecha, y hacia el usuario). */
  x: number
  y: number
  width: number
  height: number
}

/**
 * Distribución de teclado ANSI compacto (14,5 unidades de ancho): fila de
 * funciones, 4 filas alfanuméricas y fila inferior con flechas en T invertida.
 */
export function buildKeyboardLayout(unit: number, gap: number): KeyRect[] {
  const rows: { keys: number[]; height?: number }[] = [
    { keys: [1.5, ...Array(12).fill(1), 1], height: 0.58 },
    { keys: [...Array(13).fill(1), 1.5] },
    { keys: [1.5, ...Array(13).fill(1)] },
    { keys: [1.75, ...Array(11).fill(1), 1.75] },
    { keys: [2.25, ...Array(10).fill(1), 2.25] },
  ]
  const totalWidth = 14.5 * unit
  const rects: KeyRect[] = []
  let cursorY = 0

  for (const row of rows) {
    const rowHeight = (row.height ?? 1) * unit
    let cursorX = -totalWidth / 2
    for (const span of row.keys) {
      const w = span * unit
      rects.push({
        x: cursorX + w / 2,
        y: cursorY + rowHeight / 2,
        width: w - gap,
        height: rowHeight - gap,
      })
      cursorX += w
    }
    cursorY += rowHeight
  }

  // Fila inferior: fn, ctrl, opt, cmd, espacio, cmd, opt + flechas.
  const bottom = [1, 1, 1, 1.25, 5, 1.25, 1]
  let cursorX = -totalWidth / 2
  for (const span of bottom) {
    const w = span * unit
    rects.push({ x: cursorX + w / 2, y: cursorY + unit / 2, width: w - gap, height: unit - gap })
    cursorX += w
  }
  // Flechas: izquierda, arriba/abajo apiladas a media altura, derecha.
  const half = unit / 2
  rects.push({ x: cursorX + half, y: cursorY + unit * 0.75, width: unit - gap, height: half - gap / 2 })
  rects.push({ x: cursorX + unit * 1.5, y: cursorY + unit * 0.25, width: unit - gap, height: half - gap / 2 })
  rects.push({ x: cursorX + unit * 1.5, y: cursorY + unit * 0.75, width: unit - gap, height: half - gap / 2 })
  rects.push({ x: cursorX + unit * 2.5, y: cursorY + unit * 0.75, width: unit - gap, height: half - gap / 2 })
  cursorY += unit

  // Centrar verticalmente el bloque.
  for (const rect of rects) rect.y -= cursorY / 2
  return rects
}

/**
 * Todas las teclas fusionadas en una sola geometría (1 draw call) con esquinas
 * correctas en teclas anchas (no se escalan instancias). Plano XZ, con la cara
 * superior apuntando a +Y.
 */
export function createKeyboardGeometry(
  keys: KeyRect[],
  keyHeight: number,
  tier: RenderTier
): BufferGeometry {
  const parts: BufferGeometry[] = []
  const curve = tier === "high" ? 3 : 2
  for (const key of keys) {
    const radius = Math.min(key.width, key.height) * 0.16
    const geometry = new ExtrudeGeometry(
      roundedRectShape(key.width, key.height, radius, key.x, -key.y),
      {
        depth: keyHeight,
        bevelEnabled: tier !== "low",
        bevelThickness: keyHeight * 0.35,
        bevelSize: Math.min(key.width, key.height) * 0.04,
        bevelSegments: 1,
        curveSegments: curve,
      }
    )
    parts.push(geometry)
  }
  const merged = mergeGeometries(parts, false) ?? new BufferGeometry()
  for (const part of parts) part.dispose()
  // De XY (+Z arriba) a XZ (+Y arriba).
  merged.rotateX(-Math.PI / 2)
  merged.computeVertexNormals()
  return merged
}
