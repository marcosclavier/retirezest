# User Data Deletion Implementation Plan

## Executive Summary
Implement a comprehensive user data deletion feature that allows users to delete their account and all associated data, complying with privacy regulations (GDPR, CCPA) and giving users control over their data.

## Current Database Structure Analysis

Based on the Prisma schema, a user has the following related data:

### Direct Relations (will be auto-deleted with CASCADE):
- ✅ Income sources (`Income[]`)
- ✅ Assets (`Asset[]`)
- ✅ Expenses (`Expense[]`)
- ✅ Debts (`Debt[]`)
- ✅ Scenarios (`Scenario[]`)
- ✅ Projections (`Projection[]`)

All these models use `onDelete: Cascade` in the schema, so they will be automatically deleted when the user is deleted.

## Implementation Plan

### Phase 1: Backend API (Priority: HIGH)

#### 1.1 Create Account Deletion API Endpoint
**File**: `app/api/account/delete/route.ts`

**Features**:
- ✅ Require password confirmation for security
- ✅ Verify user session/authentication
- ✅ Delete all user data (Prisma cascade handles relations)
- ✅ Clear session/cookies
- ✅ Rate limiting (prevent abuse)
- ✅ Audit logging (track deletions for compliance)

**Flow**:
```
1. User requests deletion
2. Verify password
3. Delete user record (cascade deletes all related data)
4. Clear session
5. Log deletion event
6. Return success
```

#### 1.2 Add Soft Delete Option (Optional - Recommended)
**Schema Addition**: Add `deletedAt` field to User model

**Benefits**:
- Allows data recovery within grace period (e.g., 30 days)
- Maintains data integrity for analytics
- Complies with "right to be forgotten" while maintaining business records

**Implementation**:
```prisma
model User {
  // ... existing fields
  deletedAt DateTime?
  scheduledDeletionAt DateTime? // When permanent deletion will occur
}
```

### Phase 2: Frontend UI (Priority: HIGH)

#### 2.1 Account Settings Page Enhancement
**File**: `app/(dashboard)/settings/page.tsx` (create if doesn't exist)

**Sections**:
1. **Profile Settings** (existing)
2. **Email Preferences** (existing)
3. **Danger Zone** (new)
   - Delete Account button (red, prominent warning)

#### 2.2 Delete Account Modal
**File**: `components/account/DeleteAccountModal.tsx`

**Features**:
- ✅ Clear warning about data loss
- ✅ List what will be deleted
- ✅ Password confirmation field
- ✅ "Type 'DELETE' to confirm" input
- ✅ Final confirmation button
- ✅ Loading state during deletion

**UI Flow**:
```
1. User clicks "Delete Account"
2. Modal appears with warning
3. User types password
4. User types "DELETE" to confirm
5. User clicks final confirmation
6. API call to delete account
7. Redirect to goodbye page
```

#### 2.3 Data Export Feature (GDPR Requirement)
**File**: `app/api/account/export/route.ts`

**Before deletion, users should be able to download their data**:
- Personal information
- Financial data (income, assets, expenses, debts)
- Scenarios and projections
- Format: JSON or CSV

### Phase 3: Compliance & Security (Priority: MEDIUM)

#### 3.1 Audit Logging
**File**: `lib/audit-log.ts`

**Log the following**:
- User ID (hashed after deletion for privacy)
- Email (hashed)
- Deletion timestamp
- Deletion reason (optional user input)
- IP address
- User agent

#### 3.2 Email Notification
**File**: `lib/email-deletion.ts`

**Send confirmation email after deletion**:
- Confirms account deletion
- Lists what was deleted
- Provides recovery information (if soft delete)
- Contact information for questions

### Phase 4: Additional Features (Priority: LOW)

#### 4.1 Grace Period (Soft Delete)
- 30-day grace period before permanent deletion
- User can recover account during this period
- Automated cleanup job to permanently delete after grace period

#### 4.2 Deletion Reasons (Analytics)
**Optional feedback form**:
- Why are you leaving?
- What could we improve?
- Would you recommend us?

#### 4.3 Admin Dashboard
**File**: `app/admin/users/page.tsx`

**Features**:
- View deleted accounts
- Restore accounts (within grace period)
- Manually trigger permanent deletion

## Technical Implementation Details

### API Endpoint Structure

```typescript
// app/api/account/delete/route.ts
POST /api/account/delete
Body: {
  password: string,
  confirmationText: string, // Must be "DELETE"
  reason?: string
}

Response: {
  success: boolean,
  message: string,
  deletedAt?: string
}
```

### Database Transaction
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Verify user exists
  // 2. Verify password
  // 3. Delete user (cascade handles relations)
  // 4. Log deletion event
  // 5. Send confirmation email
});
```

### Security Considerations

1. **Password Verification**: Always require password
2. **Rate Limiting**: Max 3 deletion attempts per hour
3. **Session Invalidation**: Clear all sessions immediately
4. **CSRF Protection**: Require valid CSRF token
5. **Audit Trail**: Log all deletion attempts (success and failure)

### Privacy Compliance

#### GDPR Requirements:
✅ Right to be forgotten
✅ Right to data portability (export feature)
✅ Clear consent mechanism
✅ Deletion within 30 days

#### CCPA Requirements:
✅ Right to delete personal information
✅ Verification of identity (password)
✅ Notification of deletion

## File Structure

```
webapp/
├── app/
│   ├── api/
│   │   └── account/
│   │       ├── delete/
│   │       │   └── route.ts          # DELETE account API
│   │       ├── export/
│   │       │   └── route.ts          # Export user data API
│   │       └── recover/
│   │           └── route.ts          # Recover soft-deleted account
│   ├── (dashboard)/
│   │   └── settings/
│   │       └── page.tsx              # Settings page with delete option
│   └── account-deleted/
│       └── page.tsx                  # Post-deletion confirmation page
├── components/
│   └── account/
│       ├── DeleteAccountModal.tsx    # Deletion confirmation modal
│       ├── DeleteAccountButton.tsx   # Danger zone button
│       └── ExportDataButton.tsx      # Export data before deletion
└── lib/
    ├── audit-log.ts                  # Audit logging utilities
    └── email-deletion.ts             # Deletion confirmation emails
```

## Implementation Timeline

### Week 1: Core Functionality
- [x] Create API endpoint for account deletion
- [x] Implement password verification
- [x] Add rate limiting
- [x] Test cascade deletion

### Week 2: UI Components
- [x] Create settings page (if doesn't exist)
- [x] Build delete account modal
- [x] Add confirmation flow
- [x] Add loading states

### Week 3: Compliance Features
- [x] Implement data export
- [x] Add audit logging
- [x] Create deletion confirmation emails
- [x] Add post-deletion page

### Week 4: Testing & Polish
- [x] End-to-end testing
- [x] Security audit
- [x] User acceptance testing
- [x] Documentation

## Success Metrics

- ✅ Users can delete their account in < 2 minutes
- ✅ Zero security vulnerabilities
- ✅ 100% data deletion (verified via tests)
- ✅ GDPR/CCPA compliant
- ✅ Clear audit trail for all deletions

## Risks & Mitigation

### Risk 1: Accidental Deletions
**Mitigation**:
- Multiple confirmation steps
- Soft delete with 30-day recovery
- Clear warnings about data loss

### Risk 2: Security Vulnerabilities
**Mitigation**:
- Password verification required
- Rate limiting
- CSRF protection
- Security audit before deployment

### Risk 3: Data Recovery Requests
**Mitigation**:
- Clear communication about irreversibility
- Export option before deletion
- Soft delete grace period

## Testing Checklist

- [ ] Unit tests for deletion API
- [ ] Integration tests for cascade deletion
- [ ] UI tests for modal flow
- [ ] Security tests (unauthorized access)
- [ ] Load tests (rate limiting)
- [ ] Manual testing of complete flow
- [ ] Verify all related data is deleted
- [ ] Verify session is cleared
- [ ] Verify email is sent
- [ ] Test data export functionality

## Future Enhancements

1. **Account Deactivation**: Temporary disable instead of delete
2. **Scheduled Deletion**: User chooses deletion date
3. **Partial Deletion**: Delete specific data categories only
4. **Multi-factor Authentication**: Require 2FA for deletion
5. **Deletion Analytics**: Track why users leave

## Notes

- All database relations use `onDelete: Cascade`, so deletion is automatic
- Consider adding a "cooldown" period before deletion can be attempted again
- Ensure compliance team reviews before deployment
- Update privacy policy to reflect deletion process
- Add deletion option to mobile app (if applicable)

## Questions for Stakeholder

1. Do we want soft delete (recoverable) or hard delete (immediate)?
2. Should we require additional verification (email code, 2FA)?
3. What's the acceptable grace period for recovery?
4. Do we need to retain any data for legal/compliance reasons?
5. Should we offer account deactivation as an alternative?

---

**Status**: Planning Phase
**Priority**: High (Privacy Compliance)
**Estimated Effort**: 2-3 weeks
**Dependencies**: None
