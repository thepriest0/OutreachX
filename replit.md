# OutreachX - AI-Powered Lead & Outreach Dashboard

## Overview

OutreachX is a comprehensive web application designed for design studios to manage leads and automate cold outreach campaigns using AI-powered email generation. The application provides a complete solution for lead management, email campaign automation, analytics tracking, and AI-driven insights to help design studios scale their business development efforts.

The system integrates Google's Gemini AI for intelligent email generation, supports bulk lead import/export via CSV, provides detailed analytics and reporting, and includes role-based authentication with team collaboration features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: TailwindCSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Custom OpenID Connect implementation with Replit Auth
- **Session Management**: Express sessions with PostgreSQL session store
- **File Processing**: Multer for handling CSV uploads and file operations

### Database Design
- **Primary Database**: PostgreSQL with connection pooling via Neon serverless
- **Schema Management**: Drizzle migrations with schema-first approach
- **Key Tables**:
  - Users with role-based access (founder, strategist, designer)
  - Leads with status tracking and contact information
  - Email campaigns with delivery status and response tracking
  - AI-generated insights for performance optimization
  - Session storage for authentication persistence

### AI Integration
- **Provider**: Google Gemini AI (Generative AI SDK)
- **Capabilities**: 
  - Cold email generation with customizable tone (professional, casual, direct)
  - Follow-up email sequences with context awareness
  - Business insights generation based on lead and campaign data
- **Implementation**: Structured JSON responses with schema validation for reliable AI output

### Authentication & Security
- **Authentication Method**: OpenID Connect with Replit identity provider
- **Session Management**: Secure HTTP-only cookies with PostgreSQL session storage
- **Authorization**: Role-based access control with middleware protection
- **Security Headers**: CSRF protection, secure cookie settings, and request validation

### File Processing & Data Management
- **CSV Operations**: Parse, validate, and bulk import leads with error handling
- **Template Generation**: Dynamic CSV template creation for standardized imports
- **Data Validation**: Zod schemas for runtime type checking and data integrity
- **Export Functionality**: Filtered lead data export with CSV formatting

### API Architecture
- **Pattern**: RESTful API design with consistent error handling
- **Middleware**: Request logging, authentication validation, and error handling
- **Response Format**: Standardized JSON responses with proper HTTP status codes
- **File Upload**: Multipart form handling for CSV file processing

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL serverless database with connection pooling
- **AI Service**: Google Gemini AI API for email generation and insights
- **Authentication**: Replit OpenID Connect provider for user authentication
- **Session Storage**: PostgreSQL-based session persistence

### Development & Build Tools
- **Build System**: Vite with React plugin for fast development and optimized builds
- **Type Checking**: TypeScript compiler with strict mode enabled
- **Code Quality**: ESLint and TypeScript for code validation
- **Development Server**: Express with Vite middleware for HMR support

### Email Integration (Planned)
- **Email APIs**: Gmail/Outlook API integration for direct email sending
- **SMTP Support**: Alternative SMTP configuration for email delivery
- **OAuth Flow**: Secure email account connection with proper token management

### Monitoring & Analytics
- **Error Tracking**: Built-in error handling with structured logging
- **Performance Monitoring**: Request timing and response logging
- **Development Tools**: Replit-specific development banner and cartographer integration