const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { createServer } = require('../src/app');

let server;
let base;

beforeEach(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

afterEach(() => new Promise((resolve) => server.close(resolve)));

const book = (body) =>
  fetch(`${base}/api/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const booking = { patientName: 'Ravi', doctorId: 1, date: '2026-11-02', time: '09:00' };

const openSlots = async () =>
  (await fetch(`${base}/api/doctors/1/slots?date=2026-11-02`)).json();

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

test('books an appointment', async () => {
  const res = await book(booking);
  assert.strictEqual(res.status, 201);
  const appt = await res.json();
  assert.strictEqual(appt.id, 1);
  assert.strictEqual(appt.patientName, 'Ravi');
});

test('rejects a double booking', async () => {
  await book(booking);
  const res = await book({ ...booking, patientName: 'Sita' });
  assert.strictEqual(res.status, 409);
});

test('booked slot disappears from open slots', async () => {
  await book(booking);
  assert.deepStrictEqual(await openSlots(), ['10:00', '11:00']);
});

test('rejects missing fields', async () => {
  const res = await book({ patientName: 'Ravi' });
  assert.strictEqual(res.status, 400);
});

test('canceling frees the slot', async () => {
  await book(booking);
  const del = await fetch(`${base}/api/appointments/1`, { method: 'DELETE' });
  assert.strictEqual(del.status, 204);
  assert.ok((await openSlots()).includes('09:00'));
});

test('limits a patient to one appointment per day', async () => {
  await book(booking);
  const res = await book({ ...booking, patientName: 'ravi', time: '10:00' });
  assert.strictEqual(res.status, 409);
});

test('lets a patient book again on a different day', async () => {
  await book(booking);
  const res = await book({ ...booking, date: '2026-11-03', time: '10:00' });
  assert.strictEqual(res.status, 201);
});
