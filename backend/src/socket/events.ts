// Define all socket events here
export const SOCKET_EVENTS = {
  // Chat events
  CHAT_SEND: 'chat:send',
  CHAT_RECEIVE: 'chat:receive',
  
  // Room events
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  
  // User events
  USER_LIST: 'user:list',
  USER_JOIN: 'user:join',
  USER_LEAVE: 'user:leave',
  USER_TYPING: 'user:typing',
  USER_DISCONNECT: 'user:disconnect',
  
  // System events
  SYSTEM_MESSAGE: 'system:message'
};

export const SYSTEM_MESSAGES = {
  JOIN: 'joined',
  LEAVE: 'left'
};