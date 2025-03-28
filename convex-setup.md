# Convex Backend Setup

To make the Chat Game application work properly, you need to set up the following schema and functions in your Convex project.

## Required Schema Tables

### 1. Messages Table

Create a table for storing chat messages:

```javascript
// convex/schema.js
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    roomId: v.string(),
    userId: v.string(),
    username: v.string(),
    avatar: v.string(),
    message: v.string(),
    roomType: v.string(), // "waiting" or "game"
  }),
  
  rooms: defineTable({
    roomId: v.string(),
    createdBy: v.string(),
    status: v.string(), // "waiting" or "playing"
    players: v.array(v.object({
      userId: v.string(),
      username: v.string(),
      avatar: v.string(),
      isHost: v.boolean(),
    })),
  }),
  
  presence: defineTable({
    roomId: v.string(),
    userId: v.string(),
    username: v.string(),
    avatar: v.string(),
    isTyping: v.boolean(),
    lastActive: v.number(),
  }),
});
```

## Required Functions

### 1. Message Functions

```javascript
// convex/messages.js
import { mutation, query } from "./_generated/server";

// Send a message
export const sendMessage = mutation({
  args: {
    roomId: "string",
    userId: "string",
    username: "string",
    avatar: "string",
    message: "string",
    roomType: "string",
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: args.userId,
      username: args.username,
      avatar: args.avatar,
      message: args.message,
      roomType: args.roomType,
    });
    return messageId;
  },
});

// Get messages for a room
export const getRoomMessages = query({
  args: {
    roomId: "string",
    roomType: "string",
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .filter(q => 
        q.eq(q.field("roomId"), args.roomId) &&
        q.eq(q.field("roomType"), args.roomType)
      )
      .order("_creationTime")
      .collect();
  },
});
```

### 2. Room Functions

```javascript
// convex/rooms.js
import { mutation, query } from "./_generated/server";

// Create a new room
export const createRoom = mutation({
  args: {
    roomId: "string",
    createdBy: "string",
    status: "string",
    players: "array",
  },
  handler: async (ctx, args) => {
    const roomId = await ctx.db.insert("rooms", {
      roomId: args.roomId,
      createdBy: args.createdBy,
      status: args.status,
      players: args.players,
    });
    return { roomId: args.roomId };
  },
});

// Join a room
export const joinRoom = mutation({
  args: {
    roomId: "string",
    userId: "string",
    username: "string",
    avatar: "string",
  },
  handler: async (ctx, args) => {
    // Get the room
    const room = await ctx.db
      .query("rooms")
      .filter(q => q.eq(q.field("roomId"), args.roomId))
      .first();
    
    if (!room) return null;
    
    // Check if player is already in the room
    const playerExists = room.players.some(player => player.userId === args.userId);
    
    if (!playerExists) {
      // Add player to the room
      const newPlayers = [...room.players, {
        userId: args.userId,
        username: args.username,
        avatar: args.avatar,
        isHost: false,
      }];
      
      await ctx.db.patch(room._id, { players: newPlayers });
    }
    
    return room;
  },
});

// Leave a room
export const leaveRoom = mutation({
  args: {
    roomId: "string",
    userId: "string",
  },
  handler: async (ctx, args) => {
    // Get the room
    const room = await ctx.db
      .query("rooms")
      .filter(q => q.eq(q.field("roomId"), args.roomId))
      .first();
    
    if (!room) return;
    
    // Remove player from the room
    const newPlayers = room.players.filter(player => player.userId !== args.userId);
    
    // If there are no players left, delete the room
    if (newPlayers.length === 0) {
      await ctx.db.delete(room._id);
      return;
    }
    
    // If the host is leaving, assign a new host
    const hostLeft = room.players.some(player => 
      player.userId === args.userId && player.isHost
    );
    
    if (hostLeft && newPlayers.length > 0) {
      newPlayers[0].isHost = true;
    }
    
    await ctx.db.patch(room._id, { players: newPlayers });
  },
});

// Get a room
export const getRoom = query({
  args: {
    roomId: "string",
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rooms")
      .filter(q => q.eq(q.field("roomId"), args.roomId))
      .first();
  },
});

// Update room status
export const updateRoomStatus = mutation({
  args: {
    roomId: "string",
    status: "string",
  },
  handler: async (ctx, args) => {
    // Get the room
    const room = await ctx.db
      .query("rooms")
      .filter(q => q.eq(q.field("roomId"), args.roomId))
      .first();
    
    if (!room) return;
    
    await ctx.db.patch(room._id, { status: args.status });
  },
});
```

### 3. Presence Functions

```javascript
// convex/presence.js
import { mutation, query } from "./_generated/server";

// Update presence
export const updatePresence = mutation({
  args: {
    roomId: "string",
    userId: "string",
    username: "string",
    avatar: "string",
    isTyping: "boolean",
    lastActive: "number",
  },
  handler: async (ctx, args) => {
    // Check if presence record exists
    const existingPresence = await ctx.db
      .query("presence")
      .filter(q => 
        q.eq(q.field("roomId"), args.roomId) &&
        q.eq(q.field("userId"), args.userId)
      )
      .first();
    
    if (existingPresence) {
      // Update existing presence
      await ctx.db.patch(existingPresence._id, {
        isTyping: args.isTyping,
        lastActive: args.lastActive,
      });
    } else {
      // Create new presence
      await ctx.db.insert("presence", {
        roomId: args.roomId,
        userId: args.userId,
        username: args.username,
        avatar: args.avatar,
        isTyping: args.isTyping,
        lastActive: args.lastActive,
      });
    }
  },
});

// Get presence for a room
export const getRoomPresence = query({
  args: {
    roomId: "string",
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("presence")
      .filter(q => q.eq(q.field("roomId"), args.roomId))
      .collect();
  },
});
```

## Deploying the Convex Backend

1. Install the Convex CLI:
   ```
   npm install -g convex
   ```

2. Create your Convex project in a separate directory:
   ```
   npx convex init
   ```

3. Copy the schema and function files into the appropriate directories.

4. Deploy your Convex project:
   ```
   npx convex deploy
   ```

5. Copy the deployment URL and use it in your client code. 