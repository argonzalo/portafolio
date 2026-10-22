import { CanvasTexture } from "three"

const SIZE = 128
const INSET = 22

let softMaskTexture: CanvasTexture | null = null

/**
 * Máscara en escala de grises (negro opaco + rectángulo blanco difuminado).
 * Sirve como `alphaMap` de sombras (canal G = intensidad) y como `map`
 * aditivo de halos. Una sola textura de 128² para todo el kit; no se libera.
 */
export function getSoftMaskTexture(): CanvasTexture {
  if (softMaskTexture) return softMaskTexture
  const canvas = document.createElement("canvas")
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext("2d")
  if (ctx) {
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, SIZE, SIZE)
    // Truco de sombra desplazada: solo se pinta la sombra (compatible con Safari).
    ctx.shadowColor = "#fff"
    ctx.shadowBlur = 16
    ctx.shadowOffsetX = SIZE * 4
    ctx.fillStyle = "#fff"
    ctx.beginPath()
    ctx.roundRect(INSET - SIZE * 4, INSET, SIZE - INSET * 2, SIZE - INSET * 2, 10)
    ctx.fill()
  }
  softMaskTexture = new CanvasTexture(canvas)
  return softMaskTexture
}

/** Factor de tamaño del plano difuminado respecto del rectángulo interior. */
export const SOFT_MASK_SPREAD = SIZE / (SIZE - INSET * 2)
