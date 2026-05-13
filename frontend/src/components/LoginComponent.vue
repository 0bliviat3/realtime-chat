import { defineComponent, ref, onMounted } from 'vue';
import { useChatStore } from '../stores/chat';
import ChatComponent from './ChatComponent.vue';

export default defineComponent({
  name: 'LoginComponent',
  setup() {
    const chatStore = useChatStore();
    const username = ref('');
    const roomId = ref('general');
    
    const handleJoin = () => {
      if (username.value.trim()) {
        chatStore.setUsername(username.value);
        chatStore.setRoomId(roomId.value);
        // Join the room
        chatStore.joinRoom();
      }
    };
    
    return {
      username,
      roomId,
      handleJoin
    };
  },
  components: {
    ChatComponent
  }
});