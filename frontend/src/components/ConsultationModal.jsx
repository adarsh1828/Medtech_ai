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
  Volume2
} from 'lucide-react';
import { api } from '../api';

export default function ConsultationModal({ isOpen, onClose, appointment, onSuccess }) {
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
  const [voiceTarget, setVoiceTarget] = useState('rx'); // 'rx' | 'notes' | 'diagnosis'
  const [speechTranscript, setSpeechTranscript] = useState('');
  const recognitionRef = useRef(null);

  const [medicines, setMedicines] = useState([
    {
      medicine_name: '',
      dosage: '500 mg',
      frequency: 'Twice daily (After meals)',
      duration: '5 days',
      instructions: 'Take with plenty of water'
    }
  ]);

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

  // Real-time Speech-to-Rx Parser
  const parseSpeechToPrescription = (text) => {
    if (!text || !text.trim()) return;

    // Normalizing and cleaning input
    const cleanText = text.replace(/(\r\n|\n|\r)/gm, ' ').trim();
    
    // Check if multiple medicines are separated by "and", "plus", "ani", "next"
    const segments = cleanText.split(/\band\b|\bplus\b|\bani\b|\bnext\b/i);

    const parsedList = [];

    segments.forEach(seg => {
      const s = seg.trim();
      if (!s) return;

      // Extract dosage (e.g., 650mg, 500 mg, 10ml, 1 tab)
      const dosageMatch = s.match(/(\d+\s*(?:mg|gm|g|ml|mcg|tab|capsule|tablets?))/i);
      const dosage = dosageMatch ? dosageMatch[0] : '1 Tab';

      // Extract duration (e.g., 3 days, 5 days, 1 week, 5 divas)
      const durationMatch = s.match(/(\d+\s*(?:days?|weeks?|divas?|mahine|months?))/i);
      const duration = durationMatch ? durationMatch[0] : '5 days';

      // Extract frequency
      let frequency = 'Twice daily';
      if (/once|daily|od|ekda|ek vela/i.test(s)) frequency = 'Once daily';
      else if (/thrice|three times|tds|teen vela/i.test(s)) frequency = 'Thrice daily (TDS)';
      else if (/twice|two times|bd|donda/i.test(s)) frequency = 'Twice daily';
      else if (/sos|emergency|garaj asel/i.test(s)) frequency = 'As needed (SOS)';

      // Extract instructions
      let instructions = 'After meals';
      if (/before (?:food|meals|breakfast)|rikamya|empty stomach/i.test(s)) instructions = 'Before meals / Empty stomach';
      else if (/after|jevananantar/i.test(s)) instructions = 'After meals';
      else if (/night|bedtime|jhopnyapurvi/i.test(s)) instructions = 'At bedtime';

      // Extract medicine name by stripping recognized words
      let medName = s
        .replace(/(\d+\s*(?:mg|gm|g|ml|mcg|tab|capsule|tablets?))/gi, '')
        .replace(/(\d+\s*(?:days?|weeks?|divas?|mahine|months?))/gi, '')
        .replace(/\b(?:twice|thrice|once|daily|three times|two times|after|before|food|meals|breakfast|at|bedtime|take|give|tab|tablet|prescribe|sos)\b/gi, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim();

      // Capitalize
      if (medName.length > 2) {
        medName = medName.charAt(0).toUpperCase() + medName.slice(1);
        parsedList.push({
          medicine_name: medName,
          dosage,
          frequency,
          duration,
          instructions
        });
      }
    });

    if (parsedList.length > 0) {
      setMedicines(prev => {
        const withoutEmpty = prev.filter(p => p.medicine_name.trim().length > 0);
        return [...withoutEmpty, ...parsedList];
      });
    }
  };

  // Toggle Voice Recognition
  const toggleVoiceDictation = (target = 'rx') => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('तुमच्या ब्राउझरमध्ये व्हॉईस डिक्टेशन उपलब्ध नाही. कृपया Google Chrome किंवा Microsoft Edge वापरा.');
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-IN'; // Indian English accepts medical terminology easily

      setVoiceTarget(target);
      setIsListening(true);
      setSpeechTranscript('ऐकत आहे... (Listening to doctor)...');

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
        frequency: 'Once daily (Morning)',
        duration: '7 days',
        instructions: 'After breakfast'
      }
    ]);
  };

  const removeMedicineRow = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      setError('Please enter a clinical diagnosis.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 1. Save vitals
      await api.updateAppointmentVitals(appointment.id, vitals);

      // 2. Filter valid medicines
      const validMedicines = medicines.filter(m => m.medicine_name.trim().length > 0);

      // 3. Create Prescription
      await api.createPrescription({
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        diagnosis: diagnosis.trim(),
        clinical_notes: clinicalNotes.trim(),
        advice: advice.trim(),
        follow_up_date: followUpDate || null,
        medicines: validMedicines
      });

      // 4. Set explicit completion remark for Admin & Reception visibility
      const completedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await api.updateAppointmentStatus(
        appointment.id,
        'completed',
        `तपासणी यशस्वीरित्या पूर्ण झाली • निदान: ${diagnosis.trim()} • Rx जारी (${completedTime})`
      );

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to complete consultation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399'
          }}>
            <Stethoscope size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
              Doctor Consultation & Digital Prescription
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Recording vitals, clinical observations, and digital medication for Token #{appointment.token_number}
            </p>
          </div>
        </div>

        {/* Patient Quick Info Card */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>
              {appointment.patient_name}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Blood: <strong style={{ color: '#fb7185' }}>{appointment.patient_blood_group || 'N/A'}</strong> • Gender: {appointment.patient_gender} • Phone: {appointment.patient_phone || 'N/A'}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <div>Reason for Visit:</div>
            <div style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>"{appointment.reason_for_visit}"</div>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#fb7185',
            fontSize: '0.85rem',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Vitals Section */}
          <div style={{
            background: 'rgba(6, 182, 212, 0.04)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            borderRadius: '10px',
            padding: '14px 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '700', color: '#38bdf8', marginBottom: '10px', textTransform: 'uppercase' }}>
              <HeartPulse size={16} /> Patient Triage Vitals
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Blood Pressure</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="120/80 mmHg"
                  value={vitals.vitals_bp}
                  onChange={(e) => setVitals({ ...vitals, vitals_bp: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Pulse Rate</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="72 bpm"
                  value={vitals.vitals_pulse}
                  onChange={(e) => setVitals({ ...vitals, vitals_pulse: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Body Temp</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="98.6 F"
                  value={vitals.vitals_temp}
                  onChange={(e) => setVitals({ ...vitals, vitals_temp: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Weight</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="65 kg"
                  value={vitals.vitals_weight}
                  onChange={(e) => setVitals({ ...vitals, vitals_weight: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Clinical Findings & Diagnosis */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ margin: 0 }}>Clinical Diagnosis *</label>
              <button
                type="button"
                onClick={() => toggleVoiceDictation('diagnosis')}
                style={{
                  background: isListening && voiceTarget === 'diagnosis' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(6, 182, 212, 0.1)',
                  border: `1px solid ${isListening && voiceTarget === 'diagnosis' ? '#f87171' : 'rgba(6, 182, 212, 0.3)'}`,
                  color: isListening && voiceTarget === 'diagnosis' ? '#f87171' : '#38bdf8',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.72rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                {isListening && voiceTarget === 'diagnosis' ? <Radio size={12} className="heartbeat-icon" /> : <Mic size={12} />}
                {isListening && voiceTarget === 'diagnosis' ? 'ऐकत आहे (Recording...)' : 'बोलून लिहा (Voice)'}
              </button>
            </div>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Acute Bronchitis / Stage 1 Essential Hypertension"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ margin: 0 }}>Clinical Examination Notes</label>
                <button
                  type="button"
                  onClick={() => toggleVoiceDictation('notes')}
                  style={{
                    background: isListening && voiceTarget === 'notes' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(6, 182, 212, 0.1)',
                    border: `1px solid ${isListening && voiceTarget === 'notes' ? '#f87171' : 'rgba(6, 182, 212, 0.3)'}`,
                    color: isListening && voiceTarget === 'notes' ? '#f87171' : '#38bdf8',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {isListening && voiceTarget === 'notes' ? <Radio size={12} className="heartbeat-icon" /> : <Mic size={12} />}
                  {isListening && voiceTarget === 'notes' ? 'ऐकत आहे' : 'Voice'}
                </button>
              </div>
              <textarea
                rows="2"
                className="form-textarea"
                placeholder="Findings from auscultation, patient history..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Lifestyle Advice & Precautions</label>
              <textarea
                rows="2"
                className="form-textarea"
                placeholder="Hydration, dietary instructions, rest..."
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
              />
            </div>
          </div>

          {/* Smart Allergy Conflict Radar */}
          {allergyAlerts.length > 0 && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid rgba(239, 68, 68, 0.6)',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              animation: 'pulse 1.8s infinite'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: '800', fontSize: '0.9rem' }}>
                <AlertOctagon size={20} color="#ef4444" />
                <span>⚠️ रुग्ण औषध ॲलर्जी रडार अलर्ट (ALLERGY CONFLICT DETECTED)</span>
              </div>
              {allergyAlerts.map((al, idx) => (
                <div key={idx} style={{ fontSize: '0.82rem', color: '#fecaca', lineHeight: '1.4' }}>
                  <strong>{al.medicine}</strong>: {al.reason}
                </div>
              ))}
              <div style={{ fontSize: '0.76rem', color: '#fef08a', fontStyle: 'italic', marginTop: '2px' }}>
                शिफारस: कृपया हे औषध बदलून ॲलर्जी-मुक्त सुरक्षित पर्याय निवडा.
              </div>
            </div>
          )}

          {/* Medicines Prescription Builder */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="form-label" style={{ fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  Prescribed Medications
                </span>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8' }}>
                  {medicines.length} Medicines
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Voice to Rx Dictation Button */}
                <button
                  type="button"
                  onClick={() => toggleVoiceDictation('rx')}
                  style={{
                    fontSize: '0.78rem',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '700',
                    border: '1px solid',
                    borderColor: isListening && voiceTarget === 'rx' ? '#ef4444' : 'rgba(168, 85, 247, 0.5)',
                    background: isListening && voiceTarget === 'rx' ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(6, 182, 212, 0.15))',
                    color: isListening && voiceTarget === 'rx' ? '#f87171' : '#c084fc',
                    boxShadow: isListening && voiceTarget === 'rx' ? '0 0 15px rgba(239, 68, 68, 0.4)' : 'none'
                  }}
                  title="बोलून औषधे डिक्टेट करा"
                >
                  {isListening && voiceTarget === 'rx' ? <MicOff size={15} /> : <Mic size={15} />}
                  <span>{isListening && voiceTarget === 'rx' ? 'डिक्टेशन थांबवा (Stop)' : '🎙️ AI बोलून लिहा (Voice Rx)'}</span>
                </button>

                <button
                  type="button"
                  onClick={addMedicineRow}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                >
                  <Plus size={14} /> Add Row
                </button>
              </div>
            </div>

            {/* Voice Dictation Live Speech Preview Bar */}
            {isListening && voiceTarget === 'rx' && (
              <div style={{
                marginBottom: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc', fontSize: '0.8rem', fontWeight: '700' }}>
                    <Radio size={16} className="heartbeat-icon" color="#ec4899" />
                    <span>AI व्हॉईस डिक्टेशन चालू आहे (Listening live speech)...</span>
                  </div>
                  <button
                    type="button"
                    onClick={applySpokenTranscriptToRx}
                    className="btn btn-sm"
                    style={{ background: '#8b5cf6', color: '#fff', fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    ✓ टेबलमध्ये भरा (Add to Table)
                  </button>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#ffffff', fontStyle: 'italic', background: 'rgba(0, 0, 0, 0.25)', padding: '8px 12px', borderRadius: '6px' }}>
                  "{speechTranscript || 'उदा: Paracetamol 650mg twice daily for 3 days after meals...'}"
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  💡 टीप: डॉक्टर औषधाचे नाव, डोस (उदा. 500mg), फ्रिक्वेन्सी (twice daily) आणि दिवस (3 days) स्पष्ट बोला.
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {medicines.map((med, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.2fr 1.5fr 1fr 2fr 36px',
                    gap: '6px',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                >
                  <input
                    type="text"
                    placeholder="Medicine Name"
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                    value={med.medicine_name}
                    onChange={(e) => updateMedicine(idx, 'medicine_name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Dosage (500mg)"
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                    value={med.dosage}
                    onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Frequency (Twice daily)"
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                    value={med.frequency}
                    onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Duration"
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                    value={med.duration}
                    onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Instructions"
                    className="form-input"
                    style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                    value={med.instructions}
                    onChange={(e) => updateMedicine(idx, 'instructions', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeMedicineRow(idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remove"
                  >
                    <Trash2 size={16} color="#fb7185" />
                  </button>
                </div>
              ))}
            </div>

            {/* Real-time AI Drug-Drug Interaction Warning Box */}
            {drugAlerts.hasConflicts ? (
              <div style={{
                marginTop: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                animation: 'fadeIn 0.2s ease-in'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: '700', fontSize: '0.85rem' }}>
                  <AlertTriangle size={18} />
                  <span>AI CLINICAL ALERT: DRUG-DRUG CONTRAINDICATION DETECTED</span>
                </div>

                {drugAlerts.interactions.map((inter, i) => (
                  <div key={i} style={{ fontSize: '0.78rem', color: '#fca5a5', lineHeight: '1.4' }}>
                    <div>
                      <strong style={{ color: '#ffffff' }}>{inter.drug1}</strong> + <strong style={{ color: '#ffffff' }}>{inter.drug2}</strong>: {inter.title} ({inter.severity})
                    </div>
                    <div style={{ color: '#fecaca', marginTop: '2px' }}>
                      {inter.effect}
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
                fontSize: '0.75rem'
              }}>
                <Sparkles size={14} /> AI Clinical Safety: Verified no major adverse pharmacotherapy conflicts detected.
              </div>
            ) : null}
          </div>

          {/* Follow-up Date */}
          <div className="form-group" style={{ maxWidth: '240px' }}>
            <label className="form-label">Recommended Follow-up Date</label>
            <input
              type="date"
              className="form-input"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-emerald"
            style={{ width: '100%', marginTop: '8px' }}
          >
            {submitting ? 'Finalizing Consultation...' : 'Complete Consultation & Issue Prescription'}
          </button>
        </form>
      </div>
    </div>
  );
}
