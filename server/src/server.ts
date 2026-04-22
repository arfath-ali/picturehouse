import http, { IncomingMessage, ServerResponse } from 'node:http';

const PORT = process.env.PORT;

const server = http.createServer(
  (req: IncomingMessage, res: ServerResponse) => {
    if (process.env.NODE_ENV === 'production') {
      const origin = req.headers.origin;
      const allowedOrigin = process.env.FRONTEND_URL;

      if (origin && origin === allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
    }
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
  },
);

server.listen(PORT, () => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`CineHub is live at: http://localhost:${PORT}`);
  }
});
