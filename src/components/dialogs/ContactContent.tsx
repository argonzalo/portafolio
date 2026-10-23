"use client"

import { useState } from "react"
import { site } from "@/lib/site"
import { CheckIcon, CopyIcon, MailIcon } from "lucide-react"

export function ContactContent() {
  const [copied, setCopied] = useState(false)

  const handleCopyEmail = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(site.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex w-full flex-col text-left">
      <span className="text-[11px] font-mono tracking-widest text-white/40 uppercase">
        Hablemos
      </span>
      <h2 className="mt-2 text-2xl font-medium tracking-tight text-white sm:text-3xl">
        Conversemos.
      </h2>
      <p className="mt-2.5 max-w-lg text-sm sm:text-base leading-relaxed text-white/60 text-pretty">
        Un proyecto, una colaboración o una idea ambiciosa por explorar. Escribime
        y charlamos sobre cómo llevarla adelante con tecnología y diseño.
      </p>

      {/* Fila principal de contacto sobria y minimalista */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70">
            <MailIcon className="size-4 text-white/70" />
          </div>
          <div>
            <p className="text-[11px] text-white/40">Correo electrónico</p>
            <p className="font-mono text-sm text-white/90">{site.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyEmail}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 text-xs text-white/75 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white active:scale-95 cursor-pointer"
            aria-label="Copiar correo electrónico al portapapeles"
          >
            {copied ? (
              <>
                <CheckIcon className="size-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado</span>
              </>
            ) : (
              <>
                <CopyIcon className="size-3.5 text-white/50" />
                <span>Copiar</span>
              </>
            )}
          </button>

          <a
            href={`mailto:${site.email}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 text-xs font-medium text-white transition-all hover:border-white/30 hover:bg-white/20 active:scale-95"
          >
            <span>Escribir</span>
            <span className="text-white/60">→</span>
          </a>
        </div>
      </div>

      {/* Enlaces a redes con diseño sobrio de pastillas */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <a
          href={site.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-white/70 transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
        >
          <span
            className="icon-[logos--linkedin-icon] size-3.5 shrink-0 opacity-80 group-hover:opacity-100"
            aria-hidden="true"
          />
          <span>LinkedIn</span>
          <span className="text-white/40 text-[10px] group-hover:text-white/70 transition-colors">
            ↗
          </span>
        </a>

        <a
          href={site.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-white/70 transition-all hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
        >
          <span
            className="icon-[tabler--brand-instagram] size-3.5 shrink-0 text-white/70 group-hover:text-pink-400 transition-colors"
            aria-hidden="true"
          />
          <span>Instagram</span>
          <span className="text-white/40 text-[10px] group-hover:text-white/70 transition-colors">
            ↗
          </span>
        </a>
      </div>
    </div>
  )
}
