import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  CreditCard, 
  Plus, 
  Search, 
  Printer, 
  CheckCircle2, 
  Clock, 
  QrCode, 
  DollarSign, 
  Building2, 
  User, 
  Stethoscope, 
  Calendar, 
  X, 
  Trash2, 
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '../api';
import { formatCurrency } from '../utils/currency';

export default function BillingView({ user, hospitalInfo }) {
  const currencySymbol = hospitalInfo?.currency_symbol || '₹';
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    pendingAmount: 0,
    paidCount: 0,
    pendingCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [activeReceiptInvoice, setActiveReceiptInvoice] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [patientsList, setPatientsList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);

  // Form state for new invoice
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    patient_id: '',
    doctor_id: '',
    payment_status: 'paid',
    payment_method: 'upi',
    discount: 0,
    tax_rate: 5,
    notes: 'Outpatient consultation and diagnostic bill',
    items: [
      { description: 'Specialist OPD Consultation Fee', category: 'consultation', quantity: 1, unit_price: 500.00 }
    ]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInvoices();
    if (user?.role === 'admin' || user?.role === 'doctor') {
      loadPatientsAndDoctors();
    }
  }, [user, filterStatus]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const q = filterStatus !== 'all' ? `status=${filterStatus}` : '';
      const res = await api.getInvoices(q);
      setInvoices(res.invoices || []);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientsAndDoctors = async () => {
    try {
      const [patRes, docRes] = await Promise.all([
        api.getPatients().catch(() => ({ patients: [] })),
        api.getDoctors().catch(() => ({ doctors: [] }))
      ]);
      setPatientsList(patRes.patients || []);
      setDoctorsList(docRes.doctors || []);
      if (patRes.patients?.length > 0 && !newInvoiceForm.patient_id) {
        setNewInvoiceForm(prev => ({ ...prev, patient_id: patRes.patients[0].id }));
      }
      if (docRes.doctors?.length > 0 && !newInvoiceForm.doctor_id) {
        setNewInvoiceForm(prev => ({ ...prev, doctor_id: docRes.doctors[0].id }));
      }
    } catch (err) {
      console.error('Error fetching patients/doctors for billing:', err);
    }
  };

  const handleOpenReceipt = async (inv) => {
    try {
      const res = await api.getInvoice(inv.id);
      setActiveReceiptInvoice(res.invoice || inv);
    } catch (err) {
      setActiveReceiptInvoice(inv);
    }
  };

  const handleMarkPaid = async (invId, method = 'upi') => {
    try {
      await api.payInvoice(invId, { payment_method: method });
      loadInvoices();
      if (activeReceiptInvoice?.id === invId) {
        setActiveReceiptInvoice(prev => ({ ...prev, payment_status: 'paid', payment_method: method, paid_at: new Date().toISOString() }));
      }
    } catch (err) {
      alert(err.message || 'Failed to record payment');
    }
  };

  const handlePrintInvoice = () => {
    const printElem = document.getElementById('printable-invoice');
    if (!printElem) {
      window.print();
      return;
    }

    try {
      let printFrame = document.getElementById('medtech-print-frame');
      if (!printFrame) {
        printFrame = document.createElement('iframe');
        printFrame.id = 'medtech-print-frame';
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        document.body.appendChild(printFrame);
      }

      const frameDoc = printFrame.contentWindow.document;
      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Hospital Bill - ${activeReceiptInvoice?.invoice_number || 'Receipt'}</title>
            <style>
              @page {
                size: A4;
                margin: 12mm 15mm;
              }
              * {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background: #ffffff !important;
                color: #0f172a !important;
                margin: 0;
                padding: 10px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              img {
                max-width: 100%;
                display: block;
              }
            </style>
          </head>
          <body>
            ${printElem.innerHTML}
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      }, 250);
    } catch (e) {
      console.warn('Iframe print fallback to window.print():', e);
      window.print();
    }
  };

  // Add/Remove item in new invoice modal
  const handleAddItem = () => {
    setNewInvoiceForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { description: '', category: 'medicine', quantity: 1, unit_price: 150.00 }
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    setNewInvoiceForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateItem = (index, field, value) => {
    setNewInvoiceForm(prev => {
      const updated = [...prev.items];
      updated[index][field] = value;
      return { ...prev, items: updated };
    });
  };

  const calculateFormTotals = () => {
    const subtotal = newInvoiceForm.items.reduce((sum, item) => {
      return sum + (Number(item.quantity) || 1) * (Number(item.unit_price) || 0);
    }, 0);
    const disc = Number(newInvoiceForm.discount) || 0;
    const taxable = Math.max(0, subtotal - disc);
    const tax = (taxable * (Number(newInvoiceForm.tax_rate) || 0)) / 100;
    const grandTotal = taxable + tax;
    return { subtotal, disc, tax, grandTotal };
  };

  const handleCreateInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!newInvoiceForm.patient_id) {
      alert('Please select a patient.');
      return;
    }
    if (newInvoiceForm.items.length === 0) {
      alert('Please add at least one line item.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createInvoice(newInvoiceForm);
      setIsCreateModalOpen(false);
      loadInvoices();
      if (res.invoice) {
        handleOpenReceipt(res.invoice);
      }
    } catch (err) {
      alert(err.message || 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = (
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.transaction_ref?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchSearch;
  });

  const { subtotal: formSubtotal, tax: formTax, grandTotal: formGrandTotal } = calculateFormTotals();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399'
            }}>
              <Receipt size={20} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
              Hospital Invoicing & Payments
            </h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Automated OPD/IPD bill generation, digital receipts, and real-time UPI mobile settlements
          </p>
        </div>

        {(user?.role === 'admin' || user?.role === 'doctor') && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <Plus size={18} /> Generate New Invoice
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Total Revenue */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TOTAL REVENUE COLLECTED</span>
            <DollarSign size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-display)', marginTop: '8px', color: '#34d399' }}>
            {formatCurrency(stats.totalRevenue, currencySymbol)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {stats.paidCount} settled invoices
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>OUTSTANDING RECEIVABLES</span>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-display)', marginTop: '8px', color: '#fbbf24' }}>
            {formatCurrency(stats.pendingAmount, currencySymbol)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {stats.pendingCount} pending payment(s)
          </div>
        </div>

        {/* Total Invoices */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>TOTAL TRANSACTIONS</span>
            <Receipt size={20} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-display)', marginTop: '8px', color: '#38bdf8' }}>
            {stats.totalInvoices}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Electronic clinical billing
          </div>
        </div>

        {/* Collection Efficiency */}
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>PAYMENT CLEARANCE RATE</span>
            <ArrowUpRight size={20} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-display)', marginTop: '8px', color: '#a78bfa' }}>
            {stats.totalInvoices > 0 ? Math.round((stats.paidCount / stats.totalInvoices) * 100) : 100}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Cashless UPI & card adoption
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'paid', label: 'Paid & Cleared' },
            { id: 'pending', label: 'Pending Payment' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className="btn"
              style={{
                fontSize: '0.85rem',
                padding: '6px 14px',
                background: filterStatus === tab.id ? 'rgba(6, 182, 212, 0.2)' : 'var(--bg-glass)',
                border: filterStatus === tab.id ? '1px solid #06b6d4' : '1px solid var(--border-subtle)',
                color: filterStatus === tab.id ? '#38bdf8' : 'var(--text-secondary)',
                fontWeight: filterStatus === tab.id ? '600' : '400'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ minWidth: '260px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search invoice number, patient, doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          Loading hospital invoices...
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
          <Receipt size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3>No invoices found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Generate a new invoice or adjust your search filter.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              className="glass-card"
              style={{
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                borderLeft: inv.payment_status === 'paid' ? '4px solid #10b981' : '4px solid #f59e0b',
                transition: 'transform 0.15s ease'
              }}
            >
              {/* Left Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '240px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: inv.payment_status === 'paid' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: inv.payment_status === 'paid' ? '#34d399' : '#fbbf24',
                  fontWeight: '700'
                }}>
                  {inv.payment_status === 'paid' ? <CheckCircle2 size={22} /> : <Clock size={22} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {inv.invoice_number}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      fontWeight: '700',
                      background: inv.payment_status === 'paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: inv.payment_status === 'paid' ? '#34d399' : '#fbbf24'
                    }}>
                      {inv.payment_status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                    Patient: <strong style={{ color: 'var(--text-primary)' }}>{inv.patient_name}</strong>
                    {inv.doctor_name && <span> • Dr: {inv.doctor_name}</span>}
                  </div>
                </div>
              </div>

              {/* Middle Items & Date */}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div>Date: {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'Today'}</div>
                <div style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
                  {inv.items?.length || 1} line item(s) • Method: {inv.payment_method?.toUpperCase() || 'UPI'}
                </div>
              </div>

              {/* Right: Net Amount & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                    {formatCurrency(inv.net_amount, currencySymbol)}
                  </div>
                  {inv.discount > 0 && (
                    <div style={{ fontSize: '0.7rem', color: '#34d399' }}>
                      -{formatCurrency(inv.discount, currencySymbol)} discount
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {inv.payment_status === 'pending' && (
                    <button
                      onClick={() => handleMarkPaid(inv.id, 'upi')}
                      className="btn"
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid #10b981',
                        color: '#34d399',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}
                      title="Collect payment now"
                    >
                      Pay Now
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenReceipt(inv)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Printer size={15} /> View Receipt
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Printable Receipt & Dynamic UPI QR */}
      {activeReceiptInvoice && (
        <div className="modal-backdrop" onClick={() => setActiveReceiptInvoice(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '680px', padding: '0', overflow: 'hidden', background: '#ffffff', color: '#0f172a' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Control Bar (Hidden during Print) */}
            <div
              className="no-print"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                background: '#0f172a',
                color: '#f8fafc'
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} color="#38bdf8" /> Official Hospital Tax Invoice
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={handlePrintInvoice}
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={15} /> Print / Save PDF
                </button>
                <button
                  onClick={() => setActiveReceiptInvoice(null)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Invoice Container */}
            <div id="printable-invoice" style={{ padding: '36px', backgroundColor: '#ffffff', color: '#0f172a' }}>
              {/* Hospital Letterhead Header */}
              <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0284c7', margin: 0, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
                    {hospitalInfo?.hospital_name || 'CITY MULTI-SPECIALTY HOSPITAL'}
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '3px' }}>
                    {hospitalInfo?.tagline || 'Tertiary Clinical Care & 24x7 Trauma Institute'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', maxWidth: '340px' }}>
                    {hospitalInfo?.address || 'Plot 42, Medical Enclave, Health City'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    Lic: <strong>{hospitalInfo?.license_number || 'HOSP-LIC-2026-X889'}</strong> • Tel: {hospitalInfo?.contact_phone || '+1 (555) 019-9000'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: '700' }}>
                    TAX INVOICE / RECEIPT
                  </div>
                  <div style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '1.1rem', color: '#0f172a', marginTop: '2px' }}>
                    {activeReceiptInvoice.invoice_number}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                    Date: <strong>{activeReceiptInvoice.created_at ? new Date(activeReceiptInvoice.created_at).toLocaleDateString() : 'Today'}</strong>
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      padding: '3px 10px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      backgroundColor: activeReceiptInvoice.payment_status === 'paid' ? '#dcfce7' : '#fef3c7',
                      color: activeReceiptInvoice.payment_status === 'paid' ? '#166534' : '#92400e',
                      border: `1px solid ${activeReceiptInvoice.payment_status === 'paid' ? '#86efac' : '#fde68a'}`
                    }}>
                      STATUS: {activeReceiptInvoice.payment_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Patient & Physician Meta Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                padding: '16px 0',
                borderBottom: '1px solid #e2e8f0',
                fontSize: '0.82rem'
              }}>
                <div>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700' }}>BILLED TO PATIENT</span>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a', marginTop: '3px' }}>
                    {activeReceiptInvoice.patient_name}
                  </div>
                  <div style={{ color: '#475569', marginTop: '2px' }}>
                    Phone: {activeReceiptInvoice.patient_phone || 'N/A'} • Gender: {activeReceiptInvoice.patient_gender || 'N/A'}
                  </div>
                  {activeReceiptInvoice.patient_address && (
                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px' }}>
                      {activeReceiptInvoice.patient_address}
                    </div>
                  )}
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700' }}>ATTENDING PHYSICIAN / DEPT</span>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#0f172a', marginTop: '3px' }}>
                    {activeReceiptInvoice.doctor_name || 'Ambulatory Clinical Services'}
                  </div>
                  <div style={{ color: '#475569', marginTop: '2px' }}>
                    {activeReceiptInvoice.doctor_specialization || 'Hospital Clinical Staff'}
                  </div>
                  {activeReceiptInvoice.department_name && (
                    <div style={{ color: '#0284c7', fontSize: '0.75rem', marginTop: '2px', fontWeight: '600' }}>
                      Dept: {activeReceiptInvoice.department_name}
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: '#475569' }}>#</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: '#475569' }}>Description / Clinical Service</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', color: '#475569' }}>Category</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center', color: '#475569' }}>Qty</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#475569' }}>Unit Rate</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right', color: '#475569' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeReceiptInvoice.items || []).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', color: '#94a3b8' }}>{idx + 1}</td>
                      <td style={{ padding: '10px', fontWeight: '600', color: '#1e293b' }}>{item.description}</td>
                      <td style={{ padding: '10px', textAlign: 'center', textTransform: 'capitalize', color: '#64748b' }}>{item.category}</td>
                      <td style={{ padding: '10px', textAlign: 'center', color: '#334155' }}>{item.quantity}</td>
                      <td style={{ padding: '10px', textAlign: 'right', color: '#334155' }}>{formatCurrency(item.unit_price, currencySymbol)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>{formatCurrency(item.total_price, currencySymbol)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Calculation & UPI QR Box */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '24px', paddingTop: '16px', borderTop: '2px solid #e2e8f0' }}>
                {/* Left: Dynamic UPI QR Code & Payment Instructions */}
                <div style={{
                  padding: '14px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  {/* Dynamic QR Code */}
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=4&data=upi://pay?pa=hospital.medtech@upi%26pn=MedTechHospital%26am=${activeReceiptInvoice.net_amount}%26cu=INR`}
                      alt="UPI Payment QR Code"
                      style={{ width: '90px', height: '90px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                    <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#0284c7', marginTop: '3px' }}>
                      SCAN TO PAY
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                    <strong style={{ color: '#0f172a' }}>Direct Mobile UPI Settlement:</strong>
                    <p style={{ margin: '3px 0', fontSize: '0.72rem' }}>
                      Scan via GPay, PhonePe, or Banking App for instant digital clearance.
                    </p>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#0284c7', fontWeight: '700', marginTop: '4px' }}>
                      VPA: hospital.medtech@upi
                    </div>
                    {activeReceiptInvoice.transaction_ref && (
                      <div style={{ fontSize: '0.68rem', color: '#166534', marginTop: '2px' }}>
                        Ref: {activeReceiptInvoice.transaction_ref}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Calculations */}
                <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>Gross Subtotal:</span>
                    <span style={{ fontWeight: '600', color: '#0f172a' }}>{formatCurrency(activeReceiptInvoice.total_amount, currencySymbol)}</span>
                  </div>

                  {activeReceiptInvoice.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                      <span>Hospital Subsidy / Discount:</span>
                      <span>-{formatCurrency(activeReceiptInvoice.discount, currencySymbol)}</span>
                    </div>
                  )}

                  {activeReceiptInvoice.tax > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span>Healthcare Tax / Levies:</span>
                      <span>+{formatCurrency(activeReceiptInvoice.tax, currencySymbol)}</span>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.05rem',
                    fontWeight: '800',
                    color: '#0284c7',
                    borderTop: '2px solid #cbd5e1',
                    paddingTop: '6px',
                    marginTop: '4px'
                  }}>
                    <span>Net Amount Due:</span>
                    <span>{formatCurrency(activeReceiptInvoice.net_amount, currencySymbol)}</span>
                  </div>
                </div>
              </div>

              {/* Receipt Footer with signature */}
              <div style={{ marginTop: '36px', paddingTop: '16px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.72rem', color: '#94a3b8' }}>
                <div>
                  <p style={{ margin: '2px 0' }}>This is a computer generated clinical tax invoice. No manual signature required.</p>
                  <p style={{ margin: '2px 0' }}>Thank you for placing your medical trust with {hospitalInfo?.hospital_name || 'our institute'}.</p>
                </div>
                <div style={{ textAlign: 'center', borderTop: '1px solid #64748b', paddingTop: '4px', width: '150px', color: '#475569', fontWeight: '600' }}>
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create New Invoice */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Receipt size={22} color="#06b6d4" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Create Hospital Bill / Invoice</h3>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Patient and Doctor Select */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Patient *</label>
                  <select
                    className="form-input"
                    value={newInvoiceForm.patient_id}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, patient_id: e.target.value })}
                    required
                  >
                    <option value="">Select patient</option>
                    {patientsList.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name} ({p.gender}, {p.blood_group})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Doctor / Clinician</label>
                  <select
                    className="form-input"
                    value={newInvoiceForm.doctor_id}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, doctor_id: e.target.value })}
                  >
                    <option value="">Hospital general / NA</option>
                    {doctorsList.map(d => (
                      <option key={d.id} value={d.id}>{d.full_name} - {d.specialization}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Billable Items & Services</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="btn"
                    style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}
                  >
                    + Add Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {newInvoiceForm.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 0.8fr 1fr 30px', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Service / Item name"
                        value={item.description}
                        onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                        className="form-input"
                        style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                        required
                      />
                      <select
                        value={item.category}
                        onChange={(e) => handleUpdateItem(idx, 'category', e.target.value)}
                        className="form-input"
                        style={{ fontSize: '0.8rem', padding: '6px 4px' }}
                      >
                        <option value="consultation">Consultation</option>
                        <option value="lab">Lab Test</option>
                        <option value="bed">Ward/Bed</option>
                        <option value="medicine">Medicine</option>
                        <option value="procedure">Procedure</option>
                      </select>
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                        className="form-input"
                        style={{ fontSize: '0.8rem', padding: '6px 6px', textAlign: 'center' }}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={item.unit_price}
                        onChange={(e) => handleUpdateItem(idx, 'unit_price', e.target.value)}
                        className="form-input"
                        style={{ fontSize: '0.8rem', padding: '6px 8px', textAlign: 'right' }}
                      />
                      {newInvoiceForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Discounts & Tax */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Discount ({currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newInvoiceForm.discount}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, discount: e.target.value })}
                    className="form-input"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label className="form-label">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={newInvoiceForm.tax_rate}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, tax_rate: e.target.value })}
                    className="form-input"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label className="form-label">Payment Method</label>
                  <select
                    value={newInvoiceForm.payment_method}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, payment_method: e.target.value })}
                    className="form-input"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="upi">UPI / QR Code</option>
                    <option value="cash">Cash</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="insurance">Health Insurance</option>
                  </select>
                </div>
              </div>

              {/* Status and Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div>
                  <label className="form-label">Initial Status</label>
                  <select
                    value={newInvoiceForm.payment_status}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, payment_status: e.target.value })}
                    className="form-input"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <option value="paid">Paid & Cleared</option>
                    <option value="pending">Pending Payment</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Clinical / Billing Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. OPD cardiology checkup"
                    value={newInvoiceForm.notes}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, notes: e.target.value })}
                    className="form-input"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Summary Bar */}
              <div style={{
                padding: '12px 16px',
                background: 'rgba(6, 182, 212, 0.08)',
                borderRadius: '8px',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Calculated Total:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#38bdf8' }}>
                  {formatCurrency(formGrandTotal, currencySymbol)}
                </span>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {isSubmitting ? 'Generating...' : 'Save & Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
