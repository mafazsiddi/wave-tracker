# ClearTax Marketing Dashboard API Documentation

> Base URL: `http://localhost:5000/api`

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message description",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation Failed / Error message",
  "errors": [
    {
      "field": "body.email",
      "message": "Invalid email address"
    }
  ]
}
```

---

## Endpoints Summary

### 🔑 Authentication
- `POST /api/auth/login`
  - Body: `{ "email": "admin@cleartax.in", "password": "anypassword" }`
- `POST /api/auth/logout`
- `GET /api/auth/me`
  - Header: `Authorization: Bearer <token>`

### 👥 User Management
- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users` (Admin only)
- `PUT /api/users/:id` (Admin only)
- `DELETE /api/users/:id` (Admin only)

### 📊 Dashboard Summary
- `GET /api/dashboard`
  - Header: `Authorization: Bearer <token>`

### 📢 Dashboard Messages & Announcements
- `GET /api/dashboard/messages`
- `GET /api/dashboard/messages/:id`
- `POST /api/dashboard/messages` (Admin only)
- `PUT /api/dashboard/messages/:id` (Admin only)
- `PATCH /api/dashboard/messages/:id/status` (Admin only)
- `DELETE /api/dashboard/messages/:id` (Admin only)

### 🚀 Campaigns
- `GET /api/campaigns`
- `GET /api/campaigns/:id`
- `POST /api/campaigns` (Admin only)
- `PUT /api/campaigns/:id` (Admin only)
- `DELETE /api/campaigns/:id` (Admin only)

### 📅 Calendar
- `GET /api/calendar`
- `POST /api/calendar` (Admin only)
- `PUT /api/calendar/:id` (Admin only)
- `DELETE /api/calendar/:id` (Admin only)

### 📝 Marketing Copies
- `GET /api/copies`
- `POST /api/copies` (Admin only)
- `PUT /api/copies/:id` (Admin only)
- `DELETE /api/copies/:id` (Admin only)

### 📈 Performance & Analytics
- `GET /api/performance`
- `GET /api/performance/:campaignId`
- `POST /api/performance` (Admin only)
- `PUT /api/performance/:id` (Admin only)

### 📑 Reports & Export
- `GET /api/reports`
- `GET /api/reports/export?format=csv`

### 🔄 Integrations
- `POST /api/integrations/salesforce/sync` (Admin only)
- `GET /api/integrations/salesforce/status`
- `POST /api/integrations/hubspot/sync` (Admin only)
- `GET /api/integrations/hubspot/status`
