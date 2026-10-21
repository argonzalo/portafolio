"use client"

import { useState } from "react"

import {
  journeyChapterGroups,
  journeyChapters,
  type JourneyChapter,
} from "@/components/journey/chapters"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

function chaptersInGroup(group: JourneyChapter["group"]) {
  return journeyChapters.filter((chapter) => chapter.group === group)
}

export function JourneyIndex() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground rounded-full px-2 sm:px-3"
          aria-label="Abrir índice del recorrido"
        >
          Índice
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-sm">
        <SheetHeader className="border-border border-b">
          <SheetTitle>Índice</SheetTitle>
          <SheetDescription>
            Saltá a cualquier capítulo del recorrido o a la vista lista.
          </SheetDescription>
        </SheetHeader>
        <nav
          aria-label="Capítulos del recorrido"
          className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5"
        >
          {journeyChapterGroups.map((group) => {
            const items = chaptersInGroup(group.id)
            if (items.length === 0) return null

            return (
              <div key={group.id} className="flex flex-col gap-2">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {group.label}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {items.map((chapter) => (
                    <li key={chapter.id}>
                      <a
                        href={`/#${chapter.id}`}
                        className="hover:bg-muted block rounded-lg px-2 py-2 text-sm font-medium transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        {chapter.indexLabel}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
          <div className="border-border flex flex-col gap-2 border-t pt-4">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Accesos
            </p>
            <a
              href="/projects"
              className="hover:bg-muted block rounded-lg px-2 py-2 text-sm font-medium transition-colors"
              onClick={() => setOpen(false)}
            >
              Vista lista de proyectos
            </a>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
