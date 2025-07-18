# Storage Module Documentation

## Overview

The Storage module handles all AsyncStorage operations for user data in the NodeLink application. It provides a clean separation between current user management and individual user profile storage, with all functions sharing a common state through the SharedStorageState module.

## File Structure

backend/Local database/AsyncStorage/Storage/
├── SharedStorageState.ts # Shared state management
├── StoreCurrentUserData.ts # Store current active user
├── LoadCurrentUserData.ts # Load current active user
├── LoadUserProfile.ts # Load specific user profile
├── StoreUserProfile.ts # Store specific user profile
├── ClearUserData.ts # Clear user data
├── CleanupStorage.ts # Storage cleanup utilities
└── index.ts # Export all functions

text

## Functions Documentation

### **SharedStorageState.ts**

Manages the shared state for current user data across all storage functions.

**Functions:**

- `getCurrentUserData()` - Returns the currently active user data
- `setCurrentUserData(userData)` - Sets the current active user
- `clearCurrentUserData()` - Clears the current user from memory
- `isCurrentUser(walletAddress)` - Checks if given wallet address is the current user

### **StoreCurrentUserData.ts**

Handles storing the current active user's data.

**Function:** `storeCurrentUserData(userData: UserData): Promise<void>`

**What it does:**

- Updates the shared state with the current user
- Stores user data in AsyncStorage under `"currentUser"` key
- Creates a user-specific storage entry with key `"user_{walletAddress}"`
- Logs success/failure messages

**Usage:**
await storeCurrentUserData(userData);

text

**Storage Keys Used:**

- `currentUser` - Current active user
- `user_{walletAddress}` - User-specific profile data

### **LoadCurrentUserData.ts**

Loads the current active user's data from AsyncStorage.

**Function:** `loadCurrentUserData(): Promise<UserData | null>`

**What it does:**

- Retrieves data from AsyncStorage using `"currentUser"` key
- Updates shared state with loaded data
- Returns user data or null if not found
- Handles JSON parsing errors gracefully

**Usage:**
const userData = await loadCurrentUserData();
if (userData) {
console.log("Current user:", userData.name);
}

text

### **LoadUserProfile.ts**

Loads a specific user's profile data by wallet address.

**Function:** `loadUserProfile(walletAddress: string): Promise<UserData | null>`

**What it does:**

- Retrieves user profile using `"user_{walletAddress}"` key
- Updates shared state only if the loaded user is the current user
- Returns user data or null if not found
- Useful for loading profiles of other users

**Usage:**
const profile = await loadUserProfile("0x123...abc");
if (profile) {
console.log("User profile:", profile.name);
}

text

### **StoreUserProfile.ts**

Stores a specific user's profile data.

**Function:** `storeUserProfile(userData: UserData): Promise<void>`

**What it does:**

- Stores user profile under `"user_{walletAddress}"` key
- If the user is the current user, also updates `"currentUser"` key
- Updates shared state for current user if applicable
- Handles multi-user profile storage

**Usage:**
await storeUserProfile(updatedUserData);

text

**Smart Behavior:**

- Automatically detects if the stored user is the current user
- Updates both profile storage and current user storage when needed

### **ClearUserData.ts**

Clears user data from AsyncStorage.

**Function:** `clearUserData(walletAddress?: string): Promise<void>`

**What it does:**

- **With walletAddress**: Clears specific user's profile data
- **Without walletAddress**: Clears all user data and current user
- Updates shared state appropriately
- Useful for logout or account deletion

**Usage:**
// Clear specific user
await clearUserData("0x123...abc");

// Clear all user data (logout)
await clearUserData();

text

### **CleanupStorage.ts**

Performs comprehensive storage cleanup.

**Function:** `cleanupStorage(): Promise<void>`

**What it does:**

- Retrieves all AsyncStorage keys
- Identifies user-related keys (`user_*`, `currentUser`, `userData`, `sessionData`)
- Removes all user-related data in one operation
- Clears shared state
- Optimizes storage by removing unused data

**Usage:**
await cleanupStorage(); // Complete cleanup

text

**Keys Cleaned:**

- `user_*` - All user profile data
- `currentUser` - Current user data
- `userData` - Legacy user data
- `sessionData` - Session cache data

## Data Flow Examples

### **New User Registration**

User registers → storeCurrentUserData(newUser)

Updates shared state

Stores in both "currentUser" and "user\_{address}" keys

text

### **User Login**

App starts → loadCurrentUserData()

Retrieves from "currentUser" key

Updates shared state

App has access to current user

text

### **Profile Update**

User updates profile → storeUserProfile(updatedData)

Stores in "user\_{address}" key

If current user, also updates "currentUser" key

Updates shared state

text

### **Logout**

User logs out → clearUserData()

Removes "currentUser" key

Clears shared state

User data no longer accessible

text

## Storage Keys Reference

| Key                    | Purpose               | Content                          |
| ---------------------- | --------------------- | -------------------------------- |
| `currentUser`          | Current active user   | Complete UserData object         |
| `user_{walletAddress}` | User-specific profile | UserData for specific user       |
| `userData`             | Legacy storage        | Old user data (cleaned up)       |
| `sessionData`          | Session cache         | Temporary user data (cleaned up) |

## Error Handling

All functions include comprehensive error handling:

- **Try-catch blocks** for all AsyncStorage operations
- **Graceful degradation** when data is not found
- **Detailed logging** for debugging
- **State consistency** maintained even on errors

## Import Usage

// Import all functions
import {
storeCurrentUserData,
loadCurrentUserData,
loadUserProfile,
storeUserProfile,
clearUserData,
cleanupStorage,
getCurrentUserData
} from "../backend/Local database/AsyncStorage/Storage";

// Use any function
const userData = await loadCurrentUserData();

text

## Best Practices

1. **Always check return values** - functions return `null` when data not found
2. **Use appropriate function** - `loadCurrentUserData()` for current user, `loadUserProfile()` for specific users
3. **Handle errors** - wrap calls in try-catch blocks
4. **Cleanup on logout** - use `clearUserData()` or `cleanupStorage()`
5. **Check shared state** - use `getCurrentUserData()` for immediate access to current user

This modular approach ensures clean separation of concerns while maintaining shared state consistency across all storage operations.
