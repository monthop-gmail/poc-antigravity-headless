/**
 * Antigravity LS Chat via Connect protocol
 * StartChatClientRequestStream is client-streaming (client sends multiple, server returns one)
 * or it might be unary with the StartRequest, then we use AddCascadeInput separately
 */
import http from 'node:http';

const LS_PORT = process.env.LS_PORT || '45077';
const CSRF = process.env.CSRF_TOKEN || '';
const MSG = process.argv[2] || 'what is 2+2? answer briefly';

if (!CSRF) {
  console.error('Usage: CSRF_TOKEN=xxx LS_PORT=yyy node stream-chat.mjs "message"');
  process.exit(1);
}

function encodeEnvelope(data) {
  const json = JSON.stringify(data);
  const payload = Buffer.from(json, 'utf8');
  const envelope = Buffer.alloc(5 + payload.length);
  envelope.writeUInt8(0, 0);
  envelope.writeUInt32BE(payload.length, 1);
  payload.copy(envelope, 5);
  return envelope;
}

function decodeEnvelopes(buf) {
  const results = [];
  let offset = 0;
  while (offset + 5 <= buf.length) {
    const flags = buf.readUInt8(offset);
    const len = buf.readUInt32BE(offset + 1);
    if (offset + 5 + len > buf.length) break;
    const payload = buf.slice(offset + 5, offset + 5 + len);
    try {
      results.push({ flags, data: JSON.parse(payload.toString('utf8')) });
    } catch {
      results.push({ flags, raw: payload.toString('utf8') });
    }
    offset += 5 + len;
  }
  return results;
}

async function callConnect(path, body) {
  return new Promise((resolve, reject) => {
    const envelope = encodeEnvelope(body);
    const options = {
      hostname: '127.0.0.1',
      port: parseInt(LS_PORT),
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/connect+json',
        'Connect-Protocol-Version': '1',
        'x-codeium-csrf-token': CSRF,
        'Content-Length': envelope.length,
      },
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const full = Buffer.concat(chunks);
        const decoded = decodeEnvelopes(full);
        resolve({ status: res.statusCode, contentType: res.headers['content-type'], decoded, raw: full });
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); resolve({ status: 0, timeout: true }); });
    req.write(envelope);
    req.end();
  });
}

async function callJSON(service, method, body = {}) {
  const res = await fetch(`http://127.0.0.1:${LS_PORT}/exa.${service}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-codeium-csrf-token': CSRF },
    body: JSON.stringify(body),
  });
  return res.text().then(t => { try { return JSON.parse(t); } catch { return t; } });
}

async function main() {
  console.log('=== Antigravity Chat Client ===\n');

  // 1. Start chat stream (unary - just opens the session)
  console.log('1. Starting chat session...');
  const start = await callConnect(
    '/exa.chat_client_server_pb.ChatClientServerService/StartChatClientRequestStream',
    { clientType: 'CHAT_CLIENT_REQUEST_STREAM_CLIENT_TYPE_IDE' }
  );
  console.log(`   Status: ${start.status}, Type: ${start.contentType}`);
  if (start.decoded?.length) {
    start.decoded.forEach(e => console.log('   Response:', JSON.stringify(e.data || e.raw).substring(0, 300)));
  }

  // 2. Send message via SendActionToChatPanel (which returned {} before)
  console.log(`\n2. Sending message: "${MSG}"`);

  // Try as Connect envelope format
  const send = await callConnect(
    '/exa.language_server_pb.LanguageServerService/SendActionToChatPanel',
    { actionType: 'addCascadeInput', payload: JSON.stringify({ items: [{ text: MSG }] }) }
  );
  console.log(`   Status: ${send.status}`);
  if (send.decoded?.length) {
    send.decoded.forEach(e => console.log('   Response:', JSON.stringify(e.data || e.raw).substring(0, 500)));
  }

  // 3. Also try via JSON (worked before returning {})
  console.log('\n3. Trying JSON format...');
  const json1 = await callJSON('language_server_pb.LanguageServerService', 'SendActionToChatPanel', {
    action_type: 'addCascadeInput',
    payload: JSON.stringify({ items: [{ text: MSG }] }),
  });
  console.log('   Response:', JSON.stringify(json1).substring(0, 300));

  // 4. Wait and check for AI activity
  console.log('\n4. Waiting 10s for AI response...');
  await new Promise(r => setTimeout(r, 10000));

  const diag = await callJSON('language_server_pb.LanguageServerService', 'GetDebugDiagnostics');
  if (diag?.languageServerDiagnostics?.logs) {
    const logs = diag.languageServerDiagnostics.logs;
    const ai = logs.filter(l => l.includes('streamGenerate') || l.includes('planner'));
    if (ai.length) {
      console.log('   AI activity:');
      ai.slice(-3).forEach(l => console.log('   ', l.trim()));
    } else {
      console.log('   No new AI activity');
    }
  }

  // 5. Try StreamAgentStateUpdates to get responses
  console.log('\n5. Checking agent state...');
  const state = await callConnect(
    '/exa.language_server_pb.LanguageServerService/StreamAgentStateUpdates',
    {}
  );
  console.log(`   Status: ${state.status}, Size: ${state.raw?.length || 0} bytes`);
  if (state.decoded?.length) {
    state.decoded.forEach(e => console.log('   State:', JSON.stringify(e.data || e.raw).substring(0, 500)));
  }
}

main().catch(console.error);
