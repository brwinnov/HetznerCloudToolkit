import { isIP } from 'net';

/** Returns true if the string is a syntactically valid IPv4 or IPv6 address. */
export function isValidIpAddress(ip: string): boolean {
  return isIP(ip) !== 0;
}

/**
 * Returns true if the string is a valid IPv4 or IPv6 CIDR range
 * (e.g. "10.0.0.0/8", "0.0.0.0/0", "::/0", "2a01:4f8::/32").
 */
export function isValidCidr(cidr: string): boolean {
  const slash = cidr.lastIndexOf('/');
  if (slash === -1) return false;
  const addr = cidr.slice(0, slash);
  const prefixStr = cidr.slice(slash + 1);
  if (!/^\d{1,3}$/.test(prefixStr)) return false;
  const prefix = Number(prefixStr);
  const family = isIP(addr);
  if (family === 4) return prefix >= 0 && prefix <= 32;
  if (family === 6) return prefix >= 0 && prefix <= 128;
  return false;
}

/**
 * Hetzner's `public_net.ipv6.ip` is a routed /64 prefix (e.g. "2a01:4f8:1:2::/64"),
 * not a host address. By convention the host is assigned ::1 within that prefix.
 * Returns a connectable host address, or undefined if the input is unusable.
 */
export function ipv6HostFromPrefix(prefixOrIp: string): string | undefined {
  if (isIP(prefixOrIp) === 6) return prefixOrIp; // already a host address
  const slash = prefixOrIp.indexOf('/');
  if (slash === -1) return undefined;
  const base = prefixOrIp.slice(0, slash);
  if (isIP(base) !== 6) return undefined;
  const host = base.endsWith('::') ? `${base}1` : base.endsWith(':') ? `${base}:1` : `${base}::1`;
  return isIP(host) === 6 ? host : undefined;
}
