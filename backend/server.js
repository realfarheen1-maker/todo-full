const http = require('http');

const PORT = process.env.PORT || 3000;

// In-memory store
let todos = [];
let nextId = 1;

// ── helpers ───────────────────────────────────────────────────────────────────

function getBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
  });
}

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',          // allow the frontend
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(json);
}

// ── server ────────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  // Browser pre-flight request
  if (method === 'OPTIONS') return send(res, 204, {});

  // GET /todos
  if (method === 'GET' && url === '/todos') {
    return send(res, 200, todos);
  }

  // POST /todos  — body: { title }
  if (method === 'POST' && url === '/todos') {
    const { title } = await getBody(req);
    if (!title) return send(res, 400, { error: 'title is required' });
    const todo = { id: nextId++, title, done: false };
    todos.push(todo);
    return send(res, 201, todo);
  }

  // PUT /todos/:id  — body: { title }
  const putMatch = url.match(/^\/todos\/(\d+)$/);
  if (method === 'PUT' && putMatch) {
    const id = Number(putMatch[1]);
    const todo = todos.find(t => t.id === id);
    if (!todo) return send(res, 404, { error: 'not found' });
    const { title } = await getBody(req);
    if (title !== undefined) todo.title = title;
    return send(res, 200, todo);
  }

  // DELETE /todos/:id
  const delMatch = url.match(/^\/todos\/(\d+)$/);
  if (method === 'DELETE' && delMatch) {
    const id = Number(delMatch[1]);
    const index = todos.findIndex(t => t.id === id);
    if (index === -1) return send(res, 404, { error: 'not found' });
    todos.splice(index, 1);
    return send(res, 200, { message: 'deleted' });
  }

  // Fallback
  send(res, 404, { error: 'route not found' });
});

server.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
