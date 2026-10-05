import { initializeDatabase, query, run } from './db.js';

async function migrate() {
  console.log('Initializing database schema first...');
  await initializeDatabase();
  console.log('Running duty migrations...');
  const nurses = await query('SELECT id FROM Nurses LIMIT 15');
  for (const n of nurses) {
    await run("UPDATE Nurses SET status = 'approved', is_on_duty = 1 WHERE id = ?", [n.id]);
  }
  
  // Set distinct wards for the first few nurses so we have sample distribution
  const wards = [
    { ward: 'ICU', shift: '08:00 AM - 04:00 PM' },
    { ward: 'ICU', shift: '04:00 PM - 12:00 AM' },
    { ward: 'Emergency', shift: '08:00 AM - 04:00 PM' },
    { ward: 'General Ward', shift: '08:00 AM - 04:00 PM' },
    { ward: 'General Ward', shift: '04:00 PM - 12:00 AM' },
    { ward: 'Pediatric Ward', shift: '08:00 AM - 04:00 PM' },
    { ward: 'Semi-Private', shift: '08:00 AM - 04:00 PM' }
  ];

  for (let i = 0; i < Math.min(nurses.length, wards.length); i++) {
    await run('UPDATE Nurses SET assigned_ward = ?, shift_timings = ? WHERE id = ?', [
      wards[i].ward,
      wards[i].shift,
      nurses[i].id
    ]);
  }

  const cleaners = await query('SELECT id FROM HousekeepingStaff LIMIT 8');
  for (const c of cleaners) {
    await run("UPDATE HousekeepingStaff SET status = 'approved', is_on_duty = 1 WHERE id = ?", [c.id]);
  }

  // Update CleaningTasks with some sample assignments
  const firstCleaner = cleaners[0];
  if (firstCleaner) {
    const cleanerRecord = await query('SELECT full_name FROM HousekeepingStaff WHERE id = ?', [firstCleaner.id]);
    const cleanerName = cleanerRecord[0]?.full_name || 'Ramesh Shinde';
    await run(
      "UPDATE CleaningTasks SET assigned_cleaner_id = ?, assigned_cleaner_name = ?, priority = 'urgent', task_status = 'pending', notes = 'Post-discharge terminal sterilization required before next admission.' WHERE id = 4",
      [firstCleaner.id, cleanerName]
    );
    await run(
      "UPDATE CleaningTasks SET assigned_cleaner_id = ?, assigned_cleaner_name = ?, priority = 'high', task_status = 'in_progress', notes = 'Routine hourly disinfection of sanitary fixtures.' WHERE id = 5",
      [firstCleaner.id, cleanerName]
    );
  }

  console.log('Duty migration completed successfully!');
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
