# NSGC NEXUS Command

Welcome to **NSGC NEXUS Command**, the official Space-Grade Terminal and Command Center for the NxtWave Student General Council (NSGC). This portal serves as the definitive platform for managing council operations, student clubs, events, announcements, and more across the campus.

## Overview

NSGC NEXUS is built with a sleek, futuristic "cyber-solar" aesthetic featuring glassmorphism, dynamic 3D elements, and a terminal-style interface. 

The application provides specialized dashboards and tools for:
- **President & Executive Admin:** Global overview, user oversight, and broad control.
- **Council Members:** Management of incoming complaints, feedback, and initiatives.
- **Club Heads:** Granular management of club resources, members, and custom events.
- **Students:** Real-time access to announcements, event registrations, club applications, and the suggestion box.

## Tech Stack

- **Framework:** [Next.js 15+ (App Router)](https://nextjs.org/)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Framer Motion (for fluid animations and transitions)
- **Backend/BaaS:** [Nhost](https://nhost.io/) (PostgreSQL, GraphQL via Hasura, Auth, and Storage)
- **Database Interaction:** `@apollo/client` and `@nhost/react-apollo` for real-time GraphQL subscriptions and mutations.
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (Radix Primitives + Tailwind)

## Features

- **Role-Based Access Control (RBAC):** Secure access to dedicated dashboards (Admin, President, Council, Club Head, Student) managed transparently via Nhost and Hasura.
- **Real-Time Data:** Instant updates using GraphQL subscriptions for announcements, complaints, and event RSVPs using the Apollo Client.
- **Dynamic Mobile Layout:** Fully responsive layout with an intuitive bottom navigation bar and clean top headers specifically designed for smooth mobile interaction.
- **Interactive Global Environment:** Features an interactive 3D solar system built into the background.

## Getting Started

### Prerequisites

You will need an active Nhost backend project to run this locally.

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables:
   ```bash
   cp .env.example .env.local
   ```
   *Note: Fill in your Nhost Subdomain and Region in the `.env.local` file.*

4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Contributing

Designed and developed by **V_Mach**. Contributions to improving the portal's aesthetic, adding advanced terminal commands, or optimizing the GraphQL queries are welcome.


