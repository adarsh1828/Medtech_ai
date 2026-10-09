import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Calendar, 
  User, 
  Stethoscope, 
  CheckCircle2, 
  Clock, 
  Activity, 
  FileText,
  Plus,
  X,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  Share2,
  AlertTriangle,
  ShieldCheck,
  HeartPulse,
  ArrowRight
} from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';

export default function LabReportsView({ user }) {
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // AI Report Explainer State
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [explainedData, setExplainedData] = useState(null);

  // Add Lab Report Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [newReport, setNewReport] = useState({
    patient_id: '',
    test_id: '',
    test_date: new Date().toISOString().split('T')[0],
    status: 'completed',
    result_value: '',
    reference_range: '',
    remarks: ''
  });

  const canCreateReport = user?.role && ['doctor', 'admin', 'nurse'].includes(user.role);

  useEffect(() => {
    loadReports();
  }, [user]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.getLabReports();
      setReports(res.reports || []);
    } catch (err) {
      console.error('Failed to load lab reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = async () => {
    setFormError('');
    setIsAddModalOpen(true);
    try {
      const [patRes, testRes] = await Promise.all([
        api.getPatients().catch(() => ({ patients: [] })),
        api.getLabTests().catch(() => ({ tests: [] }))
      ]);
      const pList = patRes.patients || [];
      const tList = testRes.tests || [];
      setPatients(pList);
      setLabTests(tList);

      setNewReport({
        patient_id: pList[0]?.id || '',
        test_id: tList[0]?.id || '',
        test_date: new Date().toISOString().split('T')[0],
        status: 'completed',
        result_value: '',
        reference_range: tList[0]?.normal_range || '',
        remarks: ''
      });
    } catch (err) {
      console.error('Error fetching patients or tests:', err);
    }
  };

  const handleTestChange = (e) => {
    const testId = e.target.value;
    const selected = labTests.find(t => String(t.id) === String(testId));
    setNewReport(prev => ({
      ...prev,
      test_id: testId,
      reference_range: selected?.normal_range || ''
    }));
  };

  const handleSaveReport = async (e) => {
    e.preventDefault();
    if (!newReport.patient_id || !newReport.test_id || !newReport.result_value.trim()) {
      setFormError('कृपया रुग्ण, टेस्ट आणि चाचणीचा निकाल (Result) प्रविष्ट करा.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await api.createLabReport(newReport);
      await loadReports();
      setIsAddModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'लॅब रिपोर्ट सेव्ह करताना त्रुटी आली.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExplainReport = (rpt) => {
    const testName = rpt.test_name || 'Diagnostic Test';
    const valStr = String(rpt.result_value || '');
    const numVal = parseFloat(valStr.replace(/[^0-9.]/g, '')) || 0;
    const refStr = rpt.reference_range || '';

    let status = 'normal';
    let statusLabel = 'सामान्य (Normal / Within Range)';
    let statusColor = '#10b981';
    let gaugePercent = 50;
    let simpleMeaning = '';
    let dietAdvice = [];
    let redFlags = [];

    const lowerTest = testName.toLowerCase();

    if (lowerTest.includes('glucose') || lowerTest.includes('sugar') || lowerTest.includes('hba1c')) {
      if (numVal > 140 || (lowerTest.includes('fasting') && numVal > 100)) {
        status = 'elevated';
        statusLabel = 'वाढलेले (Elevated / High Blood Sugar)';
        statusColor = '#f43f5e';
        gaugePercent = 85;
        simpleMeaning = 'तुमच्या रक्तातील साखरेची पातळी सामान्य मर्यादेपेक्षा जास्त आहे. हे इन्सुलिनची कमतरता किंवा प्री-डायबेटिस/मधुमेहाचे लक्षण असू शकते.';
        dietAdvice = [
          'साखर, गूळ, मिठाई, कोल्ड्रिंक्स आणि पांढरा भात मर्यादित करा.',
          'आहारात मेथी, कारले, जांभूळ बी पावडर आणि हिरव्या पालेभाज्यांचा समावेश करा.',
          'दररोज किमान ३० ते ४५ मिनिटे वेगाने चालण्याचा व्यायाम करा.'
        ];
        redFlags = ['अति तहान लागणे', 'वारंवार लघवी होणे', 'अचानक वजन कमी होणे किंवा थकवा'];
      } else {
        status = 'normal';
        simpleMeaning = 'तुमच्या रक्तातील साखरेची पातळी अगदी व्यवस्थित आणि नियंत्रणात आहे.';
        dietAdvice = ['सध्याचा संतुलित आहार आणि नियमित व्यायाम सुरू ठेवा.'];
        redFlags = ['वार्षिक नियमित तपासणी करा.'];
      }
    } else if (lowerTest.includes('hemoglobin') || lowerTest.includes('cbc') || lowerTest.includes('blood count')) {
      if (numVal > 0 && numVal < 11) {
        status = 'low';
        statusLabel = 'कमी (Low Hemoglobin / Anemia)';
        statusColor = '#f59e0b';
        gaugePercent = 30;
        simpleMeaning = 'शरीरातील रक्ताचे प्रमाण (Hb) सामान्यपेक्षा कमी आहे, ज्यामुळे ॲनिमिया (रक्तक्षय) होऊ शकतो आणि थकवा जाणवू शकतो.';
        dietAdvice = [
          'आहारात लोहयुक्त (Iron-rich) पदार्थ वाढवा: पालक, बीट, खजूर, डाळिंब आणि गूळ-शेंगदाणे खा.',
          'व्हिटॅमिन सी साठी लिंबू आणि संत्री घ्या, ज्यामुळे लोह लवकर शोषले जाते.'
        ];
        redFlags = ['सतत चक्कर येणे', 'श्वास घेण्यास त्रास होणे', 'नखे आणि डोळे पांढरे दिसणे'];
      } else {
        status = 'normal';
        simpleMeaning = 'तुमचे हिमोग्लोबिन आणि रक्तातील पेशी निरोगी मर्यादेत आहेत.';
        dietAdvice = ['पौष्टिक आणि संतुलित आहाराचे सेवन सुरू ठेवा.'];
        redFlags = ['काहीही काळजी करण्याचे कारण नाही.'];
      }
    } else if (lowerTest.includes('creatinine') || lowerTest.includes('kidney') || lowerTest.includes('renal')) {
      if (numVal > 1.3) {
        status = 'elevated';
        statusLabel = 'किंचित जास्त (Elevated / Kidney Filtration Alert)';
        statusColor = '#f43f5e';
        gaugePercent = 80;
        simpleMeaning = 'किडनीचे कार्य (फिल्ट्रेशन) दर्शवणारा सिरम क्रिएटिनिन किंचित वाढलेला आहे. शरीरातील पाण्याची कमतरता किंवा किडनीवरील ताण यामुळे असे होऊ शकते.';
        dietAdvice = [
          'डॉक्टरांच्या सल्ल्यानुसार पुरेसे पाणी (२ ते २.५ लिटर) प्या.',
          'अति मीठ आणि पेनकिलर (Painkiller) औषधांचे सेवन त्वरित टाळा.',
          'प्रथिनांचे (Protein) प्रमाण डॉक्टरांच्या सल्ल्याने नियंत्रित ठेवा.'
        ];
        redFlags = ['पायांवर किंवा चेहऱ्यावर सूज येणे', 'लघवीचे प्रमाण अचानक कमी होणे'];
      } else {
        status = 'normal';
        simpleMeaning = 'किडनीचे फिल्ट्रेशन कार्य १००% सुरळीत चालू आहे.';
        dietAdvice = ['रोज भरपूर पाणी पिण्याची सवय ठेवा.'];
        redFlags = ['किडनीचे आरोग्य उत्तम आहे.'];
      }
    } else if (lowerTest.includes('lipid') || lowerTest.includes('cholesterol') || lowerTest.includes('triglyceride')) {
      if (numVal > 200) {
        status = 'elevated';
        statusLabel = 'वाढलेले (High Cholesterol Alert)';
        statusColor = '#f43f5e';
        gaugePercent = 85;
        simpleMeaning = 'रक्तातील चरबीचे (कोलेस्ट्रॉल) प्रमाण वाढलेले आहे. दीर्घकाळ दुर्लक्ष केल्यास रक्तवाहिन्यांवर ताण येऊन हृदयाचे आरोग्य प्रभावित होऊ शकते.';
        dietAdvice = [
          'तळलेले, तेलकट, बेकरी आणि जंक फूड पूर्णपणे टाळा.',
          'आहारात लसूण, अक्रोड, बदाम आणि ओट्सचा समावेश करा.',
          'वजन नियंत्रणात ठेवा आणि रोज एरोबिक व्यायाम करा.'
        ];
        redFlags = ['छातीत जडपणा किंवा चालताना दम लागणे', 'अचानक घाम येणे'];
      } else {
        status = 'normal';
        simpleMeaning = 'कोलेस्ट्रॉल आणि ट्रायग्लिसराइड्स सुरक्षित मर्यादेत आहेत.';
        dietAdvice = ['कमी तेलाचा सकस आहार चालू ठेवा.'];
        redFlags = ['हृदयाचे आरोग्य सामान्य आहे.'];
      }
    } else {
      simpleMeaning = `अहवालातील मूल्य ${rpt.result_value} ${rpt.units || ''} हे संदर्भ मर्यादा (${refStr || 'मानक'}) नुसार नोंदवले गेले आहे.`;
      dietAdvice = ['सकस, ताजे आणि घरगुती अन्न सेवन करा.', 'पुरेशी झोप आणि ताणतणावमुक्त जीवनशैली ठेवा.'];
      redFlags = ['कोणतीही नवीन लक्षणे आढळल्यास संबंधित डॉक्टरांशी संपर्क साधा.'];
    }

    setExplainedData({
      report: rpt,
      status,
      statusLabel,
      statusColor,
      gaugePercent,
      simpleMeaning,
      dietAdvice,
      redFlags
    });
    setIsExplainerOpen(true);
  };

  const categories = ['All', ...new Set(reports.map(r => r.category).filter(Boolean))];

  const filteredReports = reports.filter(r => {
    const matchesCategory = filterCategory === 'All' || r.category === filterCategory;
    const matchesSearch = !searchTerm || 
      r.test_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.test_code?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
            {t('labReports.title', 'Diagnostic Laboratory Reports')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {t('labReports.subtitle', 'Comprehensive automated test panels, reference ranges, and verified clinical interpretations.')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {canCreateReport && (
            <button
              onClick={handleOpenAddModal}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}
            >
              <Plus size={16} /> {t('labReports.recordNewBtn', 'Record New Lab Result')}
            </button>
          )}

          <button
            onClick={loadReports}
            className="btn btn-outline"
            style={{ padding: '10px' }}
            title={t('common.refresh', 'Refresh')}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--bg-card)',
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`status-pill ${filterCategory === cat ? 'active' : ''}`}
              style={{
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderRadius: '20px',
                cursor: 'pointer',
                background: filterCategory === cat ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                color: filterCategory === cat ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="रुग्ण किंवा टेस्ट शोधा..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} color="var(--primary)" />
          <div>प्रयोगशाळा निकाल लोड होत आहेत... (Loading laboratory records)</div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
          <FlaskConical size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h3>कोणतेही लॅब रिपोर्ट्स आढळले नाहीत</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            निवडलेल्या फिल्टरनुसार कोणतेही अहवाल उपलब्ध नाहीत.
          </p>
        </div>
      ) : (
        <div className="lab-reports-grid">
          {filteredReports.map((rpt) => {
            const isCompleted = rpt.status === 'completed';

            return (
              <div
                key={rpt.id}
                className="glass-card glass-card-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  borderTop: `3px solid ${isCompleted ? '#10b981' : '#f59e0b'}`
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>
                      {rpt.category || 'Diagnostic'}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {rpt.test_name}
                    </h3>
                  </div>

                  <span className={`badge ${isCompleted ? 'badge-emerald' : 'badge-amber'}`}>
                    {rpt.status}
                  </span>
                </div>

                {/* Patient & Doctor metadata */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontSize: '0.8rem'
                }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>PATIENT</div>
                    <div style={{ fontWeight: '600' }}>{rpt.patient_name}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>ORDERING DOCTOR</div>
                    <div style={{ fontWeight: '600' }}>{rpt.doctor_name || 'Attending Physician'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>TEST DATE</div>
                    <div style={{ color: 'var(--text-primary)' }}>{rpt.test_date}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>LAB CODE</div>
                    <div style={{ fontFamily: 'var(--font-mono)' }}>{rpt.test_code || 'LAB-001'}</div>
                  </div>
                </div>

                {/* Result Value Box */}
                <div style={{
                  background: 'rgba(6, 182, 212, 0.05)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                  borderRadius: '8px',
                  padding: '12px'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Observed Diagnostic Value
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {rpt.result_value} {rpt.units ? <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{rpt.units}</span> : null}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Reference Range: <span style={{ color: 'var(--text-secondary)' }}>{rpt.reference_range}</span>
                  </div>
                </div>

                {/* Remarks */}
                {rpt.remarks && (
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    <strong>Clinical Remarks: </strong> {rpt.remarks}
                  </div>
                )}

                {/* 1-Click AI Report Explainer Button */}
                <button
                  type="button"
                  onClick={() => handleExplainReport(rpt)}
                  className="btn btn-outline btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    borderColor: 'rgba(168, 85, 247, 0.4)',
                    color: '#c084fc',
                    background: 'rgba(168, 85, 247, 0.08)',
                    fontWeight: '700',
                    marginTop: '4px',
                    padding: '8px 12px',
                    borderRadius: '8px'
                  }}
                >
                  <Sparkles size={15} color="#c084fc" />
                  <span>🤖 AI द्वारे अहवाल समजावून घ्या (AI Explainer)</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Lab Report Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FlaskConical size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>
                  नवीन लॅब चाचणी निकाल नोंदवा (Add Lab Result)
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#f87171',
                fontSize: '0.85rem',
                marginBottom: '16px'
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Patient Selection */}
              <div>
                <label className="form-label">रुग्ण निवडा (Select Patient) *</label>
                <select
                  className="form-input"
                  value={newReport.patient_id}
                  onChange={(e) => setNewReport({ ...newReport, patient_id: e.target.value })}
                  required
                >
                  <option value="">-- रुग्ण निवडा --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.gender || 'रुग्ण'}, {p.phone || 'Phone N/A'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Lab Test Selection */}
              <div>
                <label className="form-label">लॅब टेस्ट निवडा (Select Test) *</label>
                <select
                  className="form-input"
                  value={newReport.test_id}
                  onChange={handleTestChange}
                  required
                >
                  <option value="">-- चाचणी निवडा --</option>
                  {labTests.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.test_name} ({t.category} • {t.test_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Observed Value & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">चाचणी निकाल (Result Value) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="उदा. 14.5 g/dL किंवा 105 mg/dL"
                    value={newReport.result_value}
                    onChange={(e) => setNewReport({ ...newReport, result_value: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">चाचणी तारीख (Date) *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newReport.test_date}
                    onChange={(e) => setNewReport({ ...newReport, test_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Reference Range & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Reference Range</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="उदा. 12.0 - 16.0 g/dL"
                    value={newReport.reference_range}
                    onChange={(e) => setNewReport({ ...newReport, reference_range: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">स्थिती (Status) *</label>
                  <select
                    className="form-input"
                    value={newReport.status}
                    onChange={(e) => setNewReport({ ...newReport, status: e.target.value })}
                  >
                    <option value="completed">Completed (पूर्ण)</option>
                    <option value="pending">Pending (प्रलंबित)</option>
                  </select>
                </div>
              </div>

              {/* Clinical Remarks */}
              <div>
                <label className="form-label">Clinical Remarks / शेरा</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="उदा. Within normal physiological limits. No acute abnormality."
                  value={newReport.remarks}
                  onChange={(e) => setNewReport({ ...newReport, remarks: e.target.value })}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  रद्द करा (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 2, fontWeight: '700' }}
                >
                  {submitting ? 'जतन करत आहे...' : 'निकाल जतन करा (Save Result)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
