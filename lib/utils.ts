import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Booking, TimeSlot } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = []
  const startHour = 10
  const startMinute = 30
  const endHour = 19
  const endMinute = 30

  let currentHour = startHour
  let currentMinute = startMinute

  while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
    const timeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`
    const displayTime = formatTime(timeString)

    slots.push({
      time: timeString,
      display: displayTime,
    })

    // Add 20 minutes
    currentMinute += 20
    if (currentMinute >= 60) {
      currentHour += 1
      currentMinute -= 60
    }
  }

  return slots
}

export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(":").map(Number)
  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
}

export function getBookingsForDate(bookings: Booking[], date: Date): Booking[] {
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  return bookings.filter((booking) => {
    const bookingDate = new Date(booking.date)

    if (booking.isRecurring) {
      // For recurring bookings, check if the day of week matches
      const bookingDay = bookingDate.getDay()
      const targetDay = targetDate.getDay()

      // Only show if it's the same day of week and the target date is after the original booking date
      return bookingDay === targetDay && targetDate >= new Date(bookingDate.toDateString())
    } else {
      // For one-time bookings, exact date match
      return bookingDate.toDateString() === targetDate.toDateString()
    }
  })
}

export function isTimeSlotAvailable(timeSlot: string, existingBookings: Booking[], duration: number): boolean {
  const [hours, minutes] = timeSlot.split(":").map(Number)
  const slotStart = hours * 60 + minutes
  const slotEnd = slotStart + duration

  for (const booking of existingBookings) {
    const [bookingHours, bookingMinutes] = booking.timeSlot.split(":").map(Number)
    const bookingStart = bookingHours * 60 + bookingMinutes
    const bookingDuration = booking.callType === "onboarding" ? 40 : 20
    const bookingEnd = bookingStart + bookingDuration

    // Check for overlap
    if (slotStart < bookingEnd && slotEnd > bookingStart) {
      return false
    }
  }

  return true
}

export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + weeks * 7)
  return result
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString()
}
