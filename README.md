# EP Resolve - Service Desk

EP Resolve is the central IT support and ticketing platform for Grupo EP. It allows employees to open support tickets (for systems like Plandoc, Mylims, etc.) and enables the IT support team to manage, respond to, and analyze support requests efficiently. 

The application features a modern, premium user interface with robust analytics for helpdesk SLA tracking.

## Key Features

- **Google Workspace Authentication**: Secure login restricted to the `@grupoep.com.br` domain.
- **Ticket Management**: Create tickets with file attachments (images/PDFs), categorize by department and system.
- **Agent Dashboard**: Dedicated view for IT agents to take ownership of tickets, communicate with users, and resolve issues.
- **Real-time Communication**: Chat-like interface within ticket details for updates and issue resolution.
- **Feedback System (CSAT)**: Post-resolution 5-star rating system for users to evaluate the support experience.
- **Advanced Analytics & Reports**: Specialized dashboard for agents showing Volume, Average Resolution Time (TTR), First Response Time (FRT), SLA compliance (24h goal), and Backlog Aging.

## Tech Stack

- **Language**: TypeScript
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router DOM 7
- **Styling**: Tailwind CSS 3
- **Icons**: Lucide React
- **Charts**: Recharts
- **Backend/Database**: Firebase (Authentication, Firestore, Storage)

## Prerequisites

Before starting, ensure you have the following installed:

- Node.js 18 or higher
- npm (or yarn/pnpm)
- A Firebase project set up with Authentication (Google Provider), Firestore, and Storage.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/helder-filho/EP-Resolve-web.git
cd EP-Resolve-web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file or create a `.env` file in the root directory:

```bash
touch .env
```

Configure the following variables with your Firebase project credentials:

| Variable | Description | Example |
| -------- | ----------- | ------- |
| `VITE_FIREBASE_API_KEY` | Firebase API Key | `AIzaSyB...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `ep-resolve.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `ep-resolve` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `ep-resolve.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `1234567890` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123:web:abc` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Measurement ID | `G-XYZ...` |

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Architecture

### Directory Structure

```
├── APP DOCUMENTATON/      # Specialized documentation (e.g., Reports logic)
├── public/                # Static assets (favicons, etc.)
├── src/
│   ├── assets/            # Project images and assets
│   ├── components/        # React components
│   │   ├── Dashboard.tsx  # User & Agent ticket list
│   │   ├── Feedback.tsx   # CSAT rating screen
│   │   ├── Layout.tsx     # Main application layout and sidebar
│   │   ├── Login.tsx      # Authentication screen
│   │   ├── Reports.tsx    # SLA and Analytics dashboard
│   │   ├── TicketDetails.tsx # Detailed view and chat for a ticket
│   │   └── TicketForm.tsx # New ticket submission form
│   ├── App.tsx            # Main application router
│   ├── firebase.ts        # Firebase initialization and config
│   ├── index.css          # Global Tailwind and custom styles
│   └── main.tsx           # React entry point
├── .env                   # Environment variables (not in version control)
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
└── vite.config.ts         # Vite bundler configuration
```

### Data Flow

1. **Authentication**: Users log in via Google. `firebase.ts` enforces the `grupoep.com.br` hosted domain.
2. **Ticket Creation**: `TicketForm.tsx` uploads attachments to Firebase Storage and writes a document to the `ep-resolve` Firestore collection with `status: 'Open'`.
3. **Ticket Processing**: Agents use `TicketDetails.tsx` to change status to `In Progress` (recording `assignedAt`) and communicate via the `comments` subcollection.
4. **Resolution**: Agents close the ticket (recording `resolvedAt`).
5. **Feedback**: Users rate the interaction in `Feedback.tsx`, updating the ticket document with `feedbackRating` and `feedbackComment`.
6. **Analytics**: `Reports.tsx` aggregates all tickets to calculate KPIs like TTR, FRT, and Handle Time.

### Database Schema (Firestore)

**Collection: `ep-resolve` (Tickets)**
- `id` (string, Document ID)
- `title` (string)
- `description` (string)
- `system` (string)
- `department` (string)
- `userName` (string)
- `userEmail` (string)
- `assignedToName` (string, optional)
- `assignedToEmail` (string, optional)
- `status` (string: "Open", "In Progress", "Closed")
- `attachmentUrl` (string, optional)
- `createdAt` (timestamp)
- `assignedAt` (timestamp, optional)
- `resolvedAt` (timestamp, optional)
- `feedbackRating` (number, optional)
- `feedbackComment` (string, optional)
- `feedbackAt` (timestamp, optional)

**Subcollection: `comments` (Inside a Ticket document)**
- `id` (string, Document ID)
- `text` (string)
- `authorName` (string)
- `authorEmail` (string)
- `isSystem` (boolean)
- `imageUrl` (string, optional)
- `createdAt` (timestamp)

## Available Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start development server with Vite |
| `npm run build` | Build the application for production |
| `npm run preview` | Locally preview the production build |
| `npm run lint` | Run ESLint to find issues in the code |

## Deployment

This application can be easily deployed to Firebase Hosting, Vercel, Netlify, or any static hosting provider.

### Firebase Hosting (Recommended)

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize project: `firebase init hosting` (Select your existing project and set public directory to `dist`)
4. Build the app: `npm run build`
5. Deploy: `firebase deploy --only hosting`

## Troubleshooting

### Only specific emails see the "Relatórios" tab
The `Reports.tsx` route and sidebar item are protected. You must add agent emails to the `AGENT_EMAILS` array inside `src/components/Layout.tsx` and `src/components/Dashboard.tsx` to grant them access to the full queue and analytics.

### Google Login Error (Domain mismatch)
Ensure your Firebase Auth Google provider is properly configured, and remember that `firebase.ts` sets `hd: 'grupoep.com.br'`, meaning only accounts from this Google Workspace can log in.
