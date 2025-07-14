import { UserData } from '../../backend/Supabase/RegisterUser';

export const handleSendMessage = (
    isConnected: boolean,
    userData: UserData | null,
    chatList: any[],
    addOrUpdateChat: Function,
    navigation: any
  ) => {
    if (!isConnected || !userData) {
      return;
    }
    const conversationId = `convo_${userData.walletAddress}`;
    const avatarSource = userData.avatar === 'default' || !userData.avatar
      ? require('../../assets/images/default-user-avatar.jpg')
      : { uri: userData.avatar };
    const chatExists = chatList.some(chat => chat.id === conversationId);
    if (!chatExists) {
      addOrUpdateChat({
        id: conversationId,
        name: userData.name || 'NodeLink User',
        avatar: avatarSource,
        message: 'Conversation started.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      });
    }
    navigation.navigate('Main');
    navigation.navigate('ChatDetail', {
      conversationId: conversationId,
      name: userData.name || 'NodeLink User',
      avatar: avatarSource,
    });
  };