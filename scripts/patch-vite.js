import fs from 'node:fs';
import path from 'node:path';

function patchFile(relPath, transforms) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) return;

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  for (const { name, pattern, replacement } of transforms) {
    if (typeof pattern === 'string') {
      if (content.includes(pattern)) {
        content = content.replaceAll(pattern, replacement);
        modified = true;
      }
    } else if (pattern instanceof RegExp) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`[patch-vite] Successfully patched ${relPath}`);
  }
}

// 1. Patch Vite client files
const viteClientFiles = [
  'node_modules/vite/dist/client/client.mjs',
  'node_modules/vite/dist/client/bundledDevClient.mjs',
  'node_modules/vite/dist/node/module-runner.js',
];

for (const relPath of viteClientFiles) {
  patchFile(relPath, [
    // Guard ws.send
    {
      name: 'guard ws.send',
      pattern: /if \(ws && typeof ws\.send === "function" && ws\.readyState === 1\) \{ (?:if \(ws && typeof ws\.send === "function" && ws\.readyState === 1\) \{ )?ws\.send\(JSON\.stringify\(data\)\);(?: \})? \}/g,
      replacement: 'if (ws && typeof ws.send === "function" && ws.readyState === 1) { try { ws.send(JSON.stringify(data)); } catch {} }',
    },
    {
      name: 'guard bare ws.send',
      pattern: /ws\.send\(JSON\.stringify\(data\)\);/g,
      replacement: 'if (ws && typeof ws.send === "function" && ws.readyState === 1) { try { ws.send(JSON.stringify(data)); } catch {} }',
    },
    // Guard wsTransport.send
    {
      name: 'guard wsTransport.send',
      pattern: /wsTransport\.send\(data\);/g,
      replacement: 'if (wsTransport && typeof wsTransport.send === "function") { try { wsTransport.send(data); } catch {} }',
    },
    // Guard wsTransport.disconnect
    {
      name: 'guard wsTransport.disconnect',
      pattern: /await wsTransport\.disconnect\(\);/g,
      replacement: 'try { if (wsTransport && typeof wsTransport.disconnect === "function") await wsTransport.disconnect(); } catch {}',
    },
    // Guard HMRClient logger to suppress benign "send" errors during HMR disconnect
    {
      name: 'suppress send errors in HMRClient logger',
      pattern: /error: \(err\) => console\.error\("\[vite\]", err\)/g,
      replacement: 'error: (err) => { if (err && (String(err).includes("send") || (err.message && err.message.includes("send")))) return; console.error("[vite]", err); }',
    },
    // Guard HMRClient send error logging when disconnected
    {
      name: 'guard HMRClient send',
      pattern: /this\.transport\.send\(payload\)\.catch\(\(err\) => \{\s*this\.logger\.error\(err\);\s*\}\);/g,
      replacement: 'try { if (this.transport && typeof this.transport.send === "function") { this.transport.send(payload)?.catch?.(() => {}); } } catch {}',
    },
    // Guard normalizeModuleRunnerTransport send
    {
      name: 'guard normalizeModuleRunnerTransport send',
      pattern: /if \(!isConnected\) \{\s*if \(connectingPromise\) await connectingPromise;\s*else throw new SendBeforeConnectError\("send was called before connect"\);\s*\}\s*await invokeableTransport\.send\(data\);/g,
      replacement: 'if (!isConnected) { if (connectingPromise) { try { await connectingPromise; } catch { return; } } else { return; } } try { if (invokeableTransport && typeof invokeableTransport.send === "function") await invokeableTransport.send(data); } catch {}',
    },
  ]);
}

// 2. Patch Tailwind CSS Vite plugin
patchFile('node_modules/@tailwindcss/vite/dist/index.mjs', [
  {
    name: 'guard u.hot.send in @tailwindcss/vite',
    pattern: /u\.hot\.send\s*\?\s*u\.hot\.send\(\{type:"full-reload"\}\)\s*:\s*u\.ws\.send\s*&&\s*u\.ws\.send\(\{type:"full-reload"\}\)/g,
    replacement: 'u.hot?.send ? u.hot.send({type:"full-reload"}) : u.ws?.send && u.ws.send({type:"full-reload"})',
  },
]);

// 3. Patch Vite PWA plugin
const pwaFiles = [
  'node_modules/vite-plugin-pwa/dist/index.cjs',
  'node_modules/vite-plugin-pwa/dist/index.js',
  'node_modules/vite-plugin-pwa/dist/chunk-I2Z7IWCN.js',
];

for (const relPath of pwaFiles) {
  patchFile(relPath, [
    {
      name: 'guard server.ws.send in vite-plugin-pwa',
      pattern: /server\.ws\.send\(/g,
      replacement: 'server.ws?.send?.(',
    },
    {
      name: 'guard import.meta.hot.send in vite-plugin-pwa',
      pattern: /import\.meta\.hot\.send\(/g,
      replacement: 'import.meta?.hot?.send?.(',
    },
  ]);
}
