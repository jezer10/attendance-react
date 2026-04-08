import { useEffect, useRef, useState } from 'react'

type ImmediateAction = 'entrada' | 'salida'

interface ActionsPanelProps {
  canSave: boolean
  isSaving: boolean
  onSave: () => void
  onReset: () => void
  onImmediateMark: (action: ImmediateAction) => Promise<void>
  isMarking: ImmediateAction | null
  blockingReasons: string[]
}

const ActionsPanel = ({
  canSave,
  isSaving,
  onSave,
  onReset,
  onImmediateMark,
  isMarking,
  blockingReasons,
}: ActionsPanelProps) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleImmediateAction = (action: ImmediateAction) => {
    setMenuOpen(false)
    void onImmediateMark(action)
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Acciones</h2>
      <div className="space-y-3">
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSaving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={isSaving}
          className="flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancelar
        </button>
        {!canSave && blockingReasons.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">No puedes guardar aún:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {blockingReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((state) => !state)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            Marcar ahora
            <span className="text-xs text-slate-500">{menuOpen ? '▲' : '▼'}</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              <button
                type="button"
                onClick={() => handleImmediateAction('entrada')}
                disabled={isMarking !== null}
                className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isMarking === 'entrada' ? 'Marcando entrada…' : 'Marcar entrada ahora'}
              </button>
              <button
                type="button"
                onClick={() => handleImmediateAction('salida')}
                disabled={isMarking !== null}
                className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isMarking === 'salida' ? 'Marcando salida…' : 'Marcar salida ahora'}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ActionsPanel
