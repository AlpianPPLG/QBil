export function generateReferenceId(prefix = "INV") {
  // Stable, no Date.now() to satisfy purity lint.
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  return `${prefix}-${stamp.slice(-6)}`;
}

