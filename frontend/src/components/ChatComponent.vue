import { defineComponent, onMounted, ref } from 'vue';
import { useChatStore } from '../stores/chat';

export default defineComponent({
  name: 'ChatComponent',
  setup() {
    const chatStore = useChatStore();
    const messageInput = ref('');
    
    const joinRoom = () => {
      if (chatStore.username && chatStore.roomId) {
        chatStore.joinRoom();
      }
    };
    
    const sendMessage = () => {
      if (messageInput.value.trim()) {
        chatStore.sendMessage(messageInput.value);
        messageInput.value = '';
      }
    };
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    };
    
    onMounted(() => {
      chatStore.initSocketListeners();
    });
    
    return {
      username: chatStore.username,
      roomId: chatStore.roomId,
      messages: chatStore.messages,
      users: chatStore.users,
      messageInput,
      joinRoom,
      sendMessage,
      handleKeyPress
    };
  }
});