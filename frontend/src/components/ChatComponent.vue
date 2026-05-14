<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useChatStore } from '../stores/chat';

const chatStore = useChatStore();
const messageInput = ref('');
</script>

<template>
  <div class="chat-container">
    <div class="chat-header">
      <h2>Room: {{ chatStore.roomId }}</h2>
      <p>Welcome, {{ chatStore.username }}</p>
    </div>
    
    <div class="chat-messages">
      <div 
        v-for="message in chatStore.messages" 
        :key="message.id"
        class="message"
      >
        <span class="message-username">{{ message.username }}:</span>
        <span class="message-content">{{ message.message }}</span>
        <span class="message-time">{{ message.timestamp.toLocaleTimeString() }}</span>
      </div>
      
      <div v-if="chatStore.typingUsers.length > 0" class="typing-indicator">
        {{ chatStore.typingUsers.join(', ') }} {{ chatStore.typingUsers.length > 1 ? 'are' : 'is' }} typing...
      </div>
    </div>
    
    <div class="chat-input">
      <input
        v-model="messageInput"
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
}

.chat-header {
  background: #007bff;
  color: white;
  padding: 15px 20px;
  border-bottom: 1px solid #ddd;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: white;
}

.message {
  margin-bottom: 15px;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.message-username {
  font-weight: bold;
  color: #007bff;
  margin-right: 10px;
}

.message-content {
  color: #333;
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
</style>