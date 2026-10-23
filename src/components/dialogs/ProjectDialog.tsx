"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProjectDetailBody } from "@/components/dialogs/ProjectDetailBody"
import {
  closeProjectDialog,
  subscribeProjectDialog,
} from "@/lib/projectDialogStore"
import type { Project } from "@/lib/projects"
import { XIcon } from "lucide-react"

type Props = {
  projects: Project[]
}

export function ProjectDialog({ projects }: Props) {
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      const projectParam = url.searchParams.get("project")
      if (projectParam && projects.some((p) => p.id === projectParam)) {
        return projectParam
      }
    }
    return null
  })

  useEffect(() => {
    const unsubscribe = subscribeProjectDialog((id) => {
      setActiveId(id)
    })

    return unsubscribe
  }, [])

  const project = projects.find((p) => p.id === activeId)
  const isOpen = Boolean(project)

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeProjectDialog()
    }
  }

  if (!project) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 top-0 left-0 z-50 flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-[#141416]/98 p-0 text-white backdrop-blur-3xl sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:max-h-[88vh] sm:w-[94vw] sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border sm:border-white/10 sm:bg-[#161618]/95 sm:shadow-[0_25px_70px_rgba(0,0,0,0.85)]"
      >
        <div className="sticky top-0 z-20 flex items-center justify-end border-b border-white/10 bg-[#141416]/80 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 backdrop-blur-xl sm:px-8 sm:py-4">
          <button
            type="button"
            onClick={closeProjectDialog}
            className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all hover:bg-white/15 hover:scale-105 cursor-pointer"
            aria-label="Cerrar detalle del proyecto"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-8">
          <DialogHeader className="gap-2 text-left">
            <DialogTitle className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {project.title}
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed text-white/80 sm:text-lg">
              {project.oneLiner}
            </DialogDescription>
          </DialogHeader>

          <ProjectDetailBody key={project.id} project={project} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
