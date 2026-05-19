/**
 * Whitelist de dominios permitidos para redirección post-compra.
 * Previene ataques de Open Redirect.
 */
const ALLOWED_DOMAINS = [
  'localhost:3000',
  'localhost:7001',
  // Añadir aquí dominios de producción en el futuro
];

/**
 * Valida si una URL es segura para redirección.
 */
export function isValidRedirect(url: string | null): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    // Verificar si el host:puerto está en la whitelist
    return ALLOWED_DOMAINS.includes(parsed.host);
  } catch {
    // Si no es una URL válida (ej: path relativo), chequeamos si empieza con /
    return url.startsWith('/');
  }
}
