// Convex API client for Chat Game
const CONVEX_URL = "https://adorable-spider-894.convex.cloud";
const CONVEX_AUTH_TOKEN = "dev:adorable-spider-894|eyJ2MiI6ImU4MTRmYTlhODUxOTQzNjM4YWFiMGFjODkwZDc5YmY2In0=";

// Initialize the Convex client
async function initConvexClient() {
    try {
        // Check if convex is defined
        if (typeof convex === 'undefined') {
            throw new Error("Convex library is not loaded. Please check your script tags and ensure the library is loaded correctly.");
        }
        
        // Create a new Convex client with the URL and auth token from your Convex deployment
        const client = new convex.ConvexClient(CONVEX_URL, {
            // Pass the authentication token
            authToken: CONVEX_AUTH_TOKEN
        });
        console.log("Convex client initialized successfully");
        return client;
    } catch (error) {
        console.error("Failed to initialize Convex client:", error);
        throw error;
    }
}

// Class to manage presence and room data
class ConvexGameAPI {
    constructor(client) {
        this.client = client;
        this.userId = null;
        this.roomId = null;
        this.username = null;
        this.avatar = null;
        this.subscriptions = [];
    }

    // Generate a unique user ID
    generateUserId() {
        return `user_${Math.random().toString(36).substring(2, 15)}`;
    }

    // Generate a unique room ID
    generateRoomId() {
        return `room_${Math.random().toString(36).substring(2, 10)}`;
    }

    // Set user information
    setUserInfo(username, avatar) {
        this.userId = this.generateUserId();
        this.username = username;
        this.avatar = avatar;
        return this.userId;
    }

    // Create a new room
    async createRoom() {
        try {
            this.roomId = this.generateRoomId();
            const room = await this.client.mutation("rooms:createRoom", {
                roomId: this.roomId,
                createdBy: this.userId,
                status: "waiting",
                players: [{
                    userId: this.userId,
                    username: this.username,
                    avatar: this.avatar,
                    isHost: true
                }]
            });
            return room;
        } catch (error) {
            console.error("Failed to create room:", error);
            throw error;
        }
    }

    // Join an existing room
    async joinRoom(roomId) {
        try {
            const room = await this.client.mutation("rooms:joinRoom", {
                roomId,
                userId: this.userId,
                username: this.username,
                avatar: this.avatar
            });
            
            if (room) {
                this.roomId = roomId;
                return room;
            }
            return null;
        } catch (error) {
            console.error("Failed to join room:", error);
            throw error;
        }
    }

    // Leave a room
    async leaveRoom() {
        if (!this.roomId || !this.userId) return;
        
        try {
            await this.client.mutation("rooms:leaveRoom", {
                roomId: this.roomId,
                userId: this.userId
            });
            
            // Clear room ID after leaving
            this.roomId = null;
        } catch (error) {
            console.error("Failed to leave room:", error);
            throw error;
        }
    }

    // Start the game in a room
    async startGame() {
        if (!this.roomId) return;
        
        try {
            await this.client.mutation("rooms:updateRoomStatus", {
                roomId: this.roomId,
                status: "playing"
            });
        } catch (error) {
            console.error("Failed to start game:", error);
            throw error;
        }
    }

    // Send a chat message
    async sendMessage(message, roomType = "waiting") {
        if (!this.roomId || !this.userId) return;
        
        try {
            await this.client.mutation("messages:sendMessage", {
                roomId: this.roomId,
                userId: this.userId,
                username: this.username,
                avatar: this.avatar,
                message,
                roomType
            });
        } catch (error) {
            console.error("Failed to send message:", error);
            throw error;
        }
    }

    // Subscribe to room updates
    subscribeToRoom(roomId, callback) {
        try {
            const unsubscribe = this.client.onUpdate(
                "rooms:getRoom",
                { roomId },
                callback
            );
            this.subscriptions.push(unsubscribe);
            return unsubscribe;
        } catch (error) {
            console.error("Failed to subscribe to room:", error);
            throw error;
        }
    }

    // Subscribe to messages in a room
    subscribeToMessages(roomId, roomType, callback) {
        try {
            const unsubscribe = this.client.onUpdate(
                "messages:getRoomMessages",
                { roomId, roomType },
                callback
            );
            this.subscriptions.push(unsubscribe);
            return unsubscribe;
        } catch (error) {
            console.error("Failed to subscribe to messages:", error);
            throw error;
        }
    }

    // Update user presence (typing status, etc.)
    async updatePresence(isTyping) {
        if (!this.roomId || !this.userId) return;
        
        try {
            await this.client.mutation("presence:updatePresence", {
                roomId: this.roomId,
                userId: this.userId,
                username: this.username,
                avatar: this.avatar,
                isTyping,
                lastActive: Date.now()
            });
        } catch (error) {
            console.error("Failed to update presence:", error);
            throw error;
        }
    }

    // Subscribe to presence updates in a room
    subscribeToPresence(roomId, callback) {
        try {
            const unsubscribe = this.client.onUpdate(
                "presence:getRoomPresence",
                { roomId },
                callback
            );
            this.subscriptions.push(unsubscribe);
            return unsubscribe;
        } catch (error) {
            console.error("Failed to subscribe to presence:", error);
            throw error;
        }
    }

    // Cleanup all subscriptions
    cleanup() {
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions = [];
        this.roomId = null;
    }
}

// Global variable to store the Convex API instance
let convexAPI = null;

// Initialize the Convex API
async function initConvexAPI() {
    try {
        const client = await initConvexClient();
        convexAPI = new ConvexGameAPI(client);
        console.log("Convex API initialized successfully");
        return convexAPI;
    } catch (error) {
        console.error("Failed to initialize Convex API:", error);
        throw error;
    }
} 