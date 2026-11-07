import http from 'http';

const server = http.createServer((req, res) => {
  const targetUrl = 'http://localhost:5173' + req.url;
  res.writeHead(302, { Location: targetUrl });
  res.end(`Redirecting to ${targetUrl}`);
});

server.listen(5174, '0.0.0.0', () => {
  console.log('Redirect service listening on http://localhost:5174 -> http://localhost:5173');
});
