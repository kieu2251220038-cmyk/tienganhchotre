const http = require('http');

// Local-only bridge for Android Emulator. It is not exposed to the LAN.
const PROXY_HOST = '127.0.0.1';
const PROXY_PORT = 5001;
const BACKEND_HOST = '::1';
const BACKEND_PORT = 5000;

const server = http.createServer((request, response) => {
  const headers = { ...request.headers, host: `localhost:${BACKEND_PORT}` };
  const proxyRequest = http.request(
    {
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      method: request.method,
      path: request.url,
      headers,
      family: 6,
    },
    (proxyResponse) => {
      response.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
      proxyResponse.pipe(response);
    },
  );

  proxyRequest.on('error', (error) => {
    response.statusCode = 502;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({
      message: `Không kết nối được Backend tại localhost:${BACKEND_PORT}: ${error.message}`,
    }));
  });

  request.pipe(proxyRequest);
});

server.listen(PROXY_PORT, PROXY_HOST, () => {
  console.log(`Android API proxy running at http://${PROXY_HOST}:${PROXY_PORT}`);
  console.log(`Forwarding to Backend http://[${BACKEND_HOST}]:${BACKEND_PORT}`);
});
