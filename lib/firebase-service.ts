"use client"

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  type Firestore,
} from "firebase/firestore"
import { initializeFirebase, COLLECTIONS } from "./firebase-config"
import type { Client, Booking } from "./types"

export class FirebaseService {
  private db: Firestore | null = null
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  private initialize() {
    if (typeof window === "undefined") {
      return
    }

    try {
      const { db } = initializeFirebase()
      this.db = db
      this.isInitialized = !!db
    } catch (error) {
      console.error("Failed to initialize Firebase service:", error)
      this.isInitialized = false
    }
  }

  private ensureInitialized(): boolean {
    if (!this.isInitialized || !this.db) {
      this.initialize()
    }
    return this.isInitialized && !!this.db
  }

  // Client operations
  async getClients(): Promise<Client[]> {
    if (!this.ensureInitialized() || !this.db) {
      console.warn("Firebase not available, using mock data")
      return this.getMockClients()
    }

    try {
      const clientsRef = collection(this.db, COLLECTIONS.CLIENTS)
      const q = query(clientsRef, orderBy("name"))
      const snapshot = await getDocs(q)

      const clients = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as Client[]

      return clients.length > 0 ? clients : this.getMockClients()
    } catch (error) {
      console.error("Error fetching clients:", error)
      return this.getMockClients()
    }
  }

  async createClient(client: Omit<Client, "id">): Promise<string> {
    if (!this.ensureInitialized() || !this.db) {
      throw new Error("Firebase not available")
    }

    try {
      const clientsRef = collection(this.db, COLLECTIONS.CLIENTS)
      const docRef = await addDoc(clientsRef, {
        ...client,
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating client:", error)
      throw new Error("Failed to create client")
    }
  }

  // Booking operations
  async getAllBookings(): Promise<Booking[]> {
    if (!this.ensureInitialized() || !this.db) {
      console.warn("Firebase not available, returning empty bookings")
      return []
    }

    try {
      const bookingsRef = collection(this.db, COLLECTIONS.BOOKINGS)
      const q = query(bookingsRef, orderBy("date"))
      const snapshot = await getDocs(q)

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date,
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as Booking[]
    } catch (error) {
      console.error("Error fetching bookings:", error)
      return []
    }
  }

  async getBookingsForDate(date: Date): Promise<Booking[]> {
    if (!this.ensureInitialized() || !this.db) {
      return []
    }

    try {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const bookingsRef = collection(this.db, COLLECTIONS.BOOKINGS)
      const q = query(
        bookingsRef,
        where("date", ">=", Timestamp.fromDate(startOfDay)),
        where("date", "<=", Timestamp.fromDate(endOfDay)),
        orderBy("date"),
      )

      const snapshot = await getDocs(q)

      const dayBookings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date,
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as Booking[]

      // Also get recurring bookings that fall on this day
      const recurringBookingsRef = collection(this.db, COLLECTIONS.BOOKINGS)
      const recurringQuery = query(recurringBookingsRef, where("isRecurring", "==", true))

      const recurringSnapshot = await getDocs(recurringQuery)
      const recurringBookings = recurringSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date,
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as Booking[]

      // Filter recurring bookings for this day of week
      const targetDay = date.getDay()
      const relevantRecurring = recurringBookings.filter((booking) => {
        const bookingDate = new Date(booking.date)
        const bookingDay = bookingDate.getDay()
        return bookingDay === targetDay && date >= bookingDate
      })

      return [...dayBookings, ...relevantRecurring]
    } catch (error) {
      console.error("Error fetching bookings for date:", error)
      return []
    }
  }

  async createBooking(booking: Omit<Booking, "id">): Promise<string> {
    if (!this.ensureInitialized() || !this.db) {
      throw new Error("Firebase not available")
    }

    try {
      const bookingsRef = collection(this.db, COLLECTIONS.BOOKINGS)
      const docRef = await addDoc(bookingsRef, {
        ...booking,
        date: Timestamp.fromDate(new Date(booking.date)),
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating booking:", error)
      throw new Error("Failed to create booking")
    }
  }

  async deleteBooking(bookingId: string): Promise<void> {
    if (!this.ensureInitialized() || !this.db) {
      throw new Error("Firebase not available")
    }

    try {
      const bookingRef = doc(this.db, COLLECTIONS.BOOKINGS, bookingId)
      await deleteDoc(bookingRef)
    } catch (error) {
      console.error("Error deleting booking:", error)
      throw new Error("Failed to delete booking")
    }
  }

  async updateBooking(bookingId: string, updates: Partial<Booking>): Promise<void> {
    if (!this.ensureInitialized() || !this.db) {
      throw new Error("Firebase not available")
    }

    try {
      const bookingRef = doc(this.db, COLLECTIONS.BOOKINGS, bookingId)
      const updateData = { ...updates }

      if (updates.date) {
        updateData.date = Timestamp.fromDate(new Date(updates.date)) as any
      }

      await updateDoc(bookingRef, updateData)
    } catch (error) {
      console.error("Error updating booking:", error)
      throw new Error("Failed to update booking")
    }
  }

  // Initialize default clients if none exist
  async initializeDefaultClients(): Promise<void> {
    if (!this.ensureInitialized() || !this.db) {
      console.warn("Firebase not available, skipping client initialization")
      return
    }

    try {
      const clients = await this.getClients()
      if (clients.length === 0 || clients === this.getMockClients()) {
        const defaultClients = this.getMockClients()

        const batch = writeBatch(this.db)
        const clientsRef = collection(this.db, COLLECTIONS.CLIENTS)

        defaultClients.forEach((client) => {
          const docRef = doc(clientsRef)
          batch.set(docRef, {
            name: client.name,
            phone: client.phone,
            email: client.email,
            createdAt: Timestamp.now(),
          })
        })

        await batch.commit()
        console.log("Default clients initialized in Firebase")
      }
    } catch (error) {
      console.error("Error initializing default clients:", error)
    }
  }

  // Check if Firebase is available
  isFirebaseAvailable(): boolean {
    return this.ensureInitialized()
  }

  // Mock data fallback
  private getMockClients(): Client[] {
    return [
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
  }
}
