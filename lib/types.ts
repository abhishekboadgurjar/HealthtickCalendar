export interface Client {
  id: string
  name: string
  phone: string
  email?: string
  createdAt: string
}

export interface Booking {
  id: string
  clientId: string
  clientName: string
  clientPhone: string
  callType: CallType
  date: string // ISO string
  timeSlot: string // HH:MM format
  isRecurring: boolean
  createdAt: string
}

export type CallType = "onboarding" | "follow-up"

export interface TimeSlot {
  time: string // HH:MM format
  display: string // Human readable format
}

export interface BookingConflict {
  hasConflict: boolean
  conflictingBookings: Booking[]
}
