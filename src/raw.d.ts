// Vite inlines `?raw` imports as the file's contents at build time.
declare module "*?raw" {
  const content: string;
  export { content as default };
}
