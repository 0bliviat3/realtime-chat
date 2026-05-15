<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { socket } from '../socket';
import { useChatStore } from '../stores/chat';
import { useUserStore } from '../stores/user';
import { storeToRefs } from 'pinia';

const chatStore = useChatStore();
const userStore = useUserStore();
const { currentUser } = storeToRefs(userStore);
const { currentRoomId, messages } = storeToRefs(chatStore);

const messageInput = ref('');
const isTyping = ref(false);
const typingTimeout = ref<NodeJS.Timeout | null>(null);
const roomHistoryLoaded = ref(false);

const sendMessage = () => {
  if (messageInput.value.trim() && chatStore.roomId) {
    socket.emit('chat:send', {
      message: messageInput.value,
      roomId: chatStore.roomId
    });
    messageInput.value = '';
  }
};

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    sendMessage();
  }
};

const handleInput = () => {
  // Start typing indicator
  if (!isTyping.value) {
    isTyping.value = true;
    socket.emit('user:typing', { 
      isTyping: true, 
      roomId: chatStore.roomId 
    });
  }
  
  // Clear previous timeout
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value);
  }
  
  // Set up timeout to stop typing
  typingTimeout.value = setTimeout(() => {
    isTyping.value = false;
    socket.emit('user:typing', { 
      isTyping: false, 
      roomId: chatStore.roomId 
    });
  }, 1000); // Stop typing after 1 second of inactivity
};

const handleLeaveRoom = () => {
  // Leave the room
  if (chatStore.roomId) {
    socket.emit('room:leave', { roomId: chatStore.roomId });
    chatStore.setCurrentRoom(null);
  }
};

// Load room history when joined
const loadRoomHistory = () => {
  if (chatStore.roomId && !roomHistoryLoaded.value) {
    socket.emit('room:history', { roomId: chatStore.roomId });
    roomHistoryLoaded.value = true;
  }
};

// Socket event handlers
socket.on('chat:receive', (message) => {
  chatStore.appendMessage(message);
});

socket.on('room:history', (messages) => {
  // Handle room history received
  chatStore.setMessages(messages);
});

socket.on('user:join', ({ user, timestamp }) => {
  chatStore.addUserToList(user);
});

socket.on('user:leave', ({ user, timestamp }) => {
  chatStore.removeUserFromList(user);
});

socket.on('user:typing', ({ username, isTyping }) => {
  if (isTyping) {
    chatStore.addTypingUser(username);
  } else {
    chatStore.removeTypingUser(username);
  }
});

socket.on('system:message', ({ message, timestamp }) => {
  chatStore.appendMessage({
    id: Date.now().toString(),
    userId: '',
    username: 'System',
    message,
    timestamp,
    roomId: chatStore.roomId || ''
  });
});

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// Load history when room is joined
onMounted(() => {
  if (chatStore.roomId) {
    loadRoomHistory();
  }
});

// Cleanup socket listeners on unmount
onUnmounted(() => {
  socket.off('chat:receive');
  socket.off('room:history');
  socket.off('user:join');
  socket.off('user:leave');
  socket.off('user:typing');
  socket.off('system:message');
  socket.off('connect');
  socket.off('disconnect');
  
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value);
  }
});
</script>

<template>
  <div class="chat-container">
    <div class="chat-header">
      <h2>Room: {{ chatStore.roomId }}</h2>
      <p>Welcome, {{ chatStore.username }}</p>
      <button @click="handleLeaveRoom" class="btn-leave-room">Leave Room</button>
    </div>
    
    <div class="chat-content">
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>Online Users ({{ chatStore.users.length }})</h3>
        </div>
        <div class="user-list">
          <div 
            v-for="user in chatStore.users" 
            :key="user.id"
            :class="['user-item', { 'current-user': user.username === chatStore.username }]"
          >
            <span>{{ user.username }}</span>
            <span v-if="user.username === chatStore.username" class="me-badge">(me)</span>
          </div>
        </div>
      </div>
      
      <div class="chat-messages">
        <div 
          v-for="message in chatStore.messages" 
          :key="message.id"
          class="message"
        >
          <span class="message-username">{{ message.username }}:</span>
          <span class="message-content">{{ message.message }}</span>
          <span class="message-time">{{ new Date(message.timestamp).toLocaleTimeString() }}</span>
        </div>
        
        <div v-if="chatStore.typingUsers.length > 0" class="typing-indicator">
          {{ chatStore.typingUsers.join(', ') }} {{ chatStore.typingUsers.length > 1 ? 'are' : 'is' }} typing...
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <input
        v-model="messageInput"
        @input="handleInput"
        @keypress="handleKeyPress"
        placeholder="Type your message..."
        class="input-field"
      />
      <button @click="sendMessage" class="btn-send">Send</button>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
  position: relative;
}

.chat-header {
  background: #007bff;
  color: white;
  padding: 15px 20px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-toggle-sidebar {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-toggle-sidebar:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chat-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 250px;
  background: white;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 140px);
}

.sidebar-header {
  padding: 15px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.user-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.user-item {
  padding: 8px 10px;
  margin-bottom: 5px;
  border-radius: 4px;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-item.current-user {
  background: #007bff;
  color: white;
}

.me-badge {
  font-size: 12px;
  background: #28a745;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 5px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: white;
  display: flex;
  flex-direction: column;
}

.message {
  margin-bottom: 15px;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 5px;
}

.message-username {
  font-weight: bold;
  color: #007bff;
  margin-right: 10px;
}

.message-content {
  color: #333;
  flex: 1;
}

.message-time {
  color: #999;
  font-size: 0.8em;
  margin-left: 10px;
}

.typing-indicator {
  color: #999;
  font-style: italic;
  padding: 10px 0;
}

.chat-input {
  display: flex;
  padding: 15px;
  background: white;
  border-top: 1px solid #ddd;
}

.input-field {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 10px;
  font-size: 16px;
}

.btn-send {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-send:hover {
  background-color: #218838;
}

/* Responsive design */
@media (max-width: 768px) {
  .sidebar {
    width: 0;
    transition: width 0.3s ease;
  }
  
  .sidebar.open {
    width: 250px;
  }
}
</style>