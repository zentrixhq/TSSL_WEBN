/// <reference types="vite/client" />

interface Window {
  LiveChatWidget?: {
    call: (method: string, ...args: any[]) => void;
    on: (event: string, callback: (...args: any[]) => void) => void;
    once: (event: string, callback: (...args: any[]) => void) => void;
    off: (event: string, callback: (...args: any[]) => void) => void;
    get: (property: string) => any;
  };
  __lc?: any;
}
