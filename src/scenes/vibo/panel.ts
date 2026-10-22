import { COCO_BONES, SHOT } from "./data"

/** Nodos DOM del panel del golpe; los escribe la escena por frame. */
export type PanelNodes = {
  root: HTMLDivElement | null
  slider: HTMLInputElement | null
  inset: HTMLDivElement | null
  insetBox: SVGRectElement | null
  insetBall: SVGCircleElement | null
  insetBones: (SVGLineElement | null)[]
  insetJoints: (SVGCircleElement | null)[]
  insetFrame: HTMLSpanElement | null
}

export function createPanelNodes(): PanelNodes {
  return {
    root: null,
    slider: null,
    inset: null,
    insetBox: null,
    insetBall: null,
    insetBones: [],
    insetJoints: [],
    insetFrame: null,
  }
}

type SingleNode = Exclude<keyof PanelNodes, "insetBones" | "insetJoints">

export function setNode<K extends SingleNode>(nodes: PanelNodes, key: K, el: PanelNodes[K]) {
  nodes[key] = el
}

export function setNodeAt<T>(list: (T | null)[], index: number, el: T | null) {
  list[index] = el
}

/** Escribe el frame real más cercano al instante del golpe en el recuadro 2D. */
export function paintInset(nodes: PanelNodes, frameIndex: number) {
  const frame = SHOT.frames[frameIndex]
  if (!frame) return
  const [x, y, w, h] = frame.box
  const box = nodes.insetBox
  if (box) {
    box.setAttribute("x", String(x))
    box.setAttribute("y", String(y))
    box.setAttribute("width", String(w))
    box.setAttribute("height", String(h))
  }
  COCO_BONES.forEach(([a, b], i) => {
    const line = nodes.insetBones[i]
    if (!line) return
    line.setAttribute("x1", String(frame.points[a][0]))
    line.setAttribute("y1", String(frame.points[a][1]))
    line.setAttribute("x2", String(frame.points[b][0]))
    line.setAttribute("y2", String(frame.points[b][1]))
  })
  frame.points.forEach(([px, py], i) => {
    const dot = nodes.insetJoints[i]
    if (!dot) return
    dot.setAttribute("cx", String(px))
    dot.setAttribute("cy", String(py))
  })
  const ball = nodes.insetBall
  if (ball) {
    ball.setAttribute("cx", String(frame.ball?.[0] ?? -1))
    ball.setAttribute("cy", String(frame.ball?.[1] ?? -1))
  }
  if (nodes.insetFrame)
    nodes.insetFrame.textContent = `f${frame.frame} · ${Math.round(frame.conf * 100)}%`
}
