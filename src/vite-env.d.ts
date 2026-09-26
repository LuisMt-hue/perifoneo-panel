/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRACCAR_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const content: React.FC<React.SVGProps<SVGSVGElement>> | string;
  export default content;
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
