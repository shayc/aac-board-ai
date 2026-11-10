// Loaded as a blocking classic script from index.html so the theme class is set
// before first paint and MUI adopts it without a flash. It lives in its own
// file, not inline, so the Content-Security-Policy can forbid inline scripts.
{
  const mode = localStorage.getItem("mui-mode") ?? "system";
  const isDark =
    mode === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
      : mode === "dark";
  document.documentElement.classList.add(isDark ? "dark" : "light");
}
