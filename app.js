// Main app logic for Convex Chat Game

// Helper function to check Convex library status
function checkConvexStatus() {
    console.log("Checking Convex library status...");
    if (typeof convex === 'undefined') {
        console.error("DIAGNOSIS: Convex is not defined at app.js execution time");
        // Try to load it one more time
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/convex@1.10.0/dist/browser.bundle.js';
        document.head.appendChild(script);
        return false;
    }
    console.log("DIAGNOSIS: Convex is available at app.js execution time");
    return true;
}

document.addEventListener('DOMContentLoaded', async () => {
    // Check Convex status before trying to initialize
    const convexAvailable = checkConvexStatus();
    if (!convexAvailable) {
        showError("Convex library failed to load. Please refresh the page and try again.");
        console.error("Cannot initialize Convex API because the library is not available");
        return;
    }

    // Initialize Convex API
    try {
        await initConvexAPI();
        console.log("Successfully connected to Convex API");
    } catch (error) {
        const errorMessage = error.message || "Unknown error";
        showError(`Failed to connect to Convex: ${errorMessage}. Please check your connection and credentials.`);
        console.error("Convex initialization error:", error);
        return;
    }

    // DOM Elements
    const screens = {
        welcome: document.getElementById('welcome-screen'),
        waiting: document.getElementById('waiting-room'),
        game: document.getElementById('game-room')
    };

    // Welcome screen elements
    const usernameInput = document.getElementById('username');
    const avatarButtons = document.querySelectorAll('.avatar-btn');
    const createRoomBtn = document.getElementById('create-room-btn');
    const roomIdInput = document.getElementById('room-id');
    const joinRoomBtn = document.getElementById('join-room-btn');

    // Waiting room elements
    const waitingRoomId = document.getElementById('waiting-room-id');
    const waitingPlayersList = document.getElementById('waiting-players');
    const waitingMessageInput = document.getElementById('waiting-message-input');
    const waitingSendBtn = document.getElementById('waiting-send-btn');
    const waitingMessages = document.getElementById('waiting-messages');
    const startGameBtn = document.getElementById('start-game-btn');
    const leaveWaitingBtn = document.getElementById('leave-waiting-btn');

    // Game room elements
    const gameRoomId = document.getElementById('game-room-id');
    const gameBoard = document.getElementById('game-board');
    const onlinePlayers = document.getElementById('online-players');
    const gameMessageInput = document.getElementById('game-message-input');
    const gameSendBtn = document.getElementById('game-send-btn');
    const gameMessages = document.getElementById('game-messages');
    const leaveGameBtn = document.getElementById('leave-game-btn');

    // State
    let selectedAvatar = null;
    let isHost = false;
    let typingTimeout = null;

    // Helper functions
    function showScreen(screenName) {
        Object.keys(screens).forEach(name => {
            screens[name].classList.remove('active');
        });
        screens[screenName].classList.add('active');
    }

    function showError(message) {
        alert(message);
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Avatar selection logic
    avatarButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            avatarButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedAvatar = btn.dataset.emoji;
        });
    });

    // Create Room logic
    createRoomBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        
        if (!username) {
            showError("Please enter a username");
            return;
        }
        
        if (!selectedAvatar) {
            showError("Please select an avatar");
            return;
        }
        
        try {
            // Set user info in the Convex API
            convexAPI.setUserInfo(username, selectedAvatar);
            
            // Create a new room
            const room = await convexAPI.createRoom();
            
            if (!room) {
                showError("Failed to create room. Please try again.");
                return;
            }
            
            // Set host status
            isHost = true;
            
            // Set up waiting room
            waitingRoomId.textContent = convexAPI.roomId;
            
            // Subscribe to room updates
            convexAPI.subscribeToRoom(convexAPI.roomId, handleRoomUpdate);
            
            // Subscribe to waiting room messages
            convexAPI.subscribeToMessages(convexAPI.roomId, "waiting", messages => {
                renderMessages(messages, waitingMessages);
            });
            
            // Subscribe to presence updates
            convexAPI.subscribeToPresence(convexAPI.roomId, handlePresenceUpdate);
            
            // Show waiting room screen
            showScreen('waiting');
            
            // Show/hide start game button based on host status
            startGameBtn.style.display = isHost ? 'block' : 'none';
            
        } catch (error) {
            showError("Failed to create room. Please try again.");
            console.error("Create room error:", error);
        }
    });

    // Join Room logic
    joinRoomBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const roomId = roomIdInput.value.trim();
        
        if (!username) {
            showError("Please enter a username");
            return;
        }
        
        if (!selectedAvatar) {
            showError("Please select an avatar");
            return;
        }
        
        if (!roomId) {
            showError("Please enter a room ID");
            return;
        }
        
        try {
            // Set user info in the Convex API
            convexAPI.setUserInfo(username, selectedAvatar);
            
            // Join the room
            const room = await convexAPI.joinRoom(roomId);
            
            if (!room) {
                showError("Room not found or is no longer available.");
                return;
            }
            
            // Set host status (false when joining)
            isHost = room.players.some(player => 
                player.userId === convexAPI.userId && player.isHost
            );
            
            // Set up waiting room or game room based on room status
            if (room.status === "waiting") {
                // Set up waiting room
                waitingRoomId.textContent = roomId;
                
                // Subscribe to room updates
                convexAPI.subscribeToRoom(roomId, handleRoomUpdate);
                
                // Subscribe to waiting room messages
                convexAPI.subscribeToMessages(roomId, "waiting", messages => {
                    renderMessages(messages, waitingMessages);
                });
                
                // Subscribe to presence updates
                convexAPI.subscribeToPresence(roomId, handlePresenceUpdate);
                
                // Show waiting room screen
                showScreen('waiting');
                
                // Show/hide start game button based on host status
                startGameBtn.style.display = isHost ? 'block' : 'none';
            } else {
                // Set up game room
                gameRoomId.textContent = roomId;
                
                // Subscribe to room updates
                convexAPI.subscribeToRoom(roomId, handleRoomUpdate);
                
                // Subscribe to game room messages
                convexAPI.subscribeToMessages(roomId, "game", messages => {
                    renderMessages(messages, gameMessages);
                });
                
                // Subscribe to presence updates
                convexAPI.subscribeToPresence(roomId, handlePresenceUpdate);
                
                // Show game room screen
                showScreen('game');
            }
            
        } catch (error) {
            showError("Failed to join room. Please try again.");
            console.error("Join room error:", error);
        }
    });

    // Handle room updates
    function handleRoomUpdate(room) {
        if (!room) {
            showError("The room has been closed.");
            handleLeaveRoom();
            return;
        }
        
        // Check if room status changed to playing
        if (room.status === "playing" && screens.waiting.classList.contains('active')) {
            // Move to game room
            gameRoomId.textContent = convexAPI.roomId;
            
            // Subscribe to game room messages
            convexAPI.subscribeToMessages(convexAPI.roomId, "game", messages => {
                renderMessages(messages, gameMessages);
            });
            
            // Show game room screen
            showScreen('game');
        }
        
        // Update players list in waiting room
        if (screens.waiting.classList.contains('active')) {
            updatePlayersList(room.players, waitingPlayersList);
        }
        
        // Update players list in game room
        if (screens.game.classList.contains('active')) {
            updatePlayersList(room.players, onlinePlayers);
        }
    }

    // Handle presence updates
    function handlePresenceUpdate(presenceData) {
        // Handle typing indicators
        if (screens.waiting.classList.contains('active')) {
            updateTypingIndicator(presenceData, 'waiting');
        } else if (screens.game.classList.contains('active')) {
            updateTypingIndicator(presenceData, 'game');
        }
    }

    // Update typing indicator
    function updateTypingIndicator(presenceData, roomType) {
        const container = roomType === 'waiting' ? waitingMessages : gameMessages;
        
        // Remove any existing typing indicators
        const existingIndicators = container.querySelectorAll('.typing-indicator');
        existingIndicators.forEach(indicator => indicator.remove());
        
        // Find users who are typing (except current user)
        const typingUsers = presenceData
            .filter(presence => 
                presence.userId !== convexAPI.userId && 
                presence.isTyping && 
                Date.now() - presence.lastActive < 10000 // Only show for active users (last 10 seconds)
            )
            .map(presence => presence.username);
        
        if (typingUsers.length > 0) {
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'typing-indicator';
            
            if (typingUsers.length === 1) {
                typingIndicator.textContent = `${typingUsers[0]} is typing...`;
            } else if (typingUsers.length === 2) {
                typingIndicator.textContent = `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
            } else {
                typingIndicator.textContent = `Multiple people are typing...`;
            }
            
            container.appendChild(typingIndicator);
            
            // Scroll to bottom
            container.scrollTop = container.scrollHeight;
        }
    }

    // Update players list
    function updatePlayersList(players, listElement) {
        listElement.innerHTML = '';
        
        players.forEach(player => {
            const li = document.createElement('li');
            
            // Create avatar span
            const avatarSpan = document.createElement('span');
            avatarSpan.textContent = player.avatar;
            li.appendChild(avatarSpan);
            
            // Create username text
            const usernameText = document.createTextNode(player.username);
            li.appendChild(usernameText);
            
            // Add host indicator if player is host
            if (player.isHost) {
                const hostBadge = document.createElement('span');
                hostBadge.textContent = ' (Host)';
                hostBadge.style.color = '#667eea';
                hostBadge.style.fontWeight = 'bold';
                li.appendChild(hostBadge);
            }
            
            // Highlight current user
            if (player.userId === convexAPI.userId) {
                li.style.border = '2px solid #667eea';
            }
            
            listElement.appendChild(li);
        });
    }

    // Render messages
    function renderMessages(messages, container) {
        container.innerHTML = '';
        
        if (!messages || !messages.length) return;
        
        messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            
            // Add sent/received class
            if (msg.userId === convexAPI.userId) {
                messageDiv.classList.add('sent');
            } else {
                messageDiv.classList.add('received');
            }
            
            // Create message info div (avatar, sender, time)
            const messageInfoDiv = document.createElement('div');
            messageInfoDiv.className = 'message-info';
            
            // Add avatar
            const avatarSpan = document.createElement('span');
            avatarSpan.className = 'message-avatar';
            avatarSpan.textContent = msg.avatar;
            messageInfoDiv.appendChild(avatarSpan);
            
            // Add sender name
            const senderSpan = document.createElement('span');
            senderSpan.className = 'message-sender';
            senderSpan.textContent = msg.username;
            messageInfoDiv.appendChild(senderSpan);
            
            // Add timestamp
            const timeSpan = document.createElement('span');
            timeSpan.className = 'message-time';
            timeSpan.textContent = formatTime(msg._creationTime);
            messageInfoDiv.appendChild(timeSpan);
            
            messageDiv.appendChild(messageInfoDiv);
            
            // Add message content
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = msg.message;
            messageDiv.appendChild(contentDiv);
            
            container.appendChild(messageDiv);
        });
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    // Start game logic
    startGameBtn.addEventListener('click', async () => {
        if (!isHost) {
            showError("Only the host can start the game");
            return;
        }
        
        try {
            await convexAPI.startGame();
        } catch (error) {
            showError("Failed to start game. Please try again.");
            console.error("Start game error:", error);
        }
    });

    // Waiting room chat
    waitingMessageInput.addEventListener('input', () => {
        // Update typing status
        if (waitingMessageInput.value.trim() !== '') {
            convexAPI.updatePresence(true);
            
            // Clear typing timeout if it exists
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
            
            // Set timeout to clear typing status after 2 seconds
            typingTimeout = setTimeout(() => {
                convexAPI.updatePresence(false);
                typingTimeout = null;
            }, 2000);
        } else {
            convexAPI.updatePresence(false);
            
            if (typingTimeout) {
                clearTimeout(typingTimeout);
                typingTimeout = null;
            }
        }
    });

    waitingSendBtn.addEventListener('click', sendWaitingMessage);
    
    waitingMessageInput.addEventListener('keypress', event => {
        if (event.key === 'Enter') {
            sendWaitingMessage();
        }
    });

    function sendWaitingMessage() {
        const message = waitingMessageInput.value.trim();
        
        if (!message) return;
        
        convexAPI.sendMessage(message, "waiting");
        waitingMessageInput.value = '';
        
        // Clear typing status
        convexAPI.updatePresence(false);
        
        if (typingTimeout) {
            clearTimeout(typingTimeout);
            typingTimeout = null;
        }
    }

    // Game room chat
    gameMessageInput.addEventListener('input', () => {
        // Update typing status
        if (gameMessageInput.value.trim() !== '') {
            convexAPI.updatePresence(true);
            
            // Clear typing timeout if it exists
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
            
            // Set timeout to clear typing status after 2 seconds
            typingTimeout = setTimeout(() => {
                convexAPI.updatePresence(false);
                typingTimeout = null;
            }, 2000);
        } else {
            convexAPI.updatePresence(false);
            
            if (typingTimeout) {
                clearTimeout(typingTimeout);
                typingTimeout = null;
            }
        }
    });

    gameSendBtn.addEventListener('click', sendGameMessage);
    
    gameMessageInput.addEventListener('keypress', event => {
        if (event.key === 'Enter') {
            sendGameMessage();
        }
    });

    function sendGameMessage() {
        const message = gameMessageInput.value.trim();
        
        if (!message) return;
        
        convexAPI.sendMessage(message, "game");
        gameMessageInput.value = '';
        
        // Clear typing status
        convexAPI.updatePresence(false);
        
        if (typingTimeout) {
            clearTimeout(typingTimeout);
            typingTimeout = null;
        }
    }

    // Leave room logic
    leaveWaitingBtn.addEventListener('click', handleLeaveRoom);
    leaveGameBtn.addEventListener('click', handleLeaveRoom);

    async function handleLeaveRoom() {
        try {
            // Clean up subscriptions
            convexAPI.cleanup();
            
            // Leave the room on the server
            await convexAPI.leaveRoom();
            
            // Go back to welcome screen
            showScreen('welcome');
            
            // Clear input fields
            waitingMessageInput.value = '';
            gameMessageInput.value = '';
            
        } catch (error) {
            console.error("Error leaving room:", error);
        }
    }

    // Handle window close/refresh
    window.addEventListener('beforeunload', () => {
        // Attempt to leave room when closing
        if (convexAPI && convexAPI.roomId) {
            convexAPI.leaveRoom();
        }
    });
}); 