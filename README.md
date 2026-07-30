# Marketing Dashboard API

> Backend service for the ClearTax B2B Marketing Dashboard

---

## Overview

The Marketing Dashboard API is a backend application built using Node.js, Express, TypeScript, Prisma, and PostgreSQL.

The application provides REST APIs for the ClearTax B2B Marketing Team to manage campaigns, calendars, marketing copies, dashboard announcements, reports, and integrations with external marketing platforms.

The frontend is hosted on Webflow and communicates with this backend through REST APIs.

---

# Objectives

The system enables the marketing team to

- Manage marketing campaigns
- Maintain campaign calendars
- Create and update dashboard announcements
- Manage marketing copies
- View campaign performance
- Generate reports
- Synchronize campaign data from Salesforce
- Synchronize marketing metrics from HubSpot
- Support future integrations like Google Analytics, Mailchimp and LinkedIn

---

# Tech Stack

Backend

- Node.js
- Express.js
- TypeScript

Database

- PostgreSQL

ORM

- Prisma

Authentication

- JWT

Validation

- Zod

Logging

- Morgan

Security

- Helmet
- CORS

API Documentation

- Swagger

---

# Architecture

```
Webflow Frontend
        │
        ▼
REST API
        │
        ▼
Express Backend
        │
        ▼
Business Services
        │
        ▼
Repositories
        │
        ▼
Prisma ORM
        │
        ▼
PostgreSQL
        │
        ▼
External Integrations
   ├── Salesforce
   ├── HubSpot
   ├── Google Analytics (Future)
   ├── Mailchimp (Future)
   └── LinkedIn (Future)
```

---

# Project Structure

```
src/

│

├── config/

├── constants/

├── controllers/

├── middleware/

├── repositories/

├── routes/

├── services/

├── validators/

├── integrations/

│      ├── salesforce/

│      └── hubspot/

├── jobs/

├── prisma/

├── utils/

├── types/

├── app.ts

└── server.ts
```

---

# User Roles

## Admin

Permissions

- Login
- Manage Users
- Manage Campaigns
- Manage Dashboard Messages
- Manage Calendar
- Manage Marketing Copies
- View Reports
- Trigger Integrations
- View Dashboard

---

## Viewer

Permissions

- Login
- View Dashboard
- View Campaigns
- View Calendar
- View Reports

No create/update/delete permissions.

---

# Core Modules

Authentication

Users

Dashboard

Dashboard Messages

Workspaces

Campaigns

Campaign Stages

Countries

Calendar

Marketing Copies

Performance

Reports

Comments

Attachments

Audit Logs

Salesforce Integration

HubSpot Integration

---

# Database Modules

User

Workspace

Campaign

Country

Stage

Calendar

DashboardMessage

Performance

Copy

Comment

Attachment

AuditLog

---

# Campaign Workflow

```
Login

↓

Create Workspace

↓

Create Campaign

↓

Assign Country

↓

Assign Stage

↓

Add Calendar Schedule

↓

Create Marketing Copy

↓

Campaign Goes Live

↓

Performance Imported

↓

Dashboard Updated

↓

Generate Reports
```

---

# API Modules

## Authentication

POST /api/auth/login

POST /api/auth/logout

GET /api/auth/me

---

## Users

GET /api/users

GET /api/users/:id

POST /api/users

PUT /api/users/:id

DELETE /api/users/:id

---

## Dashboard

GET /api/dashboard

---

## Dashboard Messages

GET /api/dashboard/messages

GET /api/dashboard/messages/:id

POST /api/dashboard/messages

PUT /api/dashboard/messages/:id

PATCH /api/dashboard/messages/:id/status

DELETE /api/dashboard/messages/:id

---

## Campaigns

GET /api/campaigns

GET /api/campaigns/:id

POST /api/campaigns

PUT /api/campaigns/:id

DELETE /api/campaigns/:id

---

## Calendar

GET /api/calendar

POST /api/calendar

PUT /api/calendar/:id

DELETE /api/calendar/:id

---

## Copies

GET /api/copies

POST /api/copies

PUT /api/copies/:id

DELETE /api/copies/:id

---

## Performance

GET /api/performance

GET /api/performance/:campaignId

POST /api/performance

PUT /api/performance/:id

---

## Reports

GET /api/reports

GET /api/reports/export

---

## Integrations

POST /api/integrations/salesforce/sync

GET /api/integrations/salesforce/status

POST /api/integrations/hubspot/sync

GET /api/integrations/hubspot/status

---

# API Response Format

Success

```json
{
    "success": true,
    "message": "Success",
    "data": {}
}
```

Failure

```json
{
    "success": false,
    "message": "Validation Failed",
    "errors": []
}
```

---

# Authentication Flow

```
User Login

↓

JWT Token Generated

↓

Frontend Stores Token

↓

Authorization Header

↓

Protected API

↓

JWT Validation
```

---

# Validation

All incoming requests are validated using Zod.

Validation occurs before controllers are executed.

---

# Error Handling

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

500 Internal Server Error

---

# Integrations

## Salesforce

Purpose

- Campaigns
- Leads
- Contacts
- Opportunities

Synchronization

Scheduled background jobs.

---

## HubSpot

Purpose

- Email Metrics
- Landing Pages
- Forms
- Marketing Performance

Synchronization

Scheduled background jobs.

---

# Security

JWT Authentication

Password Hashing

Role Based Access

Rate Limiting

Input Validation

Helmet

CORS

---

# Future Integrations

Google Analytics

Mailchimp

LinkedIn

Microsoft Teams

Slack

---

# Environment Variables

```
PORT=5000

DATABASE_URL=

JWT_SECRET=

SALESFORCE_CLIENT_ID=

SALESFORCE_CLIENT_SECRET=

HUBSPOT_ACCESS_TOKEN=
```

---

# Development Roadmap

## Phase 1

- Project Setup
- Authentication
- Dashboard Messages CRUD
- Campaign CRUD
- Calendar CRUD
- Copies CRUD
- Mock APIs
- Webflow Integration

---

## Phase 2

- PostgreSQL Integration
- Prisma Repository Layer
- Reports
- Dashboard Analytics

---

## Phase 3

- Salesforce Integration
- HubSpot Integration
- Scheduled Synchronization
- Background Jobs

---

## Phase 4

- Notifications
- AI Generated Reports
- AI Campaign Assistant
- Advanced Analytics

---

# Coding Guidelines

- Follow Repository Pattern
- Business logic belongs in Services
- Controllers should remain thin
- Validate all requests
- Use async/await
- Keep consistent API response format
- Document endpoints with Swagger
- Write reusable services

---

# License

Internal Project

ClearTax B2B Marketing Team

Confidential