# Realtime Chat Application

A scalable, real-time chat application built with modern web technologies.

## Features Implemented (Step 1)

✅ Basic real-time chat functionality  
✅ Socket.IO integration  
✅ Room-based messaging  
✅ User nickname system  
✅ System messages (join/leave)  
✅ Responsive frontend UI  

## Features Implemented (Step 2)

✅ Multi-room support  
✅ Session persistence with localStorage  
✅ Typing indicators with debouncing  
✅ Cross-tab synchronization  
✅ Refresh state recovery  

## Architecture

### Backend
- Node.js 22 with Express
- Socket.IO for real-time communication
- TypeScript for type safety
- Modular architecture (controllers, services, socket handlers)

### Frontend  
- Vue 3 with Vite
- Pinia for state management
- Socket.IO client for real-time communication
- TypeScript for type safety

## Technologies Used

### Backend
- Express.js
- Socket.IO
- TypeScript
- pnpm

### Frontend
- Vue 3
- Vite
- Pinia
- TypeScript
- Socket.IO Client

### Infrastructure
- Docker & Docker Compose

## Getting Started

### Prerequisites
- Node.js 22+
- pnpm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend && pnpm install
   cd ../frontend && pnpm install
   ```

### Running the Application

#### Development Mode
```bash
# Start backend
cd backend && pnpm run dev

# Start frontend  
cd frontend && pnpm run dev
```

#### Docker Mode
```bash
docker compose up -d
```

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # HTTP controllers
│   ├── services/        # Business logic
│   ├── repositories/    # Data access layer
│   ├── socket/         # Socket.IO event handlers
│   ├── models/         # Data models
│   ├── middleware/     # Request middleware
│   ├── utils/          # Utility functions
│   └── server.ts       # Main server entrypoint
└── package.json

frontend/
├── src/
│   ├── components/     # Vue components
│   ├── views/         # Page components  
│   ├── stores/        # Pinia stores
│   ├── socket/        # Socket connection and events
│   ├── utils/         # Utility functions
│   └── main.ts        # Main application entrypoint
└── package.json
```

## Socket Events

### Room Events
- `room:join` - Join a chat room
- `room:leave` - Leave a chat room

### Chat Events  
- `chat:send` - Send a chat message
- `chat:receive` - Receive a chat message

### User Events
- `user:typing` - Indicate user is typing

### System Events
- `system:message` - System notifications (join/leave)

## Development Roadmap

### Step 1: Basic Chat Functionality
✅ Completed

### Step 2: Multi-room Support
✅ Completed

### Step 3: Database Integration
⏳ Not Started

### Step 4: Reconnect Handling
⏳ Not Started

### Step 5: Advanced Features
⏳ Not Started

### Step 6: Docker Configuration
✅ Completed

### Step 7: Redis Extension
⏳ Not Started

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a pull request

## License

MIT