import type { ProjectData } from "@/content/schema"

const STATUS_LABEL: Record<ProjectData["status"], string> = {
  activo: "En curso",
  finalizado: "Finalizado",
  demo: "Demo",
  cancelado: "Cancelado",
}

export function statusLabel(status: ProjectData["status"]): string {
  return STATUS_LABEL[status]
}

/** Textos de borrador que todavía esperan corrección humana (T-H04 / T-H14). */
export function isDraftText(value: string): boolean {
  return value.trimStart().startsWith("TODO(humano)")
}
