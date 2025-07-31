"use client"

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getAnalytics, type Analytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyBGmkJ6tjZkuoWyZmohKzcZ_2hNGNSGvnc",
  authDomain: "healthticks.firebaseapp.com",
  projectId: "healthticks",
  storageBucket: "healthticks.firebasestorage.app",
  messagingSenderId: "781338001777",
  appId: "1:781338001777:web:26608f48c32957588976d0",
  measurementId: "G-ZEFRLKWRMB",
}

// Global variables to store Firebase instances
let app: FirebaseApp | null = null
let db: Firestore | null = null
let analytics: Analytics | null = null

// Initialize Firebase only on client side
export const initializeFirebase = (): {
  app: FirebaseApp | null
  db: Firestore | null
  analytics: Analytics | null
} => {
  // Only run in browser environment
  if (typeof window === "undefined") {
    return { app: null, db: null, analytics: null }
  }

  try {
    // Initialize Firebase app if not already initialized
    if (!app) {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
    }

    // Initialize Firestore if not already initialized
    if (!db && app) {
      db = getFirestore(app)
    }

    // Initialize Analytics if not already initialized (only in production)
    if (!analytics && app && process.env.NODE_ENV === "production") {
      analytics = getAnalytics(app)
    }

    return { app, db, analytics }
  } catch (error) {
    console.error("Error initializing Firebase:", error)
    return { app: null, db: null, analytics: null }
  }
}

// Export getter functions instead of direct exports
export const getFirebaseApp = () => app
export const getFirebaseDb = () => db
export const getFirebaseAnalytics = () => analytics

// Collections
export const COLLECTIONS = {
  CLIENTS: "clients",
  BOOKINGS: "bookings",
} as const
