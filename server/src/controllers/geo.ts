import type { ServerResponse } from 'node:http';
import type { IncomingMessage } from 'node:http';

export async function getGeoLocation(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    const headerValue = req.headers['x-vercel-ip-country'];
    const countryCode = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue || 'IN';

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        countryCode: countryCode.toUpperCase(),
      }),
    );
  } catch (error) {
    console.error('Error inside getGeoLocation controller:', error);

    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify('Internal Server Error'));
  }
}
