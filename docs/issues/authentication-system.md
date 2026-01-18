# 🔐 Feature: Authentication & Authorization System

## Status: ✅ IMPLEMENTED

---

## Description
Implement a complete authentication and authorization system for AMEP to secure API endpoints and manage user sessions across the three user roles: **Student**, **Teacher**, and **Admin**.

---

## Acceptance Criteria

### Backend Requirements
- [x] **JWT Authentication**
  - Implement JWT token generation and validation
  - Access token (1 hour expiry, configurable)
  - Refresh token (30 days expiry, configurable)
  - Secure token storage recommendations for frontend

- [x] **User Registration**
  - `POST /api/auth/register` endpoint
  - Email validation
  - Password hashing (bcrypt via passlib)
  - Role assignment (student/teacher/admin)

- [x] **User Login**
  - `POST /api/auth/login` endpoint
  - Return JWT tokens on successful authentication

- [x] **Token Refresh**
  - `POST /api/auth/refresh` endpoint
  - Issue new access token using valid refresh token

- [x] **Logout**
  - `POST /api/auth/logout` endpoint

- [x] **Password Management**
  - `POST /api/auth/change-password` endpoint

- [x] **Role-Based Access Control**
  - `@jwt_required` decorator for protected routes
  - `@role_required(*roles)` decorator for role-based access
  - Protect routes based on role requirements

### Frontend Requirements
- [x] Login page component
- [x] Registration page component
- [x] Auth context/state management
- [x] Protected route wrapper
- [x] Token storage in localStorage
- [x] Auto-refresh on token expiration
- [x] Redirect logic for unauthenticated users

---

## Implementation Summary

### Backend Files Created
| File | Purpose |
|------|---------|
| `backend/utils/auth.py` | JWT helpers, password hashing, decorators |
| `backend/api/auth_routes.py` | All authentication endpoints |

### Frontend Files Created
| File | Purpose |
|------|---------|
| `frontend/src/context/AuthContext.jsx` | Auth state management |
| `frontend/src/components/ProtectedRoute.jsx` | Route protection wrapper |
| `frontend/src/pages/Login.jsx` | Login page |
| `frontend/src/pages/Register.jsx` | Registration page |
| `frontend/src/styles/auth.css` | Auth page styling |

### Files Modified
| File | Changes |
|------|---------|
| `backend/app.py` | Registered auth blueprint |
| `frontend/src/App.jsx` | Added AuthProvider and auth routes |
| `frontend/src/services/api.js` | Added auth interceptors |
| `frontend/src/styles/index.css` | Added nav and error page styles |

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Create new user account | No |
| POST | `/api/auth/login` | Authenticate user | No |
| POST | `/api/auth/refresh` | Refresh access token | Refresh Token |
| POST | `/api/auth/logout` | Logout user | Yes |
| GET | `/api/auth/me` | Get current user info | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |

---

## Usage Examples

### Protecting a Route (Backend)
```python
from utils.auth import jwt_required, role_required

@app.route('/api/protected')
@jwt_required
def protected_route():
    return jsonify({"message": "Authenticated!"})

@app.route('/api/teachers-only')
@role_required('teacher', 'admin')
def teachers_only():
    return jsonify({"message": "Teachers/Admins only!"})
```

### Protecting a Route (Frontend)
```jsx
<Route path="/dashboard" element={
  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
    <Dashboard />
  </ProtectedRoute>
} />
```

---

## Remaining Items (Future Enhancements)
- [ ] Password reset via email (`forgot-password`, `reset-password`)
- [ ] Rate limiting on auth endpoints
- [ ] Token blacklisting for logout
- [ ] 2FA support
- [ ] httpOnly cookie option

---

## Labels
`enhancement` `security` `completed` `backend` `frontend`
