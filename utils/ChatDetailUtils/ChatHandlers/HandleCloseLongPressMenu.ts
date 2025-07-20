// utils/ChatDetailUtils/closeLongPressMenu.ts

import { ChatDetailHandlerDependencies } from './HandleDependencies';

export const closeLongPressMenu = (
  dependencies: ChatDetailHandlerDependencies
) => {
  const { setMenuVisible, setSelectedMessageForMenu } = dependencies;
  setMenuVisible(false);
  setSelectedMessageForMenu(null);
};