import type { Client, Booking } from "./types"

// Mock data for demonstration - in a real app, this would be Firebase
const MOCK_CLIENTS: Client[] = [
  {
    id: "1",
    name: "Sriram Kumar",
    phone: "+91-9876543210",
    email: "sriram@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Shilpa Sharma",
    phone: "+91-9876543211",
    email: "shilpa@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Rahul Gupta",
    phone: "+91-9876543212",
    email: "rahul@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Priya Patel",
    phone: "+91-9876543213",
    email: "priya@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Amit Singh",
    phone: "+91-9876543214",
    email: "amit@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Neha Agarwal",
    phone: "+91-9876543215",
    email: "neha@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "7",
    name: "Vikram Rao",
    phone: "+91-9876543216",
    email: "vikram@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "8",
    name: "Kavya Reddy",
    phone: "+91-9876543217",
    email: "kavya@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "9",
    name: "Arjun Mehta",
    phone: "+91-9876543218",
    email: "arjun@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "10",
    name: "Deepika Jain",
    phone: "+91-9876543219",
    email: "deepika@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "11",
    name: "Rohit Verma",
    phone: "+91-9876543220",
    email: "rohit@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "12",
    name: "Ananya Das",
    phone: "+91-9876543221",
    email: "ananya@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "13",
    name: "Karthik Nair",
    phone: "+91-9876543222",
    email: "karthik@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "14",
    name: "Pooja Iyer",
    phone: "+91-9876543223",
    email: "pooja@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "15",
    name: "Suresh Pillai",
    phone: "+91-9876543224",
    email: "suresh@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "16",
    name: "Meera Krishnan",
    phone: "+91-9876543225",
    email: "meera@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "17",
    name: "Rajesh Khanna",
    phone: "+91-9876543226",
    email: "rajesh@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "18",
    name: "Sneha Malhotra",
    phone: "+91-9876543227",
    email: "sneha@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "19",
    name: "Manoj Tiwari",
    phone: "+91-9876543228",
    email: "manoj@example.com",
    createdAt: new Date().toISOString(),
  },
  {
    id: "20",
    name: "Ritu Bansal",
    phone: "+91-9876543229",
    email: "ritu@example.com",
    createdAt: new Date().toISOString(),
  },
]

export class CalendarService {
  private bookings: Booking[] = []
  private clients: Client[] = MOCK_CLIENTS

  // Simulate Firebase operations with localStorage for persistence
  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("healthtick-bookings")
      if (stored) {
        this.bookings = JSON.parse(stored)
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      localStorage.setItem("healthtick-bookings", JSON.stringify(this.bookings))
    }
  }

  async getClients(): Promise<Client[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300))
    return this.clients
  }

  async getAllBookings(): Promise<Booking[]> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return this.bookings
  }

  async getBookingsForDate(date: Date): Promise<Booking[]> {
    await new Promise((resolve) => setTimeout(resolve, 100))

    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    return this.bookings.filter((booking) => {
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

  async createBooking(booking: Omit<Booking, "id">): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newBooking: Booking = { ...booking, id }

    this.bookings.push(newBooking)
    this.saveToStorage()

    return id
  }

  async deleteBooking(bookingId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300))

    this.bookings = this.bookings.filter((b) => b.id !== bookingId)
    this.saveToStorage()
  }

  async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const index = this.bookings.findIndex((b) => b.id === bookingId)
    if (index !== -1) {
      this.bookings[index] = { ...this.bookings[index], ...updates }
      this.saveToStorage()
    }
  }
}
