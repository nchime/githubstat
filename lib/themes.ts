import type { Theme } from './types';

export const THEMES: Record<string, Theme> = {
  dark: {
    name: 'dark',
    backgroundColor: '#0d1117',
    textColor: '#c9d1d9',
    accentColor: '#58a6ff',
    borderColor: '#30363d',
    successColor: '#3fb950',
  },
  light: {
    name: 'light',
    backgroundColor: '#ffffff',
    textColor: '#24292f',
    accentColor: '#0969da',
    borderColor: '#d0d7de',
    successColor: '#1a7f0e',
  },
  blue: {
    name: 'blue',
    backgroundColor: '#0f172a',
    textColor: '#e2e8f0',
    accentColor: '#3b82f6',
    borderColor: '#1e293b',
    successColor: '#10b981',
  },
  purple: {
    name: 'purple',
    backgroundColor: '#1a0033',
    textColor: '#e9d5ff',
    accentColor: '#c084fc',
    borderColor: '#6b21a8',
    successColor: '#34d399',
  },
  github: {
    name: 'github',
    backgroundColor: '#1f6feb',
    textColor: '#ffffff',
    accentColor: '#79c0ff',
    borderColor: '#3b8bda',
    successColor: '#3fb950',
  },
};

export function getTheme(themeName?: string, customBg?: string, customText?: string): Theme {
  let theme = themeName && themeName in THEMES ? THEMES[themeName] : THEMES.dark;

  if (customBg || customText) {
    return {
      ...theme,
      ...(customBg && { backgroundColor: isValidHexColor(customBg) ? `#${customBg}` : theme.backgroundColor }),
      ...(customText && { textColor: isValidHexColor(customText) ? `#${customText}` : theme.textColor }),
    };
  }

  return theme;
}

function isValidHexColor(color: string): boolean {
  return /^[0-9a-fA-F]{6}$/.test(color);
}
