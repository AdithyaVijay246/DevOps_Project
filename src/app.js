const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const INDEX_HTML = path.join(__dirname, '..', 'public', 'index.html');

function createServer() {
  const doctors = [
    { id: 1, name: 'Dr. Meera Iyer', department: 'Cardiology', slots: ['09:00', '10:00', '11:00'] },
    { id: 2, name: 'Dr. Arun Kumar', department: 'Dermatology', slots: ['09:30', '10:30', '11:30'] },
    { id: 3, name: 'Dr. Priya Nair', department: 'Pediatrics', slots: ['14:00', '15:00', '16:00'] },
  ];
  let appointments = [];
  let nextId = 1;

  const send = (res, status, body) => {
    if (body === undefined) {
      res.writeHead(status);
      return res.end();
    }
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  const readJson = (req) =>
    new Promise((resolve) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => {
        try {
          resolve(JSON.parse(data || '{}'));
        } catch {
          resolve({});
        }
      });
    });

  const findDoctor = (id) => doctors.find((d) => d.id === Number(id));

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const { pathname } = url;
    let match;

    if (req.method === 'GET' && pathname === '/health') {
      return send(res, 200, { status: 'ok' });
    }

    if (req.method === 'GET' && pathname === '/api/doctors') {
      const dept = url.searchParams.get('department');
      const list = dept
        ? doctors.filter((d) => d.department.toLowerCase() === dept.toLowerCase())
        : doctors;
      return send(res, 200, list);
    }

    if (req.method === 'GET' && (match = pathname.match(/^\/api\/doctors\/(\d+)\/slots$/))) {
      const doctor = findDoctor(match[1]);
      if (!doctor) return send(res, 404, { error: 'Doctor not found' });
      const date = url.searchParams.get('date');
      if (!date) return send(res, 400, { error: 'date is required (YYYY-MM-DD)' });
      const taken = appointments
        .filter((a) => a.doctorId === doctor.id && a.date === date)
        .map((a) => a.time);
      return send(res, 200, doctor.slots.filter((s) => !taken.includes(s)));
    }

    if (req.method === 'POST' && pathname === '/api/appointments') {
      const { patientName, doctorId, date, time } = await readJson(req);
      if (!patientName || !doctorId || !date || !time) {
        return send(res, 400, { error: 'patientName, doctorId, date and time are required' });
      }
      const doctor = findDoctor(doctorId);
      if (!doctor) return send(res, 404, { error: 'Doctor not found' });
      if (!doctor.slots.includes(time)) {
        return send(res, 400, { error: `${doctor.name} does not work at ${time}` });
      }
      const taken = appointments.some(
        (a) => a.doctorId === doctor.id && a.date === date && a.time === time
      );
      if (taken) return send(res, 409, { error: 'That slot is already booked' });
      const appointment = { id: nextId++, patientName, doctorId: doctor.id, date, time };
      appointments.push(appointment);
      return send(res, 201, appointment);
    }

    if (req.method === 'GET' && pathname === '/api/appointments') {
      return send(res, 200, appointments);
    }

    if (req.method === 'DELETE' && (match = pathname.match(/^\/api\/appointments\/(\d+)$/))) {
      const before = appointments.length;
      appointments = appointments.filter((a) => a.id !== Number(match[1]));
      if (appointments.length === before) return send(res, 404, { error: 'Appointment not found' });
      return send(res, 204);
    }

    if (req.method === 'GET' && pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(INDEX_HTML));
    }

    send(res, 404, { error: 'Not found' });
  });
}

module.exports = { createServer };
