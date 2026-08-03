/**
 * 图标组件：读取 assets/ 导出的 PNG 图标（用户从 Pencil 导出）。
 *
 * 命名规范（kebab-case）：
 * - 功能图标：icon-<语义>.png（icon-ai / icon-camera / icon-mic / icon-send ...）
 * - Tab 图标：tab-<key>.png + tab-<key>-active.png（key: stack/chat/notes/more）
 * 缺失图标（icon-close / icon-chevron / icon-search / icon-embassy / icon-help、
 * tab-chat-active 等）暂由调用方占位，待补充导出。
 */
import React from 'react';
import { Image } from 'react-native';

const ICONS = {
  ai: require('../../assets/icon-ai.png'),
  camera: require('../../assets/icon-camera.png'),
  gps: require('../../assets/icon-gps.png'),
  mic: require('../../assets/icon-mic.png'),
  play: require('../../assets/icon-play.png'),
  playSmall: require('../../assets/icon-play-small.png'),
  send: require('../../assets/icon-send.png'),
  switch: require('../../assets/icon-switch.png'),
  tabStack: require('../../assets/tab-stack.png'),
  tabStackActive: require('../../assets/tab-stack-active.png'),
  tabChat: require('../../assets/tab-chat.png'),
  // tab-chat-active 待补充导出，暂用 tab-chat
  tabChatActive: require('../../assets/tab-chat.png'),
  tabNotes: require('../../assets/tab-notes.png'),
  tabNotesActive: require('../../assets/tab-notes-active.png'),
  tabMore: require('../../assets/tab-more.png'),
  tabMoreActive: require('../../assets/tab-more-active.png'),
} as const;

export type AppIconName = keyof typeof ICONS;

interface AppIconProps {
  name: AppIconName;
  size?: number;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, size = 20 }) => (
  <Image source={ICONS[name]} style={{ width: size, height: size }} resizeMode="contain" />
);
