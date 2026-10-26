const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { createServer } = require('../src/app');

let server;
let base;

beforeEach(async () => {
  server = createServer(); // fresh in-memory state for every test
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

afterEach(() => new Promise((resolve) => server.close(resolve)));

test('health check returns ok', async () => {
  const res = await fetch(`${base}/health`);
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(await res.json(), { status: 'ok' });
});

test('lists all doctors', async () => {
  const res = await fetch(`${base}/api/doctors`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).length, 3);
});

test('filters doctors by department, case-insensitive', async () => {
  const res = await fetch(`${base}/api/doctors?department=cARDIOLOGY`);
  const list = await res.json();
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].name, 'Dr. Meera Iyer');
});
