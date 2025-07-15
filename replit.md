# EduPro - Coaching Classes Management System

## Overview

EduPro is a modern coaching classes management system built with React.js and Express.js. It provides a comprehensive solution for managing students, teachers, courses, batches, exams, attendance, fees, and messaging within a coaching institute. The application features a futuristic UI design with glassmorphism effects and a responsive layout.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React.js with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with custom glassmorphism design
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: TanStack React Query for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon database)
- **Validation**: Zod schemas for request validation
- **Development**: Hot module replacement with Vite integration

### Project Structure
The application follows a monorepo structure with clear separation:
- `client/`: Frontend React application
- `server/`: Backend Express API
- `shared/`: Shared schemas and types between frontend and backend
- `migrations/`: Database migration files

## Key Components

### Core Entities
1. **Students**: Student registration, profile management, and enrollment tracking
2. **Teachers**: Teacher profiles, qualifications, and specializations
3. **Courses**: Course catalog with descriptions, duration, and fee structure
4. **Batches**: Class groupings with teacher assignments and capacity management
5. **Exams**: Assessment management with results tracking
6. **Attendance**: Daily attendance tracking with status indicators
7. **Fees**: Fee collection, payment tracking, and billing management
8. **Messages**: Communication system for announcements and notifications

### UI Features
- **Dashboard**: Overview with key metrics and performance analytics
- **Glassmorphism Design**: Modern UI with translucent cards and soft shadows
- **Responsive Layout**: Mobile-first design that works across all devices
- **Component Library**: Reusable UI components built on Radix UI primitives
- **Form Validation**: Client-side validation with immediate feedback
- **Toast Notifications**: User feedback for actions and errors

## Data Flow

### Frontend to Backend Communication
1. API requests are made using the custom `apiRequest` function
2. TanStack React Query manages caching and synchronization
3. Form data is validated using Zod schemas before submission
4. Server responses are typed and handled with proper error management

### Database Operations
1. Drizzle ORM provides type-safe database queries
2. Schema definitions are shared between client and server
3. Database migrations are managed through Drizzle Kit
4. PostgreSQL is used for relational data storage

### State Management
1. Server state is managed by TanStack React Query
2. Form state is handled by React Hook Form
3. UI state (modals, notifications) uses React's built-in state management
4. No global client state management library is used

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React 18 with hooks and modern patterns
- **UI Library**: Radix UI for accessible component primitives
- **Styling**: Tailwind CSS for utility-first styling
- **Form Management**: React Hook Form for efficient form handling
- **Validation**: Zod for runtime type validation
- **HTTP Client**: Fetch API with custom wrapper functions

### Backend Dependencies
- **Express.js**: Web framework for REST API
- **Drizzle ORM**: Type-safe database operations
- **Neon Database**: PostgreSQL as a service
- **Zod**: Schema validation for API endpoints
- **TypeScript**: Static typing for both frontend and backend

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Production bundling for backend
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

### Development Environment
- Frontend development server runs on Vite with HMR
- Backend runs with tsx for TypeScript execution
- Database connections use environment variables
- Hot reload is enabled for both client and server code

### Production Build Process
1. Frontend is built using Vite and outputs to `dist/public`
2. Backend is bundled using ESBuild with external packages
3. Both builds are optimized for production deployment
4. Static assets are served by the Express server

### Environment Configuration
- Database URL is configured through environment variables
- Development and production modes are handled differently
- Replit-specific integrations are included for platform deployment
- CORS and security headers are configured for production

### Database Management
- Drizzle migrations are used for schema changes
- Database schema is version controlled
- Connection pooling is handled by the database driver
- Backup and recovery strategies depend on the hosting provider

The application is designed to be easily deployable on platforms like Replit, Vercel, or traditional VPS hosting with minimal configuration changes.