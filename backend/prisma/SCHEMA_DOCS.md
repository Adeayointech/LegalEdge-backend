# Law Firm Platform - Database Schema Documentation

## Overview
This database schema implements a comprehensive case management system for law firms with the following key features:
- Case-centric architecture
- Multi-branch firm support
- Document management with version control
- Role-based access control
- Complete audit trail
- Deadline and hearing management

## Entity Relationship Diagram (Conceptual)

```
Firm (1) ─── (N) Branch
  │                │
  │                │
  ├─(N) User       └─(N) Case
  │       │              │
  │       └─(N) CaseLawyer (N)
  │                      │
  ├─(N) Client ─── (N) Case
  │                      │
  └─────────────────────(1)
                         │
                    ┌────┴────┬──────────┬───────────┐
                    │         │          │           │
               Document   Deadline   Hearing    AuditLog
                    │
                    └─(N) DocumentVersion
```

## Core Entities

### 1. User Management
- **User**: Lawyers, staff, clients with role-based permissions
  - Roles: SUPER_ADMIN, SENIOR_PARTNER, PARTNER, ASSOCIATE, SECRETARY, INTERN, CLIENT
  - 2FA support
  - Login tracking (IP, timestamp)

### 2. Organizational Structure
- **Firm**: Top-level organization
- **Branch**: Multiple office locations with HQ designation
- **Client**: Individual or corporate clients

### 3. Case Management (Core)
- **Case**: Central entity with:
  - Case details (title, suit number, court info)
  - Status tracking (PRE_TRIAL, ONGOING, JUDGMENT, APPEAL, CLOSED)
  - Party information (plaintiff, defendant, opposing counsel)
  - Type classification (CIVIL, CRIMINAL, CORPORATE, etc.)
- **CaseLawyer**: Many-to-many relationship for lawyer assignments

### 4. Document Management
- **Document**: 
  - 18 document types (Motion, Affidavit, Exhibit, Judgment, etc.)
  - Status: DRAFT, READY, FILED, SERVED
  - Filing tracking (date, filed by, proof of filing)
  - Court stamp verification
  - Version control support
- **DocumentVersion**: Complete version history

### 5. Deadline & Hearing Management
- **Deadline**: 
  - Multiple types (filing, response, hearing, judgment)
  - Auto-reminder system
  - Status tracking
- **Hearing**: Court appearance tracking with outcomes

### 6. Audit Trail
- **AuditLog**: Complete activity log
  - All CRUD operations
  - File access tracking (upload, download, view)
  - User actions with IP and timestamp
  - Metadata for change tracking

## Key Features Implemented

### Case-Centric Design
Everything revolves around cases, not folders:
```
Firm → Branch → Lawyer → Client → Case → Document → Version
```

### Role-Based Access Control
| Role | Permissions |
|------|-------------|
| Senior Partner | Full access, can delete |
| Associate | Upload, edit, comment |
| Secretary | Upload, schedule, view |
| Intern | View-only (limited cases) |
| Client | View selected documents only |

### Filed/Unfiled Tracking
- Document status workflow
- Proof of filing upload
- Court stamp verification
- Filing date tracking

### Version Control
- Automatic versioning on document edits
- Version history with change descriptions
- Ability to view/restore previous versions

### Multi-Branch Support
- Branch-based case separation
- Central oversight from HQ
- Branch-specific user assignments

### Audit Trail
Every action logged:
- Who (user)
- What (action)
- When (timestamp)
- Where (IP address)
- Context (metadata)

## Indexes
Optimized for common queries:
- Case searches by suit number, status, client
- Document searches by type, status, case
- User lookups by email, firm, branch
- Audit log queries by entity and date

## Security Features
- Password hashing (via bcrypt in application)
- 2FA support with secret storage
- IP tracking for login monitoring
- Soft deletion support via isActive flags
- Cascade deletion where appropriate

## Next Steps
1. Generate Prisma client
2. Create initial migration
3. Seed database with sample data
4. Implement API endpoints
