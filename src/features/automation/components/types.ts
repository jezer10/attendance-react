export type DayKey = 'Lun' | 'Mar' | 'Mie' | 'Jue' | 'Vie' | 'Sab' | 'Dom'

export interface AutomationBlock {
  habilitado: boolean
  hora_local: string
  hora_utc?: string | null
  dias: DayKey[]
}

export interface LocationSettings {
  direccion: string
  lat: number | null
  lng: number | null
  radio_metros: number | null
}

export interface AutomationRule {
  activo: boolean
  ventana_aleatoria_minutos?: number | null
  telefono?: string | null
  entrada: AutomationBlock
  salida: AutomationBlock
  ubicacion: LocationSettings
  zona_horaria: string
}

export interface AutomationPayload extends AutomationRule {
  entrada: AutomationBlock & { hora_utc?: string | null }
  salida: AutomationBlock & { hora_utc?: string | null }
}

export type IsoDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface PersistedTimeBlock {
  enabled: boolean
  localTime: string | null
  utcTime: string | null
  days: IsoDay[]
}

export interface PersistedAutomationPayload {
  isActive: boolean
  randomWindowMinutes?: number | null
  phoneNumber?: string | null
  schedule: {
    entry: PersistedTimeBlock
    exit: PersistedTimeBlock
  }
  location: {
    address: string
    latitude: number | null
    longitude: number | null
    radiusMeters: number | null
  }
  timezone: string
}
