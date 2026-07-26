const DEFAULT_ALLOWED_HOSTS = ['localhost', '127.0.0.1'];

export function getAllowedServiceBagHosts(envValue = process.env.NASSIST_ALLOWED_SERVICEBAG_HOSTS): string[] {
  const configured = (envValue ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set([...DEFAULT_ALLOWED_HOSTS, ...configured])];
}

export function validateServiceBagUrl(value: string, allowedHosts = getAllowedServiceBagHosts()): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Adresse ServiceBag invalide.');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Seules les adresses HTTP ou HTTPS sont autorisées.');
  }

  const hostname = url.hostname.toLowerCase();
  const authorized = allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  if (!authorized) {
    throw new Error(`Domaine non autorisé : ${hostname}. Configurez NASSIST_ALLOWED_SERVICEBAG_HOSTS.`);
  }

  url.username = '';
  url.password = '';
  return url.toString();
}
