/** Injects a <script> once and resolves when it has loaded. */
export function loadScript(src: string, id?: string): Promise<void> {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("loadScript requires a browser environment"));
  }
  if (id && document.getElementById(id)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    if (id) script.id = id;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}