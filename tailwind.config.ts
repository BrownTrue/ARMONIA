import type { Config } from "tailwindcss";
export default { content:["./app/**/*.{ts,tsx}","./components/**/*.{ts,tsx}"], theme:{extend:{colors:{ink:"#24352f",sage:{50:"#f4f8f3",100:"#e5efe3",500:"#6c8c70",700:"#46654c"},peach:"#f4ded2"},boxShadow:{soft:"0 12px 35px rgba(43,69,55,.08)"}}}, plugins:[] } satisfies Config;
