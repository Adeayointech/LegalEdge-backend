# User Management System

## Overview
A comprehensive user approval and role management system for the law firm platform. Admins can now approve new signups, assign roles, and deactivate users.

---

## Key Features

### 1. **User Approval Workflow** ✅
- New signups require admin approval before they can log in
- First user (firm creator) is auto-approved as SUPER_ADMIN
- All subsequent signups are pending approval by default

### 2. **User Deactivation** ✅
- Admins can deactivate users (prevents login)
- Fired employees cannot log back in
- Deactivated users can be reactivated by admins

### 3. **Role Assignment** ✅
- Admins can assign proper roles to users
- No more auto-ASSOCIATE for everyone
- Supports: Partner, Secretary, Paralegal, etc.

### 4. **User States**
A user has two boolean flags:
- `isApproved`: Must be approved by admin to log in
- `isActive`: Can be deactivated by admin to revoke access

**Login Requirements:** User must be BOTH `isApproved=true` AND `isActive=true`

---

## User Registration Flow

### Before (Old System):
```
User signs up with firm code → Auto-ASSOCIATE → Can log in immediately
```

**Problems:**
- ❌ No approval required
- ❌ Everyone becomes ASSOCIATE
- ❌ No way to prevent fired employees from logging back in

### After (New System):
```
User signs up with firm code 
  ↓
Pending approval (isApproved=false, role=ASSOCIATE)
  ↓
Admin reviews in "User Management" page
  ↓
Admin approves + assigns proper role
  ↓
User can now log in
```

**Benefits:**
- ✅ Admin controls who can access the system
- ✅ Proper role assignment (Partner, Secretary, etc.)
- ✅ Deactivation prevents fired employees from logging in

---

## Login Process

### Login Checks (in order):
1. **User exists?** → If no, return "Invalid credentials"
2. **Is approved?** → If no, return "Pending admin approval"
3. **Is active?** → If no, return "Account deactivated"
4. **Password correct?** → If no, return "Invalid credentials"
5. **2FA required?** → Verify token if enabled
6. **Success** → Generate JWT and log in

### Error Messages:
- **Not approved:** "Your account is pending admin approval. Please contact your firm administrator."
- **Deactivated:** "Your account has been deactivated. Please contact your firm administrator."

---

## User Management UI

### Dashboard Path: `/users`

### Sections:

#### 1. **Statistics Cards**
- Total Users
- Pending Approval (orange badge)
- Active Users (green)
- Deactivated Users (red)

#### 2. **Pending Approvals** (Orange section at top)
Shows users waiting for approval with:
- Name, email, signup date
- **Approve** button (green) - Approves user with current role (ASSOCIATE)
- **Reject** button (red) - Permanently deletes pending user

#### 3. **Active Users Table**
Shows all approved and active users:
- User info (name, email)
- Role badge (color-coded)
- Branch assignment
- Last login date
- Actions:
  - **Shield icon** - Change role (opens modal)
  - **UserMinus icon** - Deactivate user

#### 4. **Deactivated Users** (Red section)
Shows deactivated users with:
- **Reactivate** button (green) - Restores access

---

## Backend API Endpoints

### Get All Users (with approval status)
```http
GET /api/users/management/all
Authorization: Bearer <token>
Roles: SUPER_ADMIN, SENIOR_PARTNER, PARTNER
```

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ASSOCIATE",
      "isActive": true,
      "isApproved": false,
      "branch": { "id": "uuid", "name": "Main Office" },
      "createdAt": "2026-02-04T...",
      "lastLoginAt": null
    }
  ]
}
```

### Approve User
```http
POST /api/users/:userId/approve
Authorization: Bearer <token>
Roles: SUPER_ADMIN, SENIOR_PARTNER, PARTNER
```

**Response:**
```json
{
  "user": { ... },
  "message": "User approved successfully"
}
```

### Reject User (Delete)
```http
DELETE /api/users/:userId/reject
Authorization: Bearer <token>
Roles: SUPER_ADMIN, SENIOR_PARTNER, PARTNER
```

**Response:**
```json
{
  "message": "User rejected successfully"
}
```

### Deactivate User
```http
PATCH /api/users/:userId/deactivate
Authorization: Bearer <token>
Roles: SUPER_ADMIN, SENIOR_PARTNER
```

**Response:**
```json
{
  "user": { "id": "...", "isActive": false, ... },
  "message": "User deactivated successfully"
}
```

### Reactivate User
```http
PATCH /api/users/:userId/reactivate
Authorization: Bearer <token>
Roles: SUPER_ADMIN, SENIOR_PARTNER
```

### Update User Role
```http
PATCH /api/users/:userId/role
Authorization: Bearer <token>
Roles: SUPER_ADMIN, SENIOR_PARTNER

Body:
{
  "role": "PARTNER"
}
```

**Allowed roles:**
- SENIOR_PARTNER
- PARTNER
- ASSOCIATE
- PARALEGAL
- SECRETARY
- CLIENT

**Not allowed:** SUPER_ADMIN (only one per firm)

---

## Role Assignment Workflow

### Scenario: New Partner Joins Firm

1. **Partner signs up:**
   ```
   Email: partner@lawfirm.com
   Name: Jane Smith
   Firm Code: ABCD-1234
   ```

2. **System creates:**
   ```
   User {
     role: ASSOCIATE (temporary)
     isApproved: false
     isActive: true
   }
   ```

3. **Admin logs in, goes to /users**
   - Sees Jane in "Pending Approvals" section
   - Clicks **Approve**
   - Jane's account is now approved

4. **Admin changes role:**
   - Clicks **Shield icon** next to Jane
   - Selects "Partner" from dropdown
   - Clicks "Update Role"

5. **Jane can now log in:**
   - Has full Partner permissions
   - Can assign lawyers to cases
   - Can manage branches

---

## Permission Matrix for User Management

| Action | SUPER_ADMIN | SENIOR_PARTNER | PARTNER | ASSOCIATE |
|--------|-------------|----------------|---------|-----------|
| View pending users | ✅ | ✅ | ✅ | ❌ |
| Approve/reject users | ✅ | ✅ | ✅ | ❌ |
| Deactivate users | ✅ | ✅ | ❌ | ❌ |
| Reactivate users | ✅ | ✅ | ❌ | ❌ |
| Change user roles | ✅ | ✅ | ❌ | ❌ |
| Deactivate SUPER_ADMIN | ❌ | ❌ | ❌ | ❌ |
| Change own role | ❌ | ❌ | ❌ | ❌ |
| Deactivate self | ❌ | ❌ | ❌ | ❌ |

---

## Security Validations

### Backend Safeguards:

1. **Cannot deactivate yourself**
   ```typescript
   if (userToDeactivate.id === req.user.userId) {
     return res.status(403).json({ error: 'Cannot deactivate yourself' });
   }
   ```

2. **Cannot deactivate SUPER_ADMIN**
   ```typescript
   if (userToDeactivate.role === UserRole.SUPER_ADMIN) {
     return res.status(403).json({ error: 'Cannot deactivate super admin' });
   }
   ```

3. **Cannot change own role**
   ```typescript
   if (userToUpdate.id === req.user.userId) {
     return res.status(403).json({ error: 'Cannot change your own role' });
   }
   ```

4. **Cannot create multiple SUPER_ADMINs**
   ```typescript
   if (role === UserRole.SUPER_ADMIN) {
     return res.status(403).json({ 
       error: 'Cannot assign SUPER_ADMIN role. Only one super admin per firm.' 
     });
   }
   ```

5. **Firm isolation**
   ```typescript
   if (userToManage.firmId !== req.user.firmId) {
     return res.status(403).json({ error: 'Cannot manage users from other firms' });
   }
   ```

6. **Cannot reject approved users**
   ```typescript
   if (userToReject.isApproved) {
     return res.status(400).json({ 
       error: 'Cannot reject approved user. Use deactivate instead.' 
     });
   }
   ```

---

## Database Schema Changes

### Added Field:
```prisma
model User {
  // ... existing fields
  isActive   Boolean @default(true)
  isApproved Boolean @default(false)  // NEW FIELD
  // ... rest of fields
}
```

### Migration:
```sql
ALTER TABLE "users" ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT false;
```

### Existing Users:
All existing users were automatically set to `isApproved=true` to maintain access.

---

## Testing Checklist

### Test Scenarios:

#### 1. New User Signup
- [ ] Sign up with firm code
- [ ] Verify user is created with `isApproved=false`
- [ ] Try to log in → Should get "Pending admin approval" error
- [ ] Admin approves user
- [ ] Try to log in again → Should succeed

#### 2. User Deactivation
- [ ] Admin deactivates a user
- [ ] Deactivated user tries to log in → Should get "Account deactivated" error
- [ ] Admin reactivates user
- [ ] User can log in again

#### 3. Role Assignment
- [ ] Admin approves new user (default ASSOCIATE)
- [ ] Admin changes role to PARTNER
- [ ] User logs in and has Partner permissions
- [ ] Verify user can assign lawyers (Partner feature)

#### 4. Security Tests
- [ ] Try to deactivate SUPER_ADMIN → Should fail
- [ ] Try to deactivate yourself → Should fail
- [ ] Try to change your own role → Should fail
- [ ] Try to create second SUPER_ADMIN → Should fail
- [ ] Try to approve user from different firm → Should fail

#### 5. UI/UX Tests
- [ ] Pending users show in orange section
- [ ] Stats cards show correct counts
- [ ] Role modal displays available roles
- [ ] Actions show only for permitted roles
- [ ] Deactivated users show in red section

---

## Common Admin Workflows

### Workflow 1: Approve New Employee
```
1. Go to /users
2. See pending user in orange section
3. Click "Approve"
4. Click shield icon to change role
5. Select appropriate role (Partner, Secretary, etc.)
6. Click "Update Role"
7. Done - user can log in with correct permissions
```

### Workflow 2: Fire an Employee
```
1. Go to /users
2. Find user in Active Users table
3. Click UserMinus (deactivate) icon
4. Confirm deactivation
5. Done - user cannot log in anymore
```

### Workflow 3: Rehire Former Employee
```
1. Go to /users
2. Scroll to Deactivated Users section
3. Find user
4. Click "Reactivate"
5. Confirm reactivation
6. Done - user can log in again
```

### Workflow 4: Reject Bad Signup
```
1. Go to /users
2. See suspicious user in Pending Approvals
3. Click "Reject"
4. Confirm rejection
5. Done - user is permanently deleted
```

---

## Audit Trail

All user management actions are logged:

```typescript
await createAuditLog(
  'UPDATE',
  'User',
  userId,
  req.user.userId,
  `User approved by ${req.user.email}`,
  undefined,
  req
);
```

**Logged actions:**
- User approved
- User rejected
- User deactivated
- User reactivated
- User role changed (with before/after values)

View in `/audit-logs` page.

---

## Summary

### Problem Solved:
- ✅ No more unauthorized access by fired employees
- ✅ Proper role assignment (Partners, Secretaries, etc.)
- ✅ Admin control over who can access the system
- ✅ Two-step user onboarding (approve → assign role)

### User Journey:
```
Sign Up → Pending → Admin Approves → Admin Assigns Role → User Logs In
```

### For Admins:
- Simple UI with pending approvals highlighted
- Quick approve/reject workflow
- Easy role management with dropdown
- Deactivate/reactivate with one click

### For Users:
- Clear error messages when pending or deactivated
- Know exactly who to contact (firm administrator)
- Seamless login once approved
