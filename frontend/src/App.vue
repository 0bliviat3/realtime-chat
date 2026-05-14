<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useChatStore } from '../stores/chat';
import LoginComponent from './components/LoginComponent.vue';
import ChatComponent from './components/ChatComponent.vue';

const chatStore = useChatStore();
const showChat = ref(false);

onMounted(() => {
  chatStore.initSocketListeners();
});

// Check if user is authenticated
if (chatStore.username && chatStore.roomId) {
  showChat.value = true;
} else {
  showChat.value = false;
}
</script>

<template>
  <div class="app-container">
    <h1>Realtime Chat</h1>
    <div v-if="!showChat">
      <LoginComponent />
    </div>
    <div v-else>
      <ChatComponent />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
</style>