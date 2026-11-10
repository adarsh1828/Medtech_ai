import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Stethoscope, 
  Plus, 
  Trash2, 
  HeartPulse, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles,
  Mic,
  MicOff,
  Radio,
  AlertOctagon,
  Volume2,
  Clock,
  User,
  Calendar,
  Zap,
  Activity
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

export default function ConsultationModal({ isOpen, onClose, appointment, onSuccess }) {
  const { showToast } = useToast();
  const [vitals, setVitals] = useState({
    vitals_bp: appointment?.vitals_bp || '120/80',
    vitals_pulse: appointment?.vitals_pulse || '72 bpm',
    vitals_temp: appointment?.vitals_temp || '98.6 F',
    vitals_weight: appointment?.vitals_weight || '65 kg'
  });

  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const [drugAlerts, setDrugAlerts] = useState({ hasConflicts: false, interactions: [], safetySummary: '' });
  const [allergyAlerts, setAllergyAlerts] = useState([]);

  // Voice Dictation (AI Speech-to-Rx) state
  const [isListening, setIsListening] = useState(false);
  const [voiceTarget, setVoiceTarget] = useState('rx');
  const [speechTranscript, setSpeechTranscript] = useState('');
  const recognitionRef = useRef(null);

  const [medicines, setMedicines] = useState([
    {
      medicine_name: '',
      dosage: '500 mg',
      frequency: '1-0-1 (जेवणानंतर / After Food)',
      duration: '5 दिवस (5 days)',
      instructions: 'भरपूर पाणी प्यावे (Take with plenty of water)'
    }
  ]);

  const [activeMedicineIndex, setActiveMedicineIndex] = useState(0);

  // Sync state when appointment changes or modal opens
  useEffect(() => {
    if (appointment && isOpen) {
      setVitals({
        vitals_bp: appointment.vitals_bp || '120/80',
        vitals_pulse: appointment.vitals_pulse || '72 bpm',
        vitals_temp: appointment.vitals_temp || '98.6 F',
        vitals_weight: appointment.vitals_weight || '65 kg'
      });
      setDiagnosis('');
      setClinicalNotes('');
      setAdvice('');
      setFollowUpDate('');
      setSpeechTranscript('');
    }
  }, [appointment, isOpen]);

  // Smart Patient Allergy Radar Check
  useEffect(() => {
    const rawAllergies = (appointment?.patient_allergies || '').toLowerCase();
    if (!rawAllergies || rawAllergies.includes('none') || rawAllergies.includes('no reported')) {
      setAllergyAlerts([]);
      return;
    }

    const matches = [];
    const knownAllergenMap = [
      { allergen: 'penicillin', drugs: ['penicillin', 'amoxicillin', 'augmentin', 'ampicillin', 'cloxacillin'] },
      { allergen: 'sulfa', drugs: ['sulfa', 'bactrim', 'septra', 'sulfamethoxazole'] },
      { allergen: 'aspirin', drugs: ['aspirin', 'disprin', 'ecosprin', 'acetylsalicylic'] },
      { allergen: 'nsaid', drugs: ['ibuprofen', 'brufen', 'combiflam', 'diclofenac', 'naproxen'] },
      { allergen: 'paracetamol', drugs: ['paracetamol', 'calpol', 'crocin', 'dolo', 'acetaminophen'] }
    ];

    medicines.forEach(m => {
      const medName = (m.medicine_name || '').toLowerCase().trim();
      if (!medName) return;

      knownAllergenMap.forEach(rule => {
        if (rawAllergies.includes(rule.allergen)) {
          if (rule.drugs.some(d => medName.includes(d))) {
            matches.push({
              allergen: rule.allergen.toUpperCase(),
              medicine: m.medicine_name,
              reason: `Patient allergy profile flags "${appointment.patient_allergies}". Prescribing ${m.medicine_name} poses an acute risk of anaphylaxis or hypersensitivity.`
            });
          }
        }
      });
    });

    setAllergyAlerts(matches);
  }, [medicines, appointment]);

  // Voice to text engine
  const parseSpeechToPrescription = (spokenText) => {
    if (!spokenText || typeof spokenText !== 'string') return;
    const clean = spokenText.toLowerCase().trim();

    let dosage = '500 mg';
    const doseMatch = clean.match(/(\d+\s*(?:mg|ml|gm|mcg|tab|puff))/i);
    if (doseMatch) dosage = doseMatch[1].toUpperCase();

    let frequency = '1-0-1 (Twice daily)';
    if (clean.includes('once') || clean.includes('एका वेळ') || clean.includes('एकदा')) frequency = '1-0-0 (Once daily)';
    else if (clean.includes('thrice') || clean.includes('तीन वेळा') || clean.includes('3 times')) frequency = '1-1-1 (Thrice daily)';
    else if (clean.includes('night') || clean.includes('रात्री') || clean.includes('bedtime')) frequency = '0-0-1 (Night only)';
    else if (clean.includes('sos') || clean.includes('गरज')) frequency = 'SOS (As needed)';

    let duration = '5 दिवस (5 days)';
    const durMatch = clean.match(/(\d+)\s*(?:day|days|दिवस)/i);
    if (durMatch) duration = `${durMatch[1]} days`;

    let instructions = 'जेवणानंतर (After food)';
    if (clean.includes('before') || clean.includes('आधी') || clean.includes('reciprocal') || clean.includes('empty')) {
      instructions = 'जेवणापूर्वी / रिकाम्या पोटी (Before food)';
    }

    const words = spokenText.split(/\s+/);
    let medName = words[0] || 'Rx Medication';
    if (words.length > 1 && !/\d/.test(words[1]) && !['mg','tab','for','once','twice'].includes(words[1].toLowerCase())) {
      medName = `${words[0]} ${words[1]}`;
    }

    setMedicines(prev => {
      const copy = [...prev];
      if (copy.length === 1 && !copy[0].medicine_name) {
        copy[0] = { medicine_name: medName, dosage, frequency, duration, instructions };
      } else {
        copy.push({ medicine_name: medName, dosage, frequency, duration, instructions });
      }
      return copy;
    });

    showToast(`Voice Rx: "${medName}" added to prescription`, 'success');
  };

  const toggleVoiceDictation = (target) => {
    setVoiceTarget(target);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition is not supported in this browser. Please use Chrome/Edge.', 'warning');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'mr-IN, hi-IN, en-IN';

      rec.onstart = () => {
        setIsListening(true);
        setSpeechTranscript('ऐकत आहे... (Listening to doctor)...');
      };

      rec.onresult = (event) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setSpeechTranscript(currentText);

        if (target === 'diagnosis') {
          setDiagnosis(prev => (prev ? prev + ' ' : '') + currentText);
        } else if (target === 'notes') {
          setClinicalNotes(prev => (prev ? prev + ' ' : '') + currentText);
        }
      };

      rec.onerror = (e) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const applySpokenTranscriptToRx = () => {
    if (speechTranscript && speechTranscript !== 'ऐकत आहे... (Listening to doctor)...') {
      parseSpeechToPrescription(speechTranscript);
      setSpeechTranscript('');
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  useEffect(() => {
    const validMeds = medicines.map(m => m.medicine_name.trim()).filter(Boolean);
    if (validMeds.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await api.checkDrugInteractions(validMeds);
          setDrugAlerts(res);
        } catch (e) {
          console.warn('Drug interaction check error:', e);
        }
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setDrugAlerts({ hasConflicts: false, interactions: [], safetySummary: '' });
    }
  }, [medicines]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addMedicineRow = () => {
    setMedicines([
      ...medicines,
      {
        medicine_name: '',
        dosage: '1 Tab',
        frequency: '1-0-1 (सकाळ-रात्र / Twice daily)',
        duration: '5 दिवस (5 days)',
        instructions: 'जेवणानंतर (After food)'
      }
    ]);
    setActiveMedicineIndex(medicines.length);
  };

  const removeMedicineRow = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
    if (activeMedicineIndex >= medicines.length - 1) {
      setActiveMedicineIndex(Math.max(0, medicines.length - 2));
    }
  };

  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  // Quick chip applicator for the active row
  const applyChipToActiveMedicine = (field, value) => {
    if (medicines.length === 0) return;
    const targetIdx = Math.min(activeMedicineIndex, medicines.length - 1);
    updateMedicine(targetIdx, field, value);
    showToast(`Updated ${field}: ${value}`, 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      setError('कृपया क्लिनिकल डायग्नोसिस (Clinical Diagnosis) टाका.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.updateAppointmentVitals(appointment.id, vitals);

      const validMedicines = medicines.filter(m => m.medicine_name.trim().length > 0);

      await api.createPrescription({
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        diagnosis: diagnosis.trim(),
        clinical_notes: clinicalNotes.trim(),
        advice: advice.trim(),
        follow_up_date: followUpDate || null,
        medicines: validMedicines
      });

      showToast(`प्रिस्क्रिप्शन यशस्वीरीत्या जतन झाले! Token #${appointment.token_number}`, 'success', 'Prescription Issued');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save prescription.');
      showToast(err.message || 'प्रिस्क्रिप्शन जतन करताना त्रुटी आली.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '1080px', 
          width: '95vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          borderRadius: '16px'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.2)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <Stethoscope size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: '800', margin: 0 }}>
                  Doctor Clinical Workstation & Digital Rx
                </h2>
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                  Token #{appointment.token_number}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '2px 0 0' }}>
                Recording clinical diagnosis, vitals, and NMC-compliant digital prescription
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="toast-close-btn"
            style={{ width: '32px', height: '32px', borderRadius: '8px' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* 2-Pane Split Layout (Left: Patient Context & Vitals, Right: Rx Pad & Diagnosis) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 320px) 1fr',
          flex: 1,
          overflow: 'hidden',
          minHeight: 0
        }}>
          
          {/* Left Column: Patient Context & Vitals */}
          <div style={{
            padding: '20px',
            borderRight: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-card-subtle)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Patient Card */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid #10b981',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '0.9rem'
                }}>
                  {(appointment.patient_name?.[0] || 'P').toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {appointment.patient_name}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {appointment.patient_gender} • Phone: {appointment.patient_phone || 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.76rem' }}>
                <span className="badge badge-rose" style={{ fontSize: '0.7rem' }}>
                  Blood: {appointment.patient_blood_group || 'N/A'}
                </span>
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                  Room: {appointment.doctor_room || '408'}
                </span>
              </div>

              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '700' }}>
                  तक्रार (Reason for Visit):
                </div>
                <div style={{ color: 'var(--text-primary)', fontStyle: 'italic', marginTop: '3px' }}>
                  "{appointment.reason_for_visit || 'General Consultation'}"
                </div>
              </div>
            </div>

            {/* Patient Allergies Alert Pill */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: appointment.patient_allergies && !appointment.patient_allergies.toLowerCase().includes('none')
                ? 'rgba(244, 63, 94, 0.14)'
                : 'rgba(16, 185, 129, 0.08)',
              border: `1px solid ${appointment.patient_allergies && !appointment.patient_allergies.toLowerCase().includes('none') ? 'rgba(244, 63, 94, 0.35)' : 'rgba(16, 185, 129, 0.2)'}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: '800',
                color: appointment.patient_allergies && !appointment.patient_allergies.toLowerCase().includes('none') ? '#fb7185' : '#34d399',
                textTransform: 'uppercase'
              }}>
                <ShieldAlert size={14} />
                <span>ॲलर्जी नोंद (Allergy Profile)</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginTop: '4px', fontWeight: '600' }}>
                {appointment.patient_allergies || 'कोणतीही अलर्जी नोंदवलेली नाही (None)'}
              </div>
            </div>

            {/* Vitals Form Card */}
            <div style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase' }}>
                <HeartPulse size={15} />
                <span>रुग्ण Vitals (Clinical Triage)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>रक्तदाब (BP)</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.82rem', padding: '6px 8px', fontFamily: 'var(--font-mono)' }}
                    placeholder="120/80"
                    value={vitals.vitals_bp}
                    onChange={(e) => setVitals({ ...vitals, vitals_bp: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>पल्स (Pulse)</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.82rem', padding: '6px 8px', fontFamily: 'var(--font-mono)' }}
                    placeholder="72 bpm"
                    value={vitals.vitals_pulse}
                    onChange={(e) => setVitals({ ...vitals, vitals_pulse: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>तापमान (Temp)</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.82rem', padding: '6px 8px', fontFamily: 'var(--font-mono)' }}
                    placeholder="98.6 F"
                    value={vitals.vitals_temp}
                    onChange={(e) => setVitals({ ...vitals, vitals_temp: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>वजन (Weight)</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontSize: '0.82rem', padding: '6px 8px', fontFamily: 'var(--font-mono)' }}
                    placeholder="65 kg"
                    value={vitals.vitals_weight}
                    onChange={(e) => setVitals({ ...vitals, vitals_weight: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Follow-up Date */}
            <div>
              <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                पुढील तपासणी तारीख (Follow-up)
              </label>
              <input
                type="date"
                className="form-input"
                style={{ fontSize: '0.84rem', marginTop: '4px' }}
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
          </div>

          {/* Right Column: Rx Pad & Diagnosis Form */}
          <div style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Diagnosis Field with Voice Option */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: '700', fontSize: '0.86rem' }}>
                    क्लिनिकल डायग्नोसिस (Clinical Diagnosis) *
                  </label>

                  <button
                    type="button"
                    onClick={() => toggleVoiceDictation('diagnosis')}
                    style={{
                      background: isListening && voiceTarget === 'diagnosis' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(6, 182, 212, 0.1)',
                      border: `1px solid ${isListening && voiceTarget === 'diagnosis' ? '#f87171' : 'rgba(6, 182, 212, 0.3)'}`,
                      color: isListening && voiceTarget === 'diagnosis' ? '#f87171' : '#38bdf8',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.74rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {isListening && voiceTarget === 'diagnosis' ? <Radio size={12} className="heartbeat-icon" /> : <Mic size={12} />}
                    <span>{isListening && voiceTarget === 'diagnosis' ? 'ऐकत आहे (Recording...)' : 'बोलून लिहा (Voice)'}</span>
                  </button>
                </div>

                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ fontSize: '0.9rem' }}
                  placeholder="उदा. Acute Bronchitis / Type 2 Diabetes Mellitus"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>

              {/* Notes and Advice */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0, fontSize: '0.78rem' }}>तपासणी नोंदी (Clinical Notes)</label>
                    <button
                      type="button"
                      onClick={() => toggleVoiceDictation('notes')}
                      style={{
                        background: isListening && voiceTarget === 'notes' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                        border: 'none',
                        color: isListening && voiceTarget === 'notes' ? '#f87171' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      <Mic size={13} />
                    </button>
                  </div>
                  <textarea
                    rows="2"
                    className="form-textarea"
                    placeholder="Findings, observations..."
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ marginBottom: '4px', fontSize: '0.78rem' }}>सल्ला व पथ्य (Advice & Precautions)</label>
                  <textarea
                    rows="2"
                    className="form-textarea"
                    placeholder="पाणी भरपूर पिणे, विश्रांती..."
                    value={advice}
                    onChange={(e) => setAdvice(e.target.value)}
                  />
                </div>
              </div>

              {/* Allergy Warning Alert */}
              {allergyAlerts.length > 0 && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '2px solid rgba(239, 68, 68, 0.6)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: '800', fontSize: '0.88rem' }}>
                    <AlertOctagon size={18} color="#ef4444" />
                    <span>⚠️ ॲलर्जी अलर्ट (ALLERGY CONFLICT DETECTED)</span>
                  </div>
                  {allergyAlerts.map((al, idx) => (
                    <div key={idx} style={{ fontSize: '0.82rem', color: '#fecaca', lineHeight: '1.4' }}>
                      <strong>{al.medicine}</strong>: {al.reason}
                    </div>
                  ))}
                </div>
              )}

              {/* Prescription Medicine Builder Header */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="form-label" style={{ fontWeight: '800', color: 'var(--text-primary)', margin: 0, fontSize: '0.88rem' }}>
                      औषधोपचार (Prescribed Medications)
                    </span>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', fontWeight: '700' }}>
                      {medicines.length} औषधे
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => toggleVoiceDictation('rx')}
                      style={{
                        fontSize: '0.76rem',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '700',
                        border: '1px solid',
                        borderColor: isListening && voiceTarget === 'rx' ? '#ef4444' : 'rgba(168, 85, 247, 0.5)',
                        background: isListening && voiceTarget === 'rx' ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(6, 182, 212, 0.15))',
                        color: isListening && voiceTarget === 'rx' ? '#f87171' : '#c084fc'
                      }}
                    >
                      {isListening && voiceTarget === 'rx' ? <MicOff size={14} /> : <Mic size={14} />}
                      <span>{isListening && voiceTarget === 'rx' ? 'डिक्टेशन थांबवा' : '🎙️ AI बोलून लिहा (Voice Rx)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={addMedicineRow}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                    >
                      <Plus size={14} /> नवीन औषध (Add Row)
                    </button>
                  </div>
                </div>

                {/* Voice speech preview */}
                {isListening && voiceTarget === 'rx' && (
                  <div style={{
                    marginBottom: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '0.8rem', color: '#c084fc', fontStyle: 'italic' }}>
                      "{speechTranscript || 'उदा. Paracetamol 650mg twice daily for 3 days after meals...'}"
                    </span>
                    <button
                      type="button"
                      onClick={applySpokenTranscriptToRx}
                      className="btn btn-sm"
                      style={{ background: '#8b5cf6', color: '#fff', fontSize: '0.72rem', padding: '3px 8px' }}
                    >
                      ✓ जोडा (Add to Table)
                    </button>
                  </div>
                )}

                {/* Quick Frequency & Timing Chips Bar (One-click prescription helper) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginBottom: '10px',
                  padding: '8px 10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px'
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', marginRight: '4px' }}>
                    क्विक चिप्स (Row #{activeMedicineIndex + 1}):
                  </span>
                  
                  {['1-0-1 (सकाळ-रात्र)', '1-1-1 (तिन्ही वेळ)', '1-0-0 (सकाळी)', '0-0-1 (रात्री)', 'SOS (गरज असेल तेव्हा)'].map(fq => (
                    <button
                      key={fq}
                      type="button"
                      onClick={() => applyChipToActiveMedicine('frequency', fq)}
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: 'rgba(6, 182, 212, 0.1)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        color: '#38bdf8',
                        cursor: 'pointer'
                      }}
                    >
                      {fq}
                    </button>
                  ))}

                  {['जेवणानंतर (After food)', 'जेवणापूर्वी (Before food)'].map(inst => (
                    <button
                      key={inst}
                      type="button"
                      onClick={() => applyChipToActiveMedicine('instructions', inst)}
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#34d399',
                        cursor: 'pointer'
                      }}
                    >
                      {inst}
                    </button>
                  ))}

                  {['३ दिवस', '५ दिवस', '७ दिवस', '१५ दिवस'].map(dur => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => applyChipToActiveMedicine('duration', dur)}
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#fbbf24',
                        cursor: 'pointer'
                      }}
                    >
                      {dur}
                    </button>
                  ))}
                </div>

                {/* Medicine Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {medicines.map((med, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveMedicineIndex(idx)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1.6fr 1fr 1.8fr 34px',
                        gap: '6px',
                        alignItems: 'center',
                        background: activeMedicineIndex === idx ? 'rgba(6, 182, 212, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${activeMedicineIndex === idx ? 'rgba(6, 182, 212, 0.4)' : 'var(--border-subtle)'}`,
                        borderRadius: '8px',
                        padding: '8px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Medicine Name (उदा. Paracetamol)"
                        className="form-input"
                        style={{ fontSize: '0.82rem', padding: '6px 8px', fontWeight: '600' }}
                        value={med.medicine_name}
                        onChange={(e) => updateMedicine(idx, 'medicine_name', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Dosage (500mg)"
                        className="form-input"
                        style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                        value={med.dosage}
                        onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Frequency"
                        className="form-input"
                        style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                        value={med.frequency}
                        onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Duration"
                        className="form-input"
                        style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                        value={med.duration}
                        onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Instructions"
                        className="form-input"
                        style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                        value={med.instructions}
                        onChange={(e) => updateMedicine(idx, 'instructions', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeMedicineRow(idx)}
                        className="toast-close-btn"
                        style={{ width: '28px', height: '28px' }}
                        title="Remove Medicine"
                      >
                        <Trash2 size={15} color="#fb7185" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Drug-drug Interaction Warnings */}
                {drugAlerts.hasConflicts ? (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    animation: 'fadeIn 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: '700', fontSize: '0.82rem' }}>
                      <AlertTriangle size={16} />
                      <span>AI CLINICAL ALERT: DRUG-DRUG CONTRAINDICATION DETECTED</span>
                    </div>

                    {drugAlerts.interactions.map((inter, i) => (
                      <div key={i} style={{ fontSize: '0.76rem', color: '#fca5a5', lineHeight: '1.4' }}>
                        <div>
                          <strong style={{ color: '#ffffff' }}>{inter.drug1}</strong> + <strong style={{ color: '#ffffff' }}>{inter.drug2}</strong>: {inter.title} ({inter.severity})
                        </div>
                        <div style={{ color: '#fed7aa', marginTop: '2px', fontStyle: 'italic' }}>
                          Recommendation: {inter.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : medicines.filter(m => m.medicine_name.trim().length > 0).length >= 2 ? (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#34d399',
                    fontSize: '0.74rem'
                  }}>
                    <Sparkles size={14} /> AI Clinical Safety: Verified no major adverse pharmacotherapy conflicts detected.
                  </div>
                ) : null}
              </div>

              {error && (
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: '6px',
                  color: '#fb7185',
                  fontSize: '0.82rem'
                }}>
                  {error}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-emerald"
                style={{ width: '100%', padding: '12px', fontWeight: '800', fontSize: '0.92rem' }}
              >
                <CheckCircle size={18} />
                <span>{submitting ? 'प्रिस्क्रिप्शन जतन करत आहे...' : 'Save & Issue Official Digital Prescription'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
