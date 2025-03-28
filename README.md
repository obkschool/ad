# Convex Chat Game

A real-time multiplayer chat game platform using Convex for presence, chat, and room management.

## Features

- **Create or Join Rooms**: Generate a unique room ID or join an existing one
- **Waiting Room**: Chat with other players before starting the game
- **Game Room**: Continue chatting while playing together
- **Real-time Presence**: See who's online and who's typing
- **Avatar Selection**: Choose an emoji avatar to represent yourself
- **Room Management**: Room creator is designated as host with ability to start the game

## Technologies Used

- HTML5, CSS3, and JavaScript for the frontend
- Convex for the backend (real-time database and API)

## Convex Configuration

This project uses Convex for backend functionality. The following Convex endpoints are used:

- Dev URL: https://adorable-spider-894.convex.cloud
- HTTP Actions URL: https://adorable-spider-894.convex.site
- Auth Token: dev:adorable-spider-894|eyJ2MiI6ImU4MTRmYTlhODUxOTQzNjM4YWFiMGFjODkwZDc5YmY2In0=

Make sure to update the `CONVEX_URL` and `CONVEX_AUTH_TOKEN` variables in `convex-client.js` with your own deployment credentials.

## How to Use

1. Open `index.html` in your browser
2. Enter a username and select an avatar
3. Create a new room or join an existing one using a room ID
4. In the waiting room, chat with other players
5. The host can start the game when ready
6. In the game room, continue chatting while playing

## Setting up for Development

1. Clone this repository
2. Set up a Convex project by following the instructions in `convex-setup.md`
3. Update the URL and authentication token in `convex-client.js` with your Convex deployment credentials
4. Open `index.html` in your browser or use a local server

## Troubleshooting Connection Issues

If you see "Failed to connect to Convex" errors:

1. Check that your Convex server is running correctly at the URL specified in `convex-client.js`
2. Ensure you've included the correct authentication token
3. Verify that you've set up the required Convex backend schema and functions as described in `convex-setup.md`
4. Check the browser console for specific error messages
5. Make sure you're not being blocked by CORS policies if testing locally

## Deployment

To deploy this application:

1. Host the HTML, CSS, and JavaScript files on a web server
2. Ensure the Convex project is properly configured
3. No additional backend setup is needed as Convex handles all the server-side functionality

## Extending the Game

The current implementation includes the chat and presence functionality. To build an actual game:

1. Modify the `game-board` section in `index.html`
2. Add game-specific logic in `app.js`
3. Create additional Convex functions to handle game state

## License

MIT 