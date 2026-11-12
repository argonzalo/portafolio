/** Distancia de lectura, independiente de la velocidad del gesto del visitante.
 * 180 / 100 = 1,8 veces más recorrido: el mismo scroll avanza un 44 % menos.
 * Se conserva el scroll nativo y un único cursor para DOM, cámara e hilo.
 */
export const SCROLL_SVH_PER_BEAT = 180
export const MANIFESTO_SCROLL_SVH = 210 * 1.8

export function sceneScrollSvh(chapterId: string, beats: number): number {
  // Banner declara un solo beat, pero presenta cuatro interfaces y tres relevos.
  const readingUnits = chapterId === "banner-2" ? Math.max(3, beats) : beats
  // La cancha necesita todavía más aire por los cambios de escala de cámara.
  return readingUnits * (chapterId === "vibo" ? 200 : SCROLL_SVH_PER_BEAT)
}
