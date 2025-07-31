"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  Clock,
  Plus,
  Search,
  User,
  Phone,
  Trash2,
  CalendarDays,
  Users,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Database,
  XIcon as DatabaseX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { FirebaseService } from "@/lib/firebase-service"
import type { Client, Booking, CallType } from "@/lib/types"
import { generateTimeSlots, isTimeSlotAvailable, getBookingsForDate } from "@/lib/utils"

export default function HealthTickCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("")
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedCallType, setSelectedCallType] = useState<CallType>("onboarding")
  const [clientSearch, setClientSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [firebaseAvailable, setFirebaseAvailable] = useState(false)

  const [firebaseService] = useState(() => new FirebaseService())
  const timeSlots = generateTimeSlots()

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      loadInitialData()

      // Monitor online status
      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)

      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)

      return () => {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
    }
  }, [])

  useEffect(() => {
    if (!loading && typeof window !== "undefined") {
      loadBookingsForDate()
    }
  }, [selectedDate, loading])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check Firebase availability
      const isFirebaseReady = firebaseService.isFirebaseAvailable()
      setFirebaseAvailable(isFirebaseReady)

      if (isFirebaseReady) {
        // Initialize default clients if needed
        await firebaseService.initializeDefaultClients()
      }

      const [clientsData, bookingsData] = await Promise.all([
        firebaseService.getClients(),
        firebaseService.getAllBookings(),
      ])

      setClients(clientsData)
      setBookings(bookingsData)

      if (!isFirebaseReady) {
        toast({
          title: "Demo Mode",
          description: "Running in demo mode with sample data. Firebase connection unavailable.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error loading initial data:", error)
      setError("Failed to load data. Running in demo mode.")
      toast({
        title: "Demo Mode",
        description: "Running in demo mode with sample data.",
        variant: "default",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadBookingsForDate = async () => {
    try {
      const dateBookings = await firebaseService.getBookingsForDate(selectedDate)
      setBookings((prev) => {
        const otherDateBookings = prev.filter((b) => {
          const bookingDate = new Date(b.date)
          return bookingDate.toDateString() !== selectedDate.toDateString()
        })
        return [...otherDateBookings, ...dateBookings]
      })
    } catch (error) {
      console.error("Error loading bookings for date:", error)
    }
  }

  const handleBookCall = async () => {
    if (!selectedClient || !selectedTimeSlot) {
      toast({
        title: "Missing Information",
        description: "Please select a client and time slot.",
        variant: "destructive",
      })
      return
    }

    const client = clients.find((c) => c.id === selectedClient)
    if (!client) return

    const [hours, minutes] = selectedTimeSlot.split(":").map(Number)
    const bookingDate = new Date(selectedDate)
    bookingDate.setHours(hours, minutes, 0, 0)

    // Check for conflicts
    const dayBookings = getBookingsForDate(bookings, selectedDate)
    const duration = selectedCallType === "onboarding" ? 40 : 20

    if (!isTimeSlotAvailable(selectedTimeSlot, dayBookings, duration)) {
      toast({
        title: "Time Conflict",
        description: "This time slot conflicts with an existing booking.",
        variant: "destructive",
      })
      return
    }

    try {
      setBookingLoading(true)

      const newBooking: Omit<Booking, "id"> = {
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone,
        callType: selectedCallType,
        date: bookingDate.toISOString(),
        timeSlot: selectedTimeSlot,
        isRecurring: selectedCallType === "follow-up",
        createdAt: new Date().toISOString(),
      }

      if (firebaseAvailable) {
        const bookingId = await firebaseService.createBooking(newBooking)
        setBookings((prev) => [...prev, { ...newBooking, id: bookingId }])
      } else {
        // Demo mode - create local booking
        const bookingId = Date.now().toString()
        setBookings((prev) => [...prev, { ...newBooking, id: bookingId }])
      }

      toast({
        title: "Success!",
        description: `${selectedCallType === "onboarding" ? "Onboarding" : "Follow-up"} call booked with ${client.name}`,
      })

      // Reset form
      setSelectedClient("")
      setSelectedTimeSlot("")
      setSelectedCallType("onboarding")
      setClientSearch("")
      setIsBookingModalOpen(false)
    } catch (error) {
      console.error("Error booking call:", error)
      toast({
        title: "Error",
        description: "Failed to book the call. Please try again.",
        variant: "destructive",
      })
    } finally {
      setBookingLoading(false)
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      if (firebaseAvailable) {
        await firebaseService.deleteBooking(bookingId)
      }
      setBookings((prev) => prev.filter((b) => b.id !== bookingId))
      toast({
        title: "Success",
        description: "Booking deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting booking:", error)
      toast({
        title: "Error",
        description: "Failed to delete booking. Please try again.",
        variant: "destructive",
      })
    }
  }

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const filteredClients = clients.filter(
    (client) => client.name.toLowerCase().includes(clientSearch.toLowerCase()) || client.phone.includes(clientSearch),
  )

  const dayBookings = getBookingsForDate(bookings, selectedDate)
  const totalBookings = bookings.length
  const todayBookings = getBookingsForDate(bookings, new Date()).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Loading HealthTick Calendar</h3>
            <p className="text-gray-600">Setting up your coaching schedule...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Connection Status */}
        {!isOnline && (
          <Alert className="mb-4 border-amber-200 bg-amber-50">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>You're currently offline. Some features may be limited.</AlertDescription>
          </Alert>
        )}

        {!firebaseAvailable && (
          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <DatabaseX className="h-4 w-4" />
            <AlertDescription>
              Running in demo mode with sample data. Firebase connection is not available.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  HealthTick Calendar
                </h1>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-600 text-lg">Manage your coaching calls with ease</p>
                  <div className="flex items-center space-x-1">
                    {isOnline ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    {firebaseAvailable ? (
                      <Database className="h-4 w-4 text-green-500" />
                    ) : (
                      <DatabaseX className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-4">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <CalendarDays className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Today's Calls</p>
                      <p className="text-2xl font-bold text-gray-900">{todayBookings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Clients</p>
                      <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enhanced Date Navigation */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => navigateDate("prev")} className="hover:bg-blue-50">
                    ← Previous
                  </Button>
                  <Button variant="outline" onClick={goToToday} className="hover:bg-blue-50 bg-transparent">
                    Today
                  </Button>
                  <Button variant="outline" onClick={() => navigateDate("next")} className="hover:bg-blue-50">
                    Next →
                  </Button>
                </div>

                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Badge variant={dayBookings.length > 0 ? "default" : "secondary"} className="text-sm">
                      {dayBookings.length} call{dayBookings.length !== 1 ? "s" : ""} scheduled
                    </Badge>
                    {!firebaseAvailable && (
                      <Badge variant="outline" className="text-xs">
                        Demo Mode
                      </Badge>
                    )}
                  </div>
                </div>

                <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                      <Plus className="h-4 w-4 mr-2" />
                      Book New Call
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg overflow-hidden">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold flex items-center space-x-2">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                        <span>Book a New Call</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                      <div className="space-y-2">
                        <Label htmlFor="client-search" className="text-sm font-medium flex items-center space-x-2">
                          <Search className="h-4 w-4" />
                          <span>Search Client</span>
                        </Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                          <Input
                            id="client-search"
                            placeholder="Search by name or phone..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Select Client</span>
                        </Label>
                        <Select value={selectedClient} onValueChange={setSelectedClient}>
                          <SelectTrigger className="transition-all duration-200 hover:border-blue-300 focus:ring-2 focus:ring-blue-500">
                            <SelectValue placeholder="Choose a client" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] overflow-y-auto">
                            <div className="p-2">
                              {filteredClients.length === 0 ? (
                                <div className="text-center py-6 text-gray-500">
                                  <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">No clients found</p>
                                  <p className="text-xs">Try adjusting your search</p>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {filteredClients.map((client, index) => (
                                    <SelectItem
                                      key={client.id}
                                      value={client.id}
                                      className="cursor-pointer transition-all duration-200 hover:bg-blue-50 focus:bg-blue-50 rounded-lg p-3 border border-transparent hover:border-blue-200"
                                      style={{
                                        animationDelay: `${index * 50}ms`,
                                        animation: "fadeInUp 0.3s ease-out forwards",
                                      }}
                                    >
                                      <div className="flex items-center space-x-3 w-full">
                                        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-2 rounded-full transition-all duration-200 group-hover:from-blue-200 group-hover:to-indigo-200">
                                          <User className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <span className="font-medium text-gray-900 truncate">{client.name}</span>
                                            <Badge variant="outline" className="ml-2 text-xs">
                                              Client
                                            </Badge>
                                          </div>
                                          <div className="flex items-center space-x-2 mt-1">
                                            <Phone className="h-3 w-3 text-gray-400" />
                                            <span className="text-sm text-gray-600">{client.phone}</span>
                                          </div>
                                          {client.email && (
                                            <div className="flex items-center space-x-2 mt-1">
                                              <div className="h-3 w-3 rounded-full bg-green-400"></div>
                                              <span className="text-xs text-gray-500 truncate">{client.email}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </div>
                              )}
                            </div>
                          </SelectContent>
                        </Select>
                        {selectedClient && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg transition-all duration-300 animate-in slide-in-from-top-2">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-600 p-2 rounded-full">
                                <CheckCircle className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-blue-900">
                                  {clients.find((c) => c.id === selectedClient)?.name} selected
                                </p>
                                <p className="text-sm text-blue-700">
                                  {clients.find((c) => c.id === selectedClient)?.phone}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>Call Type</span>
                        </Label>
                        <Select
                          value={selectedCallType}
                          onValueChange={(value: CallType) => setSelectedCallType(value)}
                        >
                          <SelectTrigger className="transition-all duration-200 hover:border-blue-300 focus:ring-2 focus:ring-blue-500">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="onboarding" className="cursor-pointer">
                              <div className="flex items-center space-x-3 py-2">
                                <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-2 rounded-lg">
                                  <User className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium">Onboarding Call</span>
                                  <span className="text-sm text-gray-500">40 minutes • One-time session</span>
                                </div>
                              </div>
                            </SelectItem>
                            <SelectItem value="follow-up" className="cursor-pointer">
                              <div className="flex items-center space-x-3 py-2">
                                <div className="bg-gradient-to-r from-purple-100 to-violet-100 p-2 rounded-lg">
                                  <Clock className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-medium">Follow-up Call</span>
                                  <span className="text-sm text-gray-500">20 minutes • Weekly recurring</span>
                                </div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center space-x-2">
                          <CalendarDays className="h-4 w-4" />
                          <span>Time Slot</span>
                        </Label>
                        <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                          <SelectTrigger className="transition-all duration-200 hover:border-blue-300 focus:ring-2 focus:ring-blue-500">
                            <SelectValue placeholder="Choose a time" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] overflow-y-auto">
                            <div className="p-2 space-y-1">
                              {timeSlots.map((slot, index) => {
                                const duration = selectedCallType === "onboarding" ? 40 : 20
                                const available = isTimeSlotAvailable(slot.time, dayBookings, duration)
                                return (
                                  <SelectItem
                                    key={slot.time}
                                    value={slot.time}
                                    disabled={!available}
                                    className={`cursor-pointer transition-all duration-200 rounded-lg p-3 ${
                                      available
                                        ? "hover:bg-green-50 focus:bg-green-50 border border-transparent hover:border-green-200"
                                        : "opacity-50 cursor-not-allowed bg-gray-50"
                                    }`}
                                    style={{
                                      animationDelay: `${index * 30}ms`,
                                      animation: "fadeInUp 0.2s ease-out forwards",
                                    }}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center space-x-3">
                                        <div
                                          className={`p-2 rounded-lg ${
                                            available ? "bg-gradient-to-r from-green-100 to-emerald-100" : "bg-gray-100"
                                          }`}
                                        >
                                          <Clock
                                            className={`h-4 w-4 ${available ? "text-green-600" : "text-gray-400"}`}
                                          />
                                        </div>
                                        <span
                                          className={`font-medium ${available ? "text-gray-900" : "text-gray-400"}`}
                                        >
                                          {slot.display}
                                        </span>
                                      </div>
                                      {!available && (
                                        <Badge variant="secondary" className="text-xs">
                                          Unavailable
                                        </Badge>
                                      )}
                                      {available && (
                                        <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                                          Available
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                )
                              })}
                            </div>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator className="my-6" />

                      <div className="space-y-4">
                        {selectedClient && selectedTimeSlot && (
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl transition-all duration-300 animate-in slide-in-from-bottom-2">
                            <h4 className="font-semibold text-blue-900 mb-2 flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4" />
                              <span>Booking Summary</span>
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-blue-700">Client:</span>
                                <span className="font-medium text-blue-900">
                                  {clients.find((c) => c.id === selectedClient)?.name}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">Call Type:</span>
                                <span className="font-medium text-blue-900">
                                  {selectedCallType === "onboarding" ? "Onboarding (40min)" : "Follow-up (20min)"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">Time:</span>
                                <span className="font-medium text-blue-900">
                                  {timeSlots.find((s) => s.time === selectedTimeSlot)?.display}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700">Date:</span>
                                <span className="font-medium text-blue-900">
                                  {selectedDate.toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={handleBookCall}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                          disabled={bookingLoading || !selectedClient || !selectedTimeSlot}
                          size="lg"
                        >
                          {bookingLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                              <span>Booking Call...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-5 w-5 mr-3" />
                              <span>Confirm Booking</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Calendar Grid */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span>Daily Schedule</span>
              <Badge variant="outline" className="ml-auto">
                10:30 AM - 7:30 PM
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeSlots.map((slot, index) => {
                const booking = dayBookings.find((b) => b.timeSlot === slot.time)
                const isEvenSlot = index % 2 === 0

                return (
                  <div
                    key={slot.time}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                      booking
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md"
                        : `${isEvenSlot ? "bg-gray-50" : "bg-white"} border-gray-200 hover:border-gray-300 hover:shadow-sm`
                    }`}
                  >
                    <div className="flex items-center space-x-6">
                      <div className="text-sm font-semibold text-gray-700 w-24 text-center bg-white px-3 py-1 rounded-lg shadow-sm">
                        {slot.display}
                      </div>

                      {booking ? (
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-600 p-2 rounded-full">
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900">{booking.clientName}</span>
                              <div className="flex items-center space-x-2 mt-1">
                                <Phone className="h-3 w-3 text-gray-500" />
                                <span className="text-sm text-gray-600">{booking.clientPhone}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={booking.callType === "onboarding" ? "default" : "secondary"}
                              className="font-medium"
                            >
                              {booking.callType === "onboarding" ? "Onboarding (40min)" : "Follow-up (20min)"}
                            </Badge>
                            {booking.isRecurring && (
                              <Badge variant="outline" className="text-xs">
                                🔄 Recurring
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                          </div>
                          <span className="text-gray-500 font-medium">Available for booking</span>
                        </div>
                      )}
                    </div>

                    {booking && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
