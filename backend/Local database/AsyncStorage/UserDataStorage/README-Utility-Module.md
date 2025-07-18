UserDataStorage Module
A comprehensive user data management system for React Native applications, providing efficient caching and storage solutions across multiple layers.

📋 Overview
This module implements a three-tier caching system for user data:

Session Cache (In-memory) - Fastest access during app session

AsyncStorage (Persistent) - Survives app restarts

Supabase Database - Authoritative data source

📁 Files Structure
text
UserDataStorage/
├── GetUserDataFromSession.ts # Session cache retrieval
├── LoadUserDataFromStorage.ts # AsyncStorage operations
├── SharedUserState.ts # Global state management
├── StoreUserDataInStorage.ts # Storage operations
├── index.ts # Unified exports
└── README.md # This documentation
🚀 Key Features
⚡ Performance Optimized
Session Cache: Instant access to frequently used data

Persistent Storage: Offline-first approach with AsyncStorage

Automatic Synchronization: Updates all cache layers simultaneously

💾 Multi-Layer Caching
Layer 1: In-memory session cache for immediate access

Layer 2: AsyncStorage for persistent local storage

Layer 3: Supabase database for authoritative data

🔄 Seamless Integration
Session cache automatically populated from AsyncStorage

Storage operations update all cache layers

Fallback mechanisms ensure data availability

🔧 Core Functions
getUserDataFromSession(walletAddress: string)
Purpose: Retrieves user data from the in-memory session cache

Parameters:

walletAddress (string): The wallet address to look up

Returns: UserData | null

Usage:

typescript
const userData = getUserDataFromSession("0x123...");
if (userData) {
console.log(`Welcome ${userData.name}!`);
}
When to use:

✅ Frequently accessed data (chat lists, profile displays)

✅ Performance-critical operations

✅ Quick validation checks

loadUserDataFromStorage(walletAddress: string)
Purpose: Loads user data from AsyncStorage and updates session cache

Parameters:

walletAddress (string): The wallet address to load

Returns: Promise<UserData | null>

Usage:

typescript
const userData = await loadUserDataFromStorage("0x123...");
if (userData) {
// Data is now in both AsyncStorage and session
displayUserProfile(userData);
}
When to use:

✅ App initialization

✅ After session cache miss

✅ Loading persistent user data

storeUserDataInStorage(userData: UserData)
Purpose: Stores user data in both AsyncStorage and session cache

Parameters:

userData (UserData): Complete user data object

Returns: Promise<void>

Usage:

typescript
const newUserData = {
walletAddress: "0x123...",
name: "John Doe",
username: "johndoe",
avatar: "https://...",
bio: "Hello world!",
created_at: new Date().toISOString(),
publicKey: "..."
};

await storeUserDataInStorage(newUserData);
// Now available in both session and AsyncStorage
When to use:

✅ User registration

✅ Profile updates

✅ Data synchronization from server

clearSessionUserData()
Purpose: Clears the in-memory session cache

Parameters: None

Returns: void

Usage:

typescript
// Clear session on logout
clearSessionUserData();
When to use:

✅ User logout

✅ App termination

✅ Memory cleanup

🌊 Data Flow
text

1. Request User Data
   ↓
2. Check Session Cache (getUserDataFromSession)
   ↓ (if not found)
3. Check AsyncStorage (loadUserDataFromStorage)
   ↓ (if not found)
4. Fetch from Supabase
   ↓
5. Store in All Caches (storeUserDataInStorage)
   ↓
6. Return Data
   📖 Usage Examples
   Basic Profile Loading
   typescript
   // Fast session check first
   let profile = getUserDataFromSession(walletAddress);

if (!profile) {
// Load from persistent storage
profile = await loadUserDataFromStorage(walletAddress);
}

if (profile) {
displayUserProfile(profile);
}
Chat Profile Management
typescript
// Quick session check for chat lists
const chatProfile = getUserDataFromSession(walletAddress);
if (chatProfile) {
// Instantly display cached profile
displayChatProfile(chatProfile);
} else {
// Load from storage if not in session
const profile = await loadUserDataFromStorage(walletAddress);
if (profile) {
displayChatProfile(profile);
}
}
User Registration Flow
typescript
// After successful registration
const newUserData = {
walletAddress: wallet.address,
name: formData.name,
username: formData.username,
// ... other fields
};

// Store in both session and AsyncStorage
await storeUserDataInStorage(newUserData);

// Now immediately available for the rest of the app
const sessionData = getUserDataFromSession(wallet.address);
Logout Flow
typescript
// Clear session cache
clearSessionUserData();

// Clear AsyncStorage
await AsyncStorage.removeItem("userData");
await AsyncStorage.removeItem("sessionData");
🛡️ Error Handling
The module includes comprehensive error handling:

Graceful Degradation: Falls back to cached data when operations fail

Null Safety: Returns null for missing data instead of throwing errors

Detailed Logging: Console output with emojis for easy debugging

Error Scenarios
❌ Storage Failure: Returns null, logs error

⚠️ Wallet Mismatch: Returns null, warns about different wallet

⚠️ No Data Found: Returns null, logs warning

🎯 Performance Benefits
Session Cache
0ms access time for frequently used profiles

Memory efficient - single UserData object

Automatic cleanup when app terminates

AsyncStorage
Persistent storage survives app restarts

Offline access to user profiles

Dual storage (userData + sessionData keys)

Smart Loading
Cache-first approach minimizes database queries

Automatic synchronization keeps data consistent

Fallback mechanisms ensure reliability

🔗 Integration
This module integrates seamlessly with:

Chat Systems: Fast profile loading for conversations

User Authentication: Session management and profile caching

Offline Features: Persistent data access without network

Profile Management: Efficient updates and synchronization

📋 Best Practices
✅ Do's
Always check session first for frequently accessed data

Use loadUserDataFromStorage for persistent data that needs to survive app restarts

Handle null returns gracefully in your UI components

Store complete UserData objects to maintain data integrity

Clear session appropriately during logout

❌ Don'ts
Don't assume data exists - always check for null

Don't skip session checks for performance-critical operations

Don't forget to await async storage operations

Don't store incomplete data - use the full UserData interface

Don't leave session data after logout

🎨 Console Output
The module provides color-coded console output for easy debugging:

⚡ Session Cache Hit: Fast retrieval from memory

✅ Storage Success: Successful storage operations

⚠️ Warning: Data not found or wallet mismatch

❌ Error: Storage failures or exceptions

📊 Import/Export
typescript
// Import individual functions
import {
getUserDataFromSession,
loadUserDataFromStorage,
storeUserDataInStorage,
clearSessionUserData
} from './UserDataStorage';

// Or import all at once
import \* as UserStorage from './UserDataStorage';
🔧 TypeScript Support
Full TypeScript support with proper type definitions:

UserData interface for type safety

Nullable return types for safe handling

Promise-based async operations

Proper parameter typing

This module provides a robust, efficient, and type-safe solution for managing user data across your React Native application
