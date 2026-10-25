import test from 'node:test';
import assert from 'node:assert/strict';
process.env.MEDTECH_TEST_DB = ':memory:';
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_URL;
delete process.env.TURSO_AUTH_TOKEN;
const { initializeDatabase, getOne, run, db } = await import('../src/db.js');
const { initializeOPD, snapshot, hospitalDate } = await import('../src/services/opd.js');

test('fresh hospital schema, staff seed and legacy appointments load into OPD', async () => {
  try {
    await initializeDatabase();
    await initializeOPD();
    assert.ok(await getOne("SELECT id FROM Users WHERE role = 'staff'"));
    const doctor = await getOne('SELECT id FROM Doctors ORDER BY id LIMIT 1');
    // Fixture-only approval in an isolated database, never the real hospital.
    await run("UPDATE Doctors SET status = 'approved' WHERE id = ?", [doctor.id]);
    const user = await getOne("SELECT id FROM Users WHERE role = 'admin' LIMIT 1");
    const data = await snapshot({role:'admin',userId:user.id}, doctor.id);
    assert.equal(data.session.session_date, hospitalDate());
    assert.equal(data.doctor.id, doctor.id);
    assert.ok(data.queue_list.length > 0);
    assert.ok(data.queue_list.every(row => row.queue_state));
    // Reopening/reloading a session must not regenerate order or reset states.
    const again = await snapshot({role:'admin',userId:user.id}, doctor.id);
    assert.equal(again.session.id, data.session.id);
    assert.deepEqual(again.queue_list.map(row => row.id), data.queue_list.map(row => row.id));
  } finally { await new Promise(resolve => db.close(resolve)); }
});
