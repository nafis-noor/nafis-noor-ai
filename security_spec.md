# Nafis Noor — Application Security Specification & Red-Team Audit (`security_spec.md`)

## 1. Data & Access Control Invariants
1. **Global Default-Deny Safety Net**: Any path not explicitly matched in `firestore.rules` is unconditionally denied (`allow read, write: if false;`).
2. **Strict User Data Isolation (PII & Progress)**:
   - A user document at `/users/{userId}` can ONLY be read (`get`), created, updated, or deleted when `request.auth != null && request.auth.uid == userId` (or `isAdmin()`).
   - Blanket `allow list` queries on `/users` are **strictly forbidden** for non-admin users to prevent user enumeration and PII scraping.
   - Subcollection documents at `/users/{userId}/chats/{chatId}` require relational parent verification (`exists(/databases/$(database)/documents/users/$(userId))`) and `request.auth.uid == userId`.
3. **Anti-Privilege Escalation & Role Integrity**:
   - During `create` on `/users/{userId}`, a user is strictly forbidden from setting `role: 'admin'` unless `isAdmin()` is already true (`data.role == 'user' || isAdmin()`).
   - During `update` on `/users/{userId}`, `incoming().role == existing().role` and `incoming().id == existing().id` and `incoming().createdAt == existing().createdAt` are enforced as immutable fields for regular users.
4. **Action-Based Update Pattern & Anti-Shadow-Field Gate**:
   - Every `create` and `update` must pass `isValidUser(incoming())` or `isValidChat(incoming())` which enforces `.keys().hasAll(...)` and `.keys().hasOnly(...)` along with explicit `.size()` boundaries on every string, list, and map.
   - Updates on `/users/{userId}` must match explicit action gates using `incoming().diff(existing()).affectedKeys().hasOnly(...)`.
5. **Path Variable Hardening (`isValidId`)**:
   - Every document ID path variable (`{userId}`, `{chatId}`, `{adminId}`) is validated with `isValidId(id)` (`id is string && id.size() >= 1 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$')`).

---

## 2. The "Dirty Dozen" Adversarial Payloads (All Must Return `PERMISSION_DENIED`)

1. **Payload 1 — Cross-User PII Read (Horizontal Privilege Escalation)**:
   - Authenticated User `uid_attacker` executes `getDoc(doc(db, 'users', 'uid_victim'))`.
   - **Result**: `PERMISSION_DENIED` (`isOwner(userId)` is false).
2. **Payload 2 — User Enumeration via Collection List**:
   - Authenticated User `uid_attacker` executes `getDocs(collection(db, 'users'))`.
   - **Result**: `PERMISSION_DENIED` (`allow list: if isAdmin()` blocks non-admin enumeration).
3. **Payload 3 — Self-Assigned Admin Role on Registration (Vertical Privilege Escalation)**:
   - User `uid_attacker` creates `/users/uid_attacker` with `{ id: 'uid_attacker', role: 'admin', ... }`.
   - **Result**: `PERMISSION_DENIED` (`incoming().role == 'user' || isAdmin()` rejects `'admin'`).
4. **Payload 4 — Role Escalation via Partial Update**:
   - User `uid_attacker` updates `/users/uid_attacker` with `{ role: 'admin' }`.
   - **Result**: `PERMISSION_DENIED` (`incoming().role == existing().role` and `affectedKeys().hasOnly(...)` exclude `role`).
5. **Payload 5 — Shadow / Ghost Field Injection**:
   - User `uid_attacker` updates `/users/uid_attacker` with `{ isVerifiedAdmin: true, hack: 'payload' }`.
   - **Result**: `PERMISSION_DENIED` (`isValidUser()` `keys().hasOnly(...)` and `affectedKeys().hasOnly(...)` reject unknown keys).
6. **Payload 6 — Identity Spoofing Inside Payload (`data.id != userId`)**:
   - User `uid_attacker` creates `/users/uid_attacker` with `{ id: 'uid_victim', ... }`.
   - **Result**: `PERMISSION_DENIED` (`data.id == request.auth.uid && data.id == userId` fails).
7. **Payload 7 — Immutable `createdAt` Tampering**:
   - User `uid_attacker` updates `/users/uid_attacker` changing `createdAt` to `'1999-01-01T00:00:00.000Z'`.
   - **Result**: `PERMISSION_DENIED` (`incoming().createdAt == existing().createdAt` fails).
8. **Payload 8 — Unverified Email Spoofing Against Admin Check**:
   - Attacker crafts token with `email == 'alnoorgroup.n@gmail.com'` but `email_verified == false`.
   - **Result**: `PERMISSION_DENIED` (`request.auth.token.email_verified == true` is mandatory in `isAdmin()`).
9. **Payload 9 — Denial-of-Wallet Oversized String Poisoning**:
   - User `uid_attacker` writes a 500KB string into `displayName` (max 100 chars).
   - **Result**: `PERMISSION_DENIED` (`data.displayName.size() <= 100` fails).
10. **Payload 10 — Orphaned Chat Creation Without Parent User Document**:
    - User `uid_attacker` attempts to create `/users/uid_attacker/chats/chat_1` when `/users/uid_attacker` does not exist.
    - **Result**: `PERMISSION_DENIED` (`exists(/databases/$(database)/documents/users/$(userId))` Master Gate fails).
11. **Payload 11 — Cross-User Subcollection Write**:
    - User `uid_attacker` attempts to write to `/users/uid_victim/chats/chat_1`.
    - **Result**: `PERMISSION_DENIED` (`isOwner(userId)` fails).
12. **Payload 12 — Unbounded Array Poisoning on Chat Messages**:
    - User `uid_attacker` attempts to write a `messages` array with 1,000 items or non-map first element.
    - **Result**: `PERMISSION_DENIED` (`data.messages is list && data.messages.size() <= 200` fails).
