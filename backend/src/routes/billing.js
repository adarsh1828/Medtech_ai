import express from 'express';
import { query, getOne, run } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET all invoices with optional filtering & summary KPIs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, patient_id, search } = req.query;

    let sql = `
      SELECT inv.*,
             p.full_name as patient_name, p.phone as patient_phone, p.gender as patient_gender, p.dob as patient_dob,
             d.full_name as doctor_name, d.specialization as doctor_specialization,
             dep.name as department_name,
             a.appointment_date, a.time_slot
      FROM Invoices inv
      JOIN Patients p ON inv.patient_id = p.id
      LEFT JOIN Doctors d ON inv.doctor_id = d.id
      LEFT JOIN Departments dep ON d.department_id = dep.id
      LEFT JOIN Appointments a ON inv.appointment_id = a.id
      WHERE 1=1
    `;
    const params = [];

    // If patient is logged in, restrict to their own invoices
    if (req.user.role === 'patient') {
      const patient = await getOne('SELECT id FROM Patients WHERE user_id = ?', [req.user.userId]);
      if (!patient) return res.json({ invoices: [], stats: {} });
      sql += ' AND inv.patient_id = ?';
      params.push(patient.id);
    } else if (patient_id) {
      sql += ' AND inv.patient_id = ?';
      params.push(patient_id);
    }

    if (status && ['paid', 'pending', 'cancelled'].includes(status)) {
      sql += ' AND inv.payment_status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (p.full_name LIKE ? OR inv.invoice_number LIKE ? OR inv.transaction_ref LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY inv.created_at DESC';
    const invoices = await query(sql, params);

    // Attach items to each invoice
    for (const inv of invoices) {
      inv.items = await query('SELECT * FROM InvoiceItems WHERE invoice_id = ?', [inv.id]);
    }

    // Compute overview billing statistics
    const statsRow = await getOne(`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(CASE WHEN payment_status = 'paid' THEN net_amount ELSE 0 END) as total_revenue,
        SUM(CASE WHEN payment_status = 'pending' THEN net_amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_count
      FROM Invoices
    `);

    res.json({
      invoices,
      stats: {
        totalInvoices: statsRow?.total_invoices || 0,
        totalRevenue: Number((statsRow?.total_revenue || 0).toFixed(2)),
        pendingAmount: Number((statsRow?.pending_amount || 0).toFixed(2)),
        paidCount: statsRow?.paid_count || 0,
        pendingCount: statsRow?.pending_count || 0
      }
    });
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ error: 'Failed to retrieve billing invoices.' });
  }
});

// GET single invoice details with hospital branding for print/receipt
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const inv = await getOne(
      `SELECT inv.*,
              p.full_name as patient_name, p.phone as patient_phone, p.gender as patient_gender, p.dob as patient_dob, p.address as patient_address,
              d.full_name as doctor_name, d.qualification as doctor_qualification, d.specialization as doctor_specialization,
              dep.name as department_name,
              a.appointment_date, a.time_slot, a.token_number
       FROM Invoices inv
       JOIN Patients p ON inv.patient_id = p.id
       LEFT JOIN Doctors d ON inv.doctor_id = d.id
       LEFT JOIN Departments dep ON d.department_id = dep.id
       LEFT JOIN Appointments a ON inv.appointment_id = a.id
       WHERE inv.id = ?`,
      [req.params.id]
    );

    if (!inv) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    // Patient authorization check
    if (req.user.role === 'patient') {
      const patient = await getOne('SELECT id FROM Patients WHERE user_id = ?', [req.user.userId]);
      if (inv.patient_id !== patient?.id) {
        return res.status(403).json({ error: 'Unauthorized to view this invoice.' });
      }
    }

    inv.items = await query('SELECT * FROM InvoiceItems WHERE invoice_id = ?', [inv.id]);
    const hospital = await getOne('SELECT * FROM HospitalSettings WHERE id = 1');

    res.json({ invoice: inv, hospital });
  } catch (err) {
    console.error('Error fetching invoice details:', err);
    res.status(500).json({ error: 'Failed to load invoice details.' });
  }
});

// POST generate new invoice (Doctor or Admin)
router.post('/', authenticateToken, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      appointment_id,
      items,
      discount = 0,
      tax_rate = 0, // e.g. 5%
      payment_status = 'pending',
      payment_method = 'upi',
      transaction_ref,
      notes
    } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: 'Patient ID is required to generate invoice.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one invoice line item is required.' });
    }

    // Calculate itemized totals
    let total_amount = 0;
    const cleanItems = items.map((item) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const unit = Math.max(0, Number(item.unit_price) || 0);
      const total = qty * unit;
      total_amount += total;
      return {
        description: item.description?.trim() || 'Clinical Service',
        category: ['consultation', 'lab', 'bed', 'medicine', 'procedure'].includes(item.category) ? item.category : 'consultation',
        quantity: qty,
        unit_price: unit,
        total_price: total
      };
    });

    const disc = Math.max(0, Number(discount) || 0);
    const taxable = Math.max(0, total_amount - disc);
    const tax = Number(((taxable * (Number(tax_rate) || 0)) / 100).toFixed(2));
    const net_amount = Number((taxable + tax).toFixed(2));

    // Generate unique invoice number
    const countRow = await getOne('SELECT COUNT(*) as count FROM Invoices');
    const invCode = `INV-2026-${String((countRow?.count || 0) + 1).padStart(4, '0')}`;

    const paid_at = payment_status === 'paid' ? new Date().toISOString() : null;

    const result = await run(
      `INSERT INTO Invoices (invoice_number, patient_id, doctor_id, appointment_id, total_amount, discount, tax, net_amount, payment_status, payment_method, transaction_ref, notes, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invCode,
        patient_id,
        doctor_id || null,
        appointment_id || null,
        total_amount,
        disc,
        tax,
        net_amount,
        payment_status,
        payment_method,
        transaction_ref || null,
        notes?.trim() || null,
        paid_at
      ]
    );

    const invoiceId = result.lastID;

    // Insert line items
    for (const item of cleanItems) {
      await run(
        `INSERT INTO InvoiceItems (invoice_id, description, category, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [invoiceId, item.description, item.category, item.quantity, item.unit_price, item.total_price]
      );
    }

    const created = await getOne('SELECT * FROM Invoices WHERE id = ?', [invoiceId]);
    created.items = await query('SELECT * FROM InvoiceItems WHERE invoice_id = ?', [invoiceId]);

    res.status(201).json({
      message: 'Invoice created successfully!',
      invoice: created
    });
  } catch (err) {
    console.error('Error generating invoice:', err);
    res.status(500).json({ error: 'Failed to generate hospital invoice.' });
  }
});

// PATCH pay invoice (record cash, UPI, card, or insurance)
router.patch('/:id/pay', authenticateToken, async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { payment_method = 'upi', transaction_ref } = req.body;

    const existing = await getOne('SELECT * FROM Invoices WHERE id = ?', [invoiceId]);
    if (!existing) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    if (existing.payment_status === 'paid') {
      return res.status(400).json({ error: 'This invoice is already fully marked as paid.' });
    }

    const paidAt = new Date().toISOString();
    const finalRef = transaction_ref || (payment_method === 'upi' ? `UPI/${Date.now().toString().slice(-8)}` : `TXN-${Date.now().toString().slice(-6)}`);

    await run(
      `UPDATE Invoices 
       SET payment_status = 'paid',
           payment_method = ?,
           transaction_ref = ?,
           paid_at = ?
       WHERE id = ?`,
      [payment_method, finalRef, paidAt, invoiceId]
    );

    const updated = await getOne('SELECT * FROM Invoices WHERE id = ?', [invoiceId]);
    updated.items = await query('SELECT * FROM InvoiceItems WHERE invoice_id = ?', [invoiceId]);

    res.json({
      message: 'Payment recorded successfully!',
      invoice: updated
    });
  } catch (err) {
    console.error('Error processing payment:', err);
    res.status(500).json({ error: 'Failed to record invoice payment.' });
  }
});

export default router;
