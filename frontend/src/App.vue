import { defineComponent, onMounted, ref } from 'vue';
import { useChatStore } from '../stores/chat';
import LoginComponent from './components/LoginComponent.vue';
import ChatComponent from './components/ChatComponent.vue';

export default defineComponent({
  name: 'App',
  components: {
    LoginComponent,
    ChatComponent
  },
  setup() {
    const chatStore = useChatStore();
    const showChat = ref(false);
    
    onMounted(() => {
      chatStore.initSocketListeners();
    });
    
    return {
      showChat,
      chatStore
    };
  }
});