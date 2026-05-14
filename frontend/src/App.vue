<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useChatStore } from './stores/chat';
import LoginComponent from './components/LoginComponent.vue';
import ChatComponent from './components/ChatComponent.vue';

const chatStore = useChatStore();

// Reactive computed property for showing chat component
const showChat = computed(() => !!(chatStore.username && chatStore.roomId));

onMounted(() => {
  // Try to restore saved session
  const restored = chatStore.restoreFromStorage();
  if (restored) {
    // Rejoin room on restore
    chatStore.joinRoom();
  }
  
  chatStore.initSocketListeners();
});
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