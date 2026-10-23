"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ContactContent } from "./ContactContent"
import { XIcon } from "lucide-react"

export function ContactDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="ml-1 inline-flex h-8 sm:h-9 items-center justify-center rounded-full bg-primary px-3 sm:px-4 text-xs sm:text-sm font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
          aria-label="Abrir formulario de contacto"
        >
          Hablemos
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 top-0 left-0 z-50 flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col justify-center rounded-none border-0 bg-[#141416]/98 p-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white backdrop-blur-3xl sm:inset-auto sm:top-1/2 sm:left-1/2 sm:h-auto sm:w-[94vw] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:border sm:border-white/10 sm:bg-[#161618]/95 sm:p-8 sm:shadow-[0_25px_70px_rgba(0,0,0,0.85)]"
      >
        <div className="flex justify-end pb-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all hover:bg-white/15 hover:scale-105 cursor-pointer"
            aria-label="Cerrar diálogo de contacto"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="overflow-y-auto">
          <ContactContent />
        </div>
      </DialogContent>
    </Dialog>
  )
}
