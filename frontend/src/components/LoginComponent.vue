<script setup lang="ts">
import { ref } from 'vue';
import { useChatStore } from '../stores/chat';

const chatStore = useChatStore();
const username = ref('');
const roomId = ref('general');

const handleJoin = () => {
  if (username.value.trim()) {
    chatStore.setUsername(username.value);
    chatStore.setRoomId(roomId.value);
    // Save to localStorage
    chatStore.saveToStorage();
    // Join the room
    chatStore.joinRoom();
  }
};
</script>

<template>
  <div class="login-container">
    <h2>Join Chat</h2>
    <div class="form-group">
      <input 
        v-model="username" 
        type="text" 
        placeholder="Enter your username" 
        class="input-field"
      />
    </div>
    <div class="form-group">
      <input 
        v-model="roomId" 
        type="text" 
        placeholder="Enter room ID (default: general)" 
        class="input-field"
      />
    </div>
    <button @click="handleJoin" class="btn-primary">Join Room</button>
  </div>
</template>

<style scoped>
.login-container {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.input-field {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.btn-primary:hover {
  background-color: #0056b3;
}
</style>
