/**
 * Estado y disparador global para abrir el dialog de detalle de proyecto.
 * Permite que cualquier botón o tarjeta en el sitio de una sola página
 * abra la ficha simplificada del proyecto sin cambiar de ruta.
 */

type ProjectDialogListener = (projectId: string | null) => void

const listeners = new Set<ProjectDialogListener>()
let currentProjectId: string | null = null

export function getActiveProjectId(): string | null {
  if (currentProjectId) return currentProjectId
  if (typeof window !== "undefined") {
    return new URL(window.location.href).searchParams.get("project")
  }
  return null
}

export function openProjectDialog(projectId: string): void {
  currentProjectId = projectId
  listeners.forEach((listener) => listener(projectId))

  if (typeof window !== "undefined") {
    const url = new URL(window.location.href)
    if (url.searchParams.get("project") !== projectId) {
      url.searchParams.set("project", projectId)
      window.history.pushState({ project: projectId }, "", url.toString())
    }
  }
}

export function closeProjectDialog(): void {
  currentProjectId = null
  listeners.forEach((listener) => listener(null))

  if (typeof window !== "undefined") {
    const url = new URL(window.location.href)
    if (url.searchParams.has("project")) {
      url.searchParams.delete("project")
      window.history.pushState({}, "", url.toString())
    }
  }
}

export function subscribeProjectDialog(listener: ProjectDialogListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    const param = new URL(window.location.href).searchParams.get("project")
    currentProjectId = param
    listeners.forEach((listener) => listener(param))
  })
}
