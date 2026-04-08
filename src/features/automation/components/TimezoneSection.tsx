import { Fragment, useEffect, useMemo, useState } from 'react'
import { Combobox, Transition } from '@headlessui/react'

interface TimezoneSectionProps {
  timezone: string
  availableTimezones: string[]
  onTimezoneChange: (value: string) => void
  showValidation: boolean
  error?: string
}

const RESULTS_STEP = 5

const TimezoneSection = ({
  timezone,
  availableTimezones,
  onTimezoneChange,
  showValidation,
  error,
}: TimezoneSectionProps) => {
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(RESULTS_STEP)

  useEffect(() => {
    setQuery('')
  }, [timezone])

  useEffect(() => {
    setVisibleCount(RESULTS_STEP)
  }, [query, availableTimezones])

  const filteredTimezones = useMemo(() => {
    if (!query) {
      return availableTimezones
    }

    const normalizedQuery = query.toLowerCase()
    return availableTimezones.filter((option) =>
      option.toLowerCase().includes(normalizedQuery),
    )
  }, [availableTimezones, query])

  const visibleTimezones = filteredTimezones.slice(0, visibleCount)

  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Zona horaria</h2>
      <Combobox
        value={timezone}
        onChange={(value) => {
          if (value !== null) {
            onTimezoneChange(value)
          }
        }}
      >
        {({ open }) => (
          <>
            <Combobox.Label className="text-sm font-medium text-slate-700">
              Zona horaria
            </Combobox.Label>
            <div className="relative mt-1">
              <div className="relative w-full cursor-default rounded-lg border border-slate-200 bg-white text-left shadow-sm focus-within:ring-2 focus-within:ring-emerald-200">
                <Combobox.Input
                  className="w-full border-none bg-transparent py-2 pl-3 pr-8 text-sm text-slate-700 focus:ring-0"
                  displayValue={(value: string) => value}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Busca tu zona (ej. UTC-05:00)"
                />
                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                  <ChevronIcon />
                </Combobox.Button>
              </div>
              <Transition
                as={Fragment}
                show={open}
                enter="transition ease-out duration-100"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-75"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <div className="absolute bottom-full left-0 right-0 z-40 mb-2 rounded-lg border border-slate-200 bg-white text-sm shadow-xl">
                  <Combobox.Options className="max-h-60 overflow-auto py-1 focus:outline-none">
                    {filteredTimezones.length === 0 ? (
                      <div className="cursor-default select-none px-3 py-2 text-slate-500">
                        No se encontraron zonas horarias
                      </div>
                    ) : (
                      visibleTimezones.map((option) => (
                        <Combobox.Option
                          key={option}
                          value={option}
                          className={({ active, selected }) =>
                            `relative cursor-pointer select-none px-3 py-2 ${
                              active
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'text-slate-700'
                            } ${selected ? 'font-semibold' : 'font-normal'}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className="block whitespace-normal">
                                {option}
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 right-3 flex items-center text-emerald-600">
                                  <CheckIcon />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Combobox.Option>
                      ))
                    )}
                  </Combobox.Options>
                  {filteredTimezones.length > visibleTimezones.length ? (
                    <div className="border-t border-slate-100 px-3 py-2">
                      <button
                        type="button"
                        className="w-full text-left text-xs font-medium text-emerald-600 hover:text-emerald-700"
                        onClick={() =>
                          setVisibleCount((current) =>
                            Math.min(
                              filteredTimezones.length,
                              current + RESULTS_STEP,
                            ),
                          )
                        }
                      >
                        Mostrar 5 zonas más
                      </button>
                    </div>
                  ) : null}
                </div>
              </Transition>
            </div>
          </>
        )}
      </Combobox>
      <p className="text-sm text-slate-500">
        Las horas configuradas arriba se interpretan en tu hora local. Internamente se
        guardarán en UTC.
      </p>
      {showValidation && error ? (
        <p className="text-sm text-rose-600">{error}</p>
      ) : null}
    </section>
  )
}

const ChevronIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
      clipRule="evenodd"
    />
  </svg>
)

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M16.704 5.29a1 1 0 010 1.414l-7.071 7.071a1 1 0 01-1.414 0L3.296 8.852a1 1 0 011.414-1.414l3.51 3.51 6.364-6.364a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
)

export default TimezoneSection
