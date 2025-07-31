# HealthTick Calendar System

A professional calendar system for HealthTick coaches to manage onboarding and follow-up calls with clients, now powered by Firebase Firestore.

## 🚀 Features

### **Enhanced UI/UX**
- **Modern gradient design** with glassmorphism effects
- **Responsive layout** that works perfectly on all devices
- **Smooth animations** and transitions throughout
- **Professional color scheme** with blue/indigo gradients
- **Enhanced visual feedback** with loading states and success indicators

### **Calendar System**
- **Daily view** with 20-minute time slots (10:30 AM - 7:30 PM)
- **Smart scheduling** that prevents overlapping bookings
- **Two call types**: Onboarding (40 min, one-time) and Follow-up (20 min, weekly recurring)
- **Recurring logic** for follow-up calls that repeat weekly
- **Real-time availability** checking with visual indicators

### **Firebase Integration**
- **Real-time data** with Firestore database
- **Automatic client initialization** with 20 pre-loaded clients
- **Efficient querying** for bookings by date
- **Batch operations** for optimal performance
- **Error handling** with proper user feedback

### **Professional Features**
- **Client search** by name or phone number
- **Statistics dashboard** showing today's calls and total clients
- **Enhanced booking modal** with improved UX
- **Delete functionality** with confirmation
- **Toast notifications** for all actions

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: Firebase Firestore
- **Styling**: Tailwind CSS with custom gradients
- **UI Components**: Radix UI (shadcn/ui)
- **Icons**: Lucide React
- **Analytics**: Firebase Analytics

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Firestore enabled
- npm or yarn

### Installation

1. **Clone the repository:**
\`\`\`bash
git clone <repository-url>
cd healthtick-calendar
\`\`\`

2. **Install dependencies:**
\`\`\`bash
npm install
\`\`\`

3. **Firebase Setup:**
   - The Firebase configuration is already set up with your credentials
   - Make sure Firestore is enabled in your Firebase console
   - Set up Firestore rules for read/write access

4. **Run the development server:**
\`\`\`bash
npm run dev
\`\`\`

5. **Open [http://localhost:3000](http://localhost:3000)**

## 📁 Project Structure

\`\`\`
src/
├── app/
│   ├── page.tsx              # Enhanced main calendar component
│   ├── layout.tsx            # Root layout with metadata
│   └── globals.css           # Enhanced global styles with gradients
├── lib/
│   ├── firebase-config.ts    # Firebase configuration
│   ├── firebase-service.ts   # Firestore service layer
│   ├── types.ts              # TypeScript interfaces
│   └── utils.ts              # Utility functions
└── components/ui/            # Reusable UI components
\`\`\`

## 🔥 Firebase Schema

### Collections

#### **clients**
\`\`\`typescript
{
  id: string (auto-generated)
  name: string
  phone: string
  email?: string
  createdAt: Timestamp
}
\`\`\`

#### **bookings**
\`\`\`typescript
{
  id: string (auto-generated)
  clientId: string (reference)
  clientName: string (denormalized)
  clientPhone: string (denormalized)
  callType: 'onboarding' | 'follow-up'
  date: Timestamp
  timeSlot: string (HH:MM format)
  isRecurring: boolean
  createdAt: Timestamp
}
\`\`\`

## ✨ Enhanced Features

### **UI Improvements**
- **Gradient backgrounds** with glassmorphism effects
- **Enhanced loading states** with professional spinners
- **Better visual hierarchy** with improved typography
- **Smooth hover effects** and transitions
- **Professional card designs** with subtle shadows
- **Enhanced booking modal** with better spacing and layout

### **UX Improvements**
- **Real-time feedback** for all user actions
- **Better error handling** with descriptive messages
- **Improved navigation** with Today button
- **Enhanced statistics** showing relevant metrics
- **Better visual indicators** for booking status
- **Smooth animations** for state changes

### **Technical Improvements**
- **Firebase integration** with proper error handling
- **Optimized queries** for better performance
- **Batch operations** for client initialization
- **Proper TypeScript** throughout the application
- **Enhanced state management** with immediate UI updates
- **Better separation of concerns** with service layer

## 🎯 Key Business Logic

### **Time Slot Management**
- Generates 20-minute slots from 10:30 AM to 7:30 PM
- Validates availability based on call duration (40min vs 20min)
- Prevents overlapping bookings with smart conflict detection

### **Recurring Logic**
- Follow-up calls repeat weekly on the same day/time
- Efficient storage: one record generates multiple occurrences
- Smart filtering shows relevant calls for any given date

### **Conflict Prevention**
- Checks for overlaps before booking
- Considers call duration when validating availability
- Real-time availability updates in the UI

## 🚀 Deployment

### **Vercel (Recommended)**
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables if needed
4. Deploy automatically

### **Manual Build**
\`\`\`bash
npm run build
npm start
\`\`\`

## 🔒 Firebase Security Rules

Add these rules to your Firestore:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clients/{document} {
      allow read, write: if true;
    }
    match /bookings/{document} {
      allow read, write: if true;
    }
  }
}
\`\`\`

## 🎨 Design System

### **Colors**
- Primary: Blue to Indigo gradient
- Success: Green tones
- Warning: Amber tones
- Error: Red tones
- Neutral: Gray scale

### **Typography**
- Headings: Bold, gradient text effects
- Body: Clean, readable fonts
- Labels: Medium weight for clarity

### **Components**
- Cards: Glassmorphism with subtle shadows
- Buttons: Gradient backgrounds with hover effects
- Inputs: Clean borders with focus states
- Badges: Color-coded for different states

## 🔮 Future Enhancements

- **Email notifications** for booking confirmations
- **SMS reminders** for upcoming calls
- **Calendar export** (Google Calendar, iCal)
- **Multi-coach support** with role-based access
- **Advanced recurring patterns** (bi-weekly, monthly)
- **Time zone support** for global clients
- **Mobile app** with React Native
- **Video call integration** with Zoom/Meet
- **Client portal** for self-booking
- **Analytics dashboard** with insights

## 📝 License

This project is proprietary to HealthTick.

---

**Built with ❤️ for HealthTick coaches**
