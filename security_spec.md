# CleanEase Security Specification

## Data Invariants
1. **Users**:
   - Every user must have a unique UID matching their Auth UID.
   - Users cannot change their `email` after creation.
   - Users cannot self-assign `isAdmin` or similar elevated roles (though not explicitly in schema, we guard it).
   - Only homeowners can create bookings.
   - Only providers can be assigned to bookings.

2. **Bookings**:
   - A booking must have a valid `customerId` matching the creator.
   - `totalPrice` must be non-negative.
   - `status` transitions must follow a logical flow (e.g., cannot go from `completed` back to `pending`).
   - `createdAt` is immutable and must match server time.

3. **Notifications**:
   - Users can only read their own notifications.
   - Notifications are typically system-generated or triggered by specific actions.

4. **Chat**:
   - Messages must belong to a valid booking.
   - Authors must be either the `customerId` or `providerId` of the parent booking.

## The Dirty Dozen Payloads

| ID | Target Collection | Payload | Intent | Expected Result |
|---|---|---|---|---|
| D1 | users | `{"uid": "attacker", "role": "admin"}` | Identity Spoofing / Privilege Escalation | DENIED |
| D2 | users/{id} | `{"email": "new@email.com"}` (on update) | Email modification (PII Integrity) | DENIED |
| D3 | bookings | `{"id": "b1", "customerId": "victim_id", "totalPrice": 0}` | Creating booking for someone else | DENIED |
| D4 | bookings | `{"id": "b1", "totalPrice": -100}` | Price poisoning | DENIED |
| D5 | bookings/{id} | `{"status": "completed"}` (by customer at start) | State skip (completing without work) | DENIED |
| D6 | bookings/{id} | `{"providerId": "attacker"}` (by provider) | Self-assignment to booking | DENIED |
| D7 | notifications | `{"data": "junk"}` (by random user) | Notifications spam | DENIED |
| D8 | chat | `{"text": "hi", "senderId": "outsider"}` | Messaging in private booking | DENIED |
| D9 | services | `{"basePrice": 0.01}` (by user) | Service catalog poisoning | DENIED |
| D10| users | `{"displayName": "A".repeat(2000)}` | Resource exhaustion (DoS) | DENIED |
| D11| bookings | `{"id": "../poison/123"}` | Path traversal / ID poisoning | DENIED |
| D12| bookings/{id} | `{"createdAt": "2000-01-01T00:00:00Z"}` | History rewriting | DENIED |

## The Test Runner (Plan)
Creating `src/lib/firestore.rules.test.ts` to simulate these attacks using the Firebase Rules Unit Testing library.
