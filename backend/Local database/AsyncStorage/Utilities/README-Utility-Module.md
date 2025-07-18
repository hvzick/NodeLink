# Utilities Module Documentation

## Overview

The Utilities module provides essential helper functions for user data management in the NodeLink application. It handles session caching, AsyncStorage operations, and provides a bridge between different storage layers with optimized performance through in-memory caching.

## File Structure

backend/Local database/AsyncStorage/Utilities/
├── SharedUserState.ts # Shared session state management
├── GetUserDataFromSession.ts # Retrieve data from session cache
├── LoadUserDataFromStorage.ts # Load data from AsyncStorage
├── StoreUserDataInStorage.ts # Store data to AsyncStorage
└── index.ts # Export all functions

text

## Functions Documentation

### **SharedUserState.ts**

Manages the shared session state for user data across all utility functions.

**Functions:**

- `getSessionUserData()` - Returns the current session user data
- `setSessionUserData(userData)` - Sets user data in session cache
- `clearSessionUserData()` - Clears session cache

**Purpose:**

- Provides single source of truth for session data
- Ensures all utility functions share the same in-memory cache
- Optimizes performance by avoiding redundant storage calls

### **GetUserDataFromSession.ts**

Retrieves user data from the in-memory session cache.

**Function:** `getUserDataFromSession(walletAddress: string): UserData | null`

**What it does:**

- Checks if session data exists for the specified wallet address
- Returns data instantly from memory (no AsyncStorage call)
- Returns null if no session data or wrong wallet address
- Logs cache hit/miss for debugging

**Usage:**
const userData = getUserDataFromSession("0x123...abc");
if (userData) {
console.log("Quick access:", userData.name);
}

text

**Performance:**

- **Instantaneous** - No async operations
- **Memory efficient** - Single shared cache
- **Fallback friendly** - Returns null for other functions to handle

### **LoadUserDataFromStorage.ts**

Loads user data from AsyncStorage and updates session cache.

**Function:** `loadUserDataFromStorage(walletAddress: string): Promise<UserData | null>`

**What it does:**

- Attempts to load from `"sessionData"` key first (most recent)
- Falls back to `"userData"` key if sessionData not found
- Validates wallet address matches requested address
- Updates session cache with loaded data
- Returns user data or null if not found

**Usage:**
const userData = await loadUserDataFromStorage("0x123...abc");
if (userData) {
console.log("Loaded from storage:", userData.name);
}

text

**Storage Priority:**

1. `sessionData` - Most recent/temporary data
2. `userData` - Persistent user data
3. Returns null if neither exists

**Smart Features:**

- **Address validation** - Ensures data matches requested user
- **Cache warming** - Automatically updates session cache
- **Graceful degradation** - Handles missing or corrupt data

### **StoreUserDataInStorage.ts**

Stores user data in both AsyncStorage and session cache.

**Function:** `storeUserDataInStorage(userData: UserData): Promise<void>`

**What it does:**

- Updates session cache immediately (instant access)
- Stores data in AsyncStorage under `"userData"` key
- Stores data in AsyncStorage under `"sessionData"` key
- Ensures data persistence across app restarts
- Provides dual-layer storage for reliability

**Usage:**
await storeUserDataInStorage(userData);
// Data now available in both session and persistent storage

text

**Storage Strategy:**

- **Session cache** - Immediate access, cleared on app restart
- **userData** - Persistent storage, survives app restarts
- **sessionData** - Recent session data, preferred for loading

**Benefits:**

- **Instant access** - Session cache updated immediately
- **Persistence** - Data survives app restarts
- **Redundancy** - Multiple storage locations for reliability

## Data Flow Examples

### **Fast Access Pattern**

App needs data → getUserDataFromSession()

If found → return immediately (0ms)

If not found → caller uses loadUserDataFromStorage()

Storage loads data → updates session cache

Next access → instant from session

text

### **Initial Load Pattern**

App starts → loadUserDataFromStorage()

Checks sessionData → loads if available

Falls back to userData → loads if available

Updates session cache → enables fast access

Returns data to caller

text

### **Data Update Pattern**

User updates profile → storeUserDataInStorage()

Updates session cache → immediate access enabled

Stores in userData → persistence ensured

Stores in sessionData → preferred for next load

Data available in all layers

text

## Performance Characteristics

| Function                  | Speed   | Storage Access        | Use Case        |
| ------------------------- | ------- | --------------------- | --------------- |
| `getUserDataFromSession`  | Instant | Memory only           | Frequent access |
| `loadUserDataFromStorage` | ~50ms   | AsyncStorage          | Initial load    |
| `storeUserDataInStorage`  | ~100ms  | AsyncStorage + Memory | Data updates    |

## Error Handling

All functions include comprehensive error handling:

- **JSON parsing errors** - Graceful handling of corrupt data
- **Storage failures** - Maintains session cache even if storage fails
- **Type validation** - Ensures data integrity
- **Detailed logging** - Comprehensive debugging information

## Import Usage

// Import all functions
import {
getUserDataFromSession,
loadUserDataFromStorage,
storeUserDataInStorage,
clearSessionUserData
} from "../backend/Local database/AsyncStorage/Utilities";

// Fast access pattern
let userData = getUserDataFromSession(walletAddress);
if (!userData) {
userData = await loadUserDataFromStorage(walletAddress);
}

text

## Best Practices

1. **Try session first** - Always check `getUserDataFromSession()` before async calls
2. **Cache warming** - Use `loadUserDataFromStorage()` during app initialization
3. **Immediate updates** - Use `storeUserDataInStorage()` after data changes
4. **Error handling** - Always handle null returns gracefully
5. **Performance optimization** - Minimize async calls by leveraging session cache

## Cache Management

The session cache is automatically managed:

- **Automatic updates** - Storage functions update cache
- **Address validation** - Ensures cache matches current user
- **Memory efficient** - Single instance shared across functions
- **Cleanup ready** - Easy to clear on logout

## Integration with Other Modules

The Utilities module serves as a bridge between:

- **Storage Module** - Provides persistent storage
- **Session Module** - Manages temporary session data
- **UI Components** - Provides fast data access
- **Authentication** - Handles user data during login/logout

This modular approach ensures optimal performance while maintaining data consistency across all application layers.
