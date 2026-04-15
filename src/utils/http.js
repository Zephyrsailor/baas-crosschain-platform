const MAX_BODY_SIZE = 1024 * 1024;

export function json(res, code, data) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

export async function parseJson(req, options = {}) {
  const maxBodySize = options.maxBodySize ?? MAX_BODY_SIZE;
  const chunks = [];
  let totalSize = 0;

  for await (const c of req) {
    totalSize += c.length;
    if (totalSize > maxBodySize) {
      const err = new Error('payload too large');
      err.statusCode = 413;
      throw err;
    }
    chunks.push(c);
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    const err = new Error('invalid json');
    err.statusCode = 400;
    throw err;
  }
}

export function response(data, requestId = '') {
  return { code: 0, message: 'ok', data, requestId };
}

export function error(message, code = 1, requestId = '') {
  return { code, message, data: null, requestId };
}
