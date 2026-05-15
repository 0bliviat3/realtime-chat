# Realtime Chat Application - Implementation Details

## Project Structure

```
realtime-chat/
├── backend/                 # Server-side application
│   ├── src/
│   │   ├── controllers/     # HTTP controllers
│   │   ├── services/        # Business logic
│   │   ├── repositories/  # Data access layer
│   │   ├── socket/          # Socket.IO event handlers
│   │   ├── models/          # Data models
│   │   ├── middleware/      # Request middleware
│   │   └── server.ts        # Main server entrypoint
│   └── package.json
├── frontend/                # Client-side application
│   ├── src/
│   │   ├── components/      # Vue components
│   │   ├── views/           # Page components  
│   │   ├── stores/          # Pinia stores
│   │   ├── socket/          # Socket connection and events
│   │   └── main.ts          # Main application entrypoint
│   └── package.json
├── docker-compose.yml       # Docker orchestration
├── Dockerfile.backend       # Backend Dockerfile
└── Dockerfile.frontend      # Frontend Dockerfile
```

## Frontend Architecture

### Components
- `LoginComponent.vue`: Handles user authentication and room selection
- `ChatComponent.vue`: Main chat interface with messaging and user management
- `App.vue`: Central routing and session restoration logic

### Stores
- `chat.ts`: Pinia store managing application state and localStorage integration

### Socket Handling
- `socket/index.ts`: Socket connection and event management

## Backend Architecture

### Socket Handlers
- `socket/roomHandler.ts`: Room join/leave event handling
- `socket/chatHandler.ts`: Chat message sending/receiving
- `socket/userHandler.ts`: User typing indicators and presence management

## Socket Events Specification

### Room Events
- `room:join` - Join a chat room
  - Payload: `{ username: string, roomId: string }`
  - Response: `user:join` or `user:leave`

- `room:leave` - Leave a chat room  
  - Payload: `{ roomId: string }`
  - Response: `user:leave` to other users in room

### Chat Events  
- `chat:send` - Send a chat message
  - Payload: `{ message: string, roomId: string }`
  - Response: `chat:receive` to all room members

- `chat:receive` - Receive a chat message
  - Payload: `{ id: string, userId: string, username: string, message: string, timestamp: string, roomId: string }`

### User Events
- `user:typing` - Indicate user is typing
  - Payload: `{ isTyping: boolean, roomId: string }`
  - Response: `user:typing` to other users in room

### System Events
- `system:message` - System notifications (join/leave)
  - Payload: `{ message: string, timestamp: string }`

## Socket Payload Examples

### Room Join
```json
{
  "username": "john_doe",
  "roomId": "general"
}
```

### Chat Message
```json
{
  "message": "Hello everyone!",
  "roomId": "general"
}
```

### Typing Indicator
```json
{
  "isTyping": true,
  "roomId": "general"
}
```

## Room State Flow

1. **User Initiation**: User opens application
2. **Session Restoration**: Check localStorage for saved session
3. **Room Join**: Emit `room:join` with user credentials
4. **User List Update**: Receive `user:list` with current users
5. **Chat Interaction**: 
   - Send messages via `chat:send`
   - Receive messages via `chat:receive`
6. **Room Leave**: Emit `room:leave` when user leaves
7. **Cleanup**: Remove user from room, notify others

## Reconnect Flow

1. **Connection Loss**: Client detects socket disconnection
2. **Reconnect Attempt**: Automatic reconnection to server  
3. **State Restoration**: 
   - Restore user session from localStorage
   - Rejoin room with stored credentials
4. **User Presence**: Notify room of reconnection
5. **Message Sync**: Request missed messages if needed

## LocalStorage Session Flow

### Session Storage
- `chat_username`: Stored username for automatic relogin
- `chat_roomId`: Stored room ID for automatic rejoin

### Storage Operations
1. **Save Session**: `saveToStorage()` - Stores username and roomId
2. **Restore Session**: `restoreFromStorage()` - Loads from localStorage 
3. **Clear Session**: `clearStorage()` - Removes stored credentials

### Lifecycle
- On login: Save session data to localStorage
- On app start: Check for existing session, restore if found
- On logout: Clear localStorage data
- On room leave: Clear session data

## Typing Indicator Flow

### Client-Side
1. **Input Detection**: User types in message input
2. **Debounce Logic**: Trigger typing event after 1000ms idle
3. **Socket Emission**: Emit `user:typing` with `isTyping: true`
4. **Timeout Management**: After 1000ms idle, send `isTyping: false`

### Server-Side
1. **Event Reception**: Receive `user:typing` event
2. **Broadcast**: Send `user:typing` to all room members
3. **State Update**: Update typing user list in room

### Visualization
- Display "user(s) are typing..." in chat interface
- Clear typing indicators after timeout

## Pinia Store State Structure

### State Properties
```typescript
{
  username: '',           // Current user's name
  roomId: '',             // Current room ID
  messages: [],           // Chat message history
  users: [],             // Online users in room
  isTyping: false,       // Current typing state
  typingUsers: []        // Users currently typing
}
```

### Actions
- `setUsername(username: string)` - Sets user identifier
- `setRoomId(roomId: string)` - Sets active room
- `joinRoom()` - Join current room via socket
- `leaveRoom()` - Leave room via socket
- `sendMessage(message: string)` - Send message
- `startTyping()` - Begin typing indicator
- `stopTyping()` - End typing indicator
- `restoreFromStorage()` - Load session from localStorage
- `saveToStorage()` - Save session to localStorage
- `clearStorage()` - Clear session data
- `initSocketListeners()` - Setup event handlers

## Docker Execution Flow

### Docker Compose
1. **Build Phase**: Build backend and frontend images
2. **Network Creation**: Create isolated network for containers
3. **Service Startup**: 
   - Start backend container (port 3000)
   - Start frontend container (port 5173)
4. **Container Linking**: Expose ports to host machine

### Container Commands
```bash
# Build and run all services
docker compose up -d

# View container logs
docker compose logs -f

# Stop services
docker compose down
```

## Known Issues

1. **Memory Leak Potential**: Typing timeout cleanup could be improved
2. **Race Conditions**: Concurrent room joins/leaves may have edge cases
3. **Reconnect Storm**: Rapid reconnect attempts could overwhelm server
4. **Storage Limits**: Large message histories in localStorage may cause issues

## Future STEP3 Expansion Points

### Database Integration
- Replace localStorage with SQLite/MySQL for persistent sessions
- Store chat history in database
- Support message archiving and retrieval

### Advanced Features
- Message search capabilities
- Emoji and file attachment support
- Private messaging between users
- User profile management

### Enhanced Reconnect Handling
- Implement backoff strategies for reconnect attempts
- Add message queue for unsent messages
- Improve state synchronization during reconnection

### Performance Optimizations
- Implement message pagination for large rooms
- Add WebSocket compression
- Optimize user list display for large groups

### Security Enhancements
- Add authentication tokens
- Implement rate limiting for socket events
- Add data encryption for sensitive communications

### Scalability Improvements
- Add Redis for distributed session management
- Implement load balancing for multiple servers
- Add message queuing system for high volume scenarios

## Testing Coverage

### Unit Tests
- Socket event handling verification
- Store state management tests
- Component rendering validation

### Integration Tests
- Cross-tab synchronization validation
- Session persistence testing
- Room join/leave flow verification

### End-to-End Tests
- Multi-browser tab scenario testing
- F5 refresh state recovery validation
- Logout/room leave process confirmation

## Deployment Considerations

### Production Requirements
- Secure WebSocket connections (wss://)
- Proper logging and monitoring
- Environment-specific configuration
- Resource limits for containers

### Scaling Patterns
- Horizontal scaling of backend containers
- Database connection pooling
- CDN for static assets
- Load balancer for client connections