# Role-Based Permissions Summary

## Overview
The platform implements comprehensive role-based access control (RBAC) with 7 distinct roles. This document outlines what each role can and cannot do.

---

## Role Hierarchy (from highest to lowest)
1. **SUPER_ADMIN** - Firm creator/owner
2. **SENIOR_PARTNER** - Senior leadership
3. **PARTNER** - Partners
4. **ASSOCIATE** - Associate lawyers
5. **PARALEGAL** - Legal assistants
6. **SECRETARY** - Administrative staff
7. **CLIENT** - External clients

---

## Permission Matrix

### SUPER_ADMIN
**Full access to everything:**
- ✅ Create/edit/delete cases
- ✅ Assign/unassign lawyers to cases
- ✅ Create/edit/delete branches
- ✅ Manage users (create, edit, delete)
- ✅ Upload/delete documents
- ✅ Create/edit/delete deadlines
- ✅ Create/edit/delete hearings
- ✅ Access all analytics
- ✅ View all firm data across branches

### SENIOR_PARTNER
**Almost full access:**
- ✅ Create/edit cases (❌ cannot delete)
- ✅ Assign/unassign lawyers to cases
- ✅ Create/edit/delete branches
- ✅ Upload documents (❌ cannot delete)
- ✅ Create/edit deadlines (❌ cannot delete)
- ✅ Create/edit hearings (❌ cannot delete)
- ✅ Access all analytics
- ✅ View firm-wide data

### PARTNER
**Management-level access:**
- ✅ Create/edit cases (❌ cannot delete)
- ✅ Assign/unassign lawyers to cases
- ✅ Create/edit branches (❌ cannot delete)
- ✅ Upload documents (❌ cannot delete)
- ✅ Create/edit deadlines (❌ cannot delete)
- ✅ Create/edit hearings (❌ cannot delete)
- ✅ Access analytics
- ✅ View assigned cases

### ASSOCIATE (Current Focus)
**Working lawyer access - LIMITED:**
- ✅ Create/edit cases (❌ cannot delete)
- ❌ **Cannot assign/unassign lawyers** (FIXED in this update)
- ❌ Cannot create/edit/delete branches
- ✅ Upload documents (❌ cannot delete)
- ✅ Create/edit deadlines (❌ cannot delete)
- ✅ Create/edit hearings (❌ cannot delete)
- ✅ Update document status
- ✅ View analytics
- ✅ View assigned cases only

**What Associates CANNOT do:**
- ❌ Delete any records (cases, documents, deadlines, hearings)
- ❌ Assign or remove lawyers from cases
- ❌ Manage branches
- ❌ Manage users or change roles
- ❌ Access firm-wide settings

### PARALEGAL
**Support staff access:**
- ❌ Cannot create/edit/delete cases
- ❌ Cannot assign lawyers
- ❌ Cannot manage branches
- ✅ Can view documents
- ✅ Can view deadlines and hearings
- ✅ Limited analytics access
- ✅ Can assist with administrative tasks

### SECRETARY
**Administrative access:**
- ❌ Cannot create/edit/delete cases
- ❌ Cannot assign lawyers
- ❌ Cannot manage branches
- ✅ Upload documents (❌ cannot delete)
- ✅ Upload new document versions
- ✅ View case information
- ✅ Manage scheduling (deadlines/hearings - view only)

### CLIENT
**External limited access:**
- ❌ Cannot create/edit/delete cases
- ❌ Cannot manage anything
- ✅ View their own cases only
- ✅ View documents related to their cases
- ✅ View hearings/deadlines for their cases
- ✅ Upload documents to their cases

---

## Recent Security Fixes

### Issue #1: Search Input Losing Focus ✅ FIXED
**Problem:** Search input on cases page lost focus after every keystroke.
**Root Cause:** Every keystroke triggered immediate query refetch, causing component re-render.
**Solution:** Added 500ms debouncing with `useEffect` and separate `debouncedSearch` state.
**Files Modified:** `frontend/src/components/CaseList.tsx`

### Issue #2: Associate Can Assign Lawyers ✅ FIXED
**Problem:** Associates could assign/unassign lawyers, which is a management function.
**Root Cause:** No role check in the UI component.
**Solution:** 
- Added `canManageLawyers` check: only SUPER_ADMIN, SENIOR_PARTNER, PARTNER
- Hide "Assign Lawyer" button for Associates
- Hide unassign (X) button for Associates
- Backend already had proper authorization checks

**Files Modified:** `frontend/src/components/AssignedLawyers.tsx`

---

## Backend Authorization Summary

### Cases (`backend/src/routes/case.routes.ts`)
```typescript
POST /cases - SUPER_ADMIN, SENIOR_PARTNER, PARTNER, ASSOCIATE
PUT /cases/:id - SUPER_ADMIN, SENIOR_PARTNER, PARTNER, ASSOCIATE
DELETE /cases/:id - SUPER_ADMIN, SENIOR_PARTNER only
POST /cases/:id/assign-lawyer - SUPER_ADMIN, SENIOR_PARTNER, PARTNER
DELETE /cases/:id/assign-lawyer/:lawyerId - SUPER_ADMIN, SENIOR_PARTNER, PARTNER
```

### Branches (`backend/src/routes/branch.routes.ts`)
```typescript
POST /branches - SUPER_ADMIN, SENIOR_PARTNER, PARTNER
PUT /branches/:id - SUPER_ADMIN, SENIOR_PARTNER, PARTNER
DELETE /branches/:id - SUPER_ADMIN, SENIOR_PARTNER only
```

### Documents (`backend/src/routes/document.routes.ts`)
```typescript
POST /documents/upload - SUPER_ADMIN, SENIOR_PARTNER, PARTNER, ASSOCIATE, SECRETARY
PATCH /documents/:id/status - SUPER_ADMIN, SENIOR_PARTNER, PARTNER, ASSOCIATE
POST /documents/:id/version - SUPER_ADMIN, SENIOR_PARTNER, PARTNER, ASSOCIATE, SECRETARY
DELETE /documents/:id - SUPER_ADMIN, SENIOR_PARTNER only
```

### Deadlines (`backend/src/routes/deadline.routes.ts`)
```typescript
POST /deadlines - SUPER_ADMIN, SENIOR_PARTNER, PARTNER, ASSOCIATE
PUT /deadlines/:id - SUPER_ADMIN, SENIOR_PARTNER, PARTNER, ASSOCIATE
PATCH /deadlines/:id/complete - SUPER_ADMIN, SENIOR_PARTNER, PARTNER, ASSOCIATE
DELETE /deadlines/:id - SUPER_ADMIN, SENIOR_PARTNER only
```

### Hearings (`backend/src/routes/hearing.routes.ts`)
```typescript
POST /hearings - SUPER_ADMIN, SENIOR_PARTNER, PARTNER, ASSOCIATE
PUT /hearings/:id - SUPER_ADMIN, SENIOR_PARTNER, PARTNER, ASSOCIATE
DELETE /hearings/:id - SUPER_ADMIN, SENIOR_PARTNER only
```

---

## Security Best Practices Implemented

1. **Defense in Depth:** Both frontend UI restrictions AND backend authorization checks
2. **Principle of Least Privilege:** Each role has only necessary permissions
3. **Clear Hierarchy:** Higher roles inherit lower role permissions plus additional ones
4. **Separation of Duties:** Delete operations restricted to senior management
5. **Data Isolation:** Firm-level and branch-level data segregation

---

## Testing Recommendations

### For Associates, verify they CANNOT:
1. See "Assign Lawyer" button in case details
2. See unassign (X) buttons next to assigned lawyers
3. Delete cases via API (should get 403 Forbidden)
4. Delete documents via API (should get 403 Forbidden)
5. Delete deadlines via API (should get 403 Forbidden)
6. Delete hearings via API (should get 403 Forbidden)
7. Create or modify branches via API (should get 403 Forbidden)

### For Associates, verify they CAN:
1. Create new cases
2. Edit case details (title, description, status, priority)
3. Upload documents to cases
4. Create deadlines and mark them complete
5. Create and edit hearing details
6. View analytics dashboard
7. View all cases they are assigned to

---

## Future Enhancements

Consider adding:
1. **Field-level permissions:** Restrict editing specific case fields by role
2. **Time-based permissions:** Temporary elevated access for specific tasks
3. **Audit logging:** Track all permission-based actions for compliance
4. **Custom roles:** Allow firms to define their own roles and permissions
5. **Delegation:** Allow temporary permission delegation to junior staff
