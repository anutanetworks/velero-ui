
export function getBaseUrl() {
  const { protocol, hostname, port, pathname } = window.location;
  const baseUrl = `${protocol}//${hostname}${port ? ':' + port : ''}`;
  const scriptName = pathname.substring(0, pathname.lastIndexOf("/"));
  return baseUrl + scriptName;
}

