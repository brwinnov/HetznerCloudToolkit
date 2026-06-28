/** Returns true if the string is a syntactically valid IPv4 or IPv6 address. */
export function isValidIpAddress(ip: string): boolean {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4.test(ip)) {
    return ip.split('.').every((part) => Number(part) >= 0 && Number(part) <= 255);
  }

  // Reasonably strict IPv6 check — full segments or :: compression, hex only.
  const ipv6 = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  return ipv6.test(ip) && !ip.includes(':::');
}
