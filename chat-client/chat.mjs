/**
 * Antigravity Language Server Chat Client
 * Uses Connect protocol (gRPC over HTTP) with bidirectional streaming
 */

const LS_PORT = process.env.LS_PORT || '45077';
const CSRF_TOKEN = process.env.CSRF_TOKEN || '';
const MESSAGE = process.argv[2] || 'สวัสดี';

const BASE_URL = `http://127.0.0.1:${LS_PORT}`;

async function callUnary(service, method, body = {}) {
  const url = `${BASE_URL}/exa.${service}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-codeium-csrf-token': CSRF_TOKEN,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

async function startChatStream(message) {
  const url = `${BASE_URL}/exa.chat_client_server_pb.ChatClientServerService/StartChatClientRequestStream`;

  console.log(`\n--- Sending: "${message}" ---\n`);

  // Connect protocol: for server-streaming, use application/connect+json
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-codeium-csrf-token': CSRF_TOKEN,
      'Connect-Protocol-Version': '1',
    },
    body: JSON.stringify({
      clientType: 'CHAT_CLIENT_REQUEST_STREAM_CLIENT_TYPE_IDE',
    }),
  });

  console.log(`Status: ${res.status}`);
  console.log(`Content-Type: ${res.headers.get('content-type')}`);

  const text = await res.text();
  if (text) {
    console.log('Response:', text.substring(0, 500));
  } else {
    console.log('(empty response)');
  }
  return text;
}

async function trySendCascade(message) {
  // Try AddCascadeInput via the chat client server
  const url = `${BASE_URL}/exa.chat_client_server_pb.ChatClientServerService/AddCascadeInput`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-codeium-csrf-token': CSRF_TOKEN,
    },
    body: JSON.stringify({
      items: [{ text: message }],
    }),
  });

  console.log(`AddCascadeInput status: ${res.status}`);
  const text = await res.text();
  if (text) console.log('Response:', text.substring(0, 500));
  return text;
}

async function main() {
  if (!CSRF_TOKEN) {
    console.error('Usage: CSRF_TOKEN=xxx LS_PORT=yyy node chat.mjs "your message"');
    process.exit(1);
  }

  // 1. Verify connection
  console.log('=== Heartbeat ===');
  const hb = await callUnary('language_server_pb.LanguageServerService', 'Heartbeat');
  console.log(hb);

  // 2. Get existing conversations
  console.log('\n=== Trajectories ===');
  const traj = await callUnary('language_server_pb.LanguageServerService', 'GetAllCascadeTrajectories');
  if (traj.trajectorySummaries) {
    for (const [id, info] of Object.entries(traj.trajectorySummaries)) {
      console.log(`  ${id}: ${info.summary} (${info.status})`);
    }
  }

  // 3. Try StartChatClientRequestStream
  console.log('\n=== StartChatClientRequestStream ===');
  await startChatStream(MESSAGE);

  // 4. Try AddCascadeInput
  console.log('\n=== AddCascadeInput ===');
  await trySendCascade(MESSAGE);

  // 5. Check log for activity
  console.log('\n=== Check if AI was triggered ===');
  const diag = await callUnary('language_server_pb.LanguageServerService', 'GetDebugDiagnostics');
  if (diag.languageServerDiagnostics?.logs) {
    const logs = diag.languageServerDiagnostics.logs;
    const recent = logs.filter(l => l.includes('streamGenerate') || l.includes('planner'));
    if (recent.length) {
      console.log('AI activity found:');
      recent.forEach(l => console.log('  ', l.trim()));
    } else {
      console.log('No AI activity in current logs');
    }
  }
}

main().catch(console.error);
