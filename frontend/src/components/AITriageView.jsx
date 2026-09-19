import React, { useState } from 'react';
import { 
  Sparkles, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Building2, 
  Stethoscope, 
  ArrowRight,
  Brain,
  HeartPulse,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api';

const PRESETS = [
  {
    title: 'Cardiac Symptoms',
    symptoms: 'Chest tightness radiating to left shoulder with shortness of breath and diaphoresis on exertion.',
    dept: 'Cardiology',
    deptId: 1,
    urgency: 'CRITICAL',
    confidence: '96%',
    reasoning: 'Symptoms are classic markers for acute coronary syndrome / angina pectoris requiring prompt ECG and troponin evaluation.',
    precautions: 'Do not perform strenuous activities. Rest in a semi-upright posture. Seek immediate emergency evaluation if pain escalates.'
  },
  {
    title: 'Neurological Episode',
    symptoms: 'Sudden throbbing unilateral headache accompanied by visual aura, photophobia, and transient nausea.',
    dept: 'Neurology',
    deptId: 2,
    urgency: 'MODERATE',
    confidence: '92%',
    reasoning: 'Clinical presentation consistent with acute migraine with aura. Neuro-vascular consult recommended to rule out secondary etiology.',
    precautions: 'Rest in a quiet, darkened room. Maintain oral hydration. Avoid bright LED screens.'
  },
  {
    title: 'Orthopedic Trauma',
    symptoms: 'Inversion twist to right ankle during sports, acute localized lateral swelling, ecchymosis, and inability to bear full weight.',
    dept: 'Orthopedics',
    deptId: 3,
    urgency: 'MODERATE',
    confidence: '94%',
    reasoning: 'Likely lateral ligament complex sprain or distal fibular avulsion fracture. Plain radiographs indicated.',
    precautions: 'Follow R.I.C.E protocol (Rest, Ice for 20 mins, Compression bandage, Elevation above heart level).'
  },
  {
    title: 'Pediatric Respiratory',
    symptoms: '4-year-old with harsh barking cough, inspiratory stridor at rest, and fever of 101.4 F for past 24 hours.',
    dept: 'Pediatrics',
    deptId: 4,
    urgency: 'HIGH',
    confidence: '95%',
    reasoning: 'Clinical features consistent with acute viral laryngotracheobronchitis (Croup). Airway patency monitoring essential.',
    precautions: 'Expose child to humidified cool mist or steamy bathroom. Keep child calm to minimize airway agitation.'
  },
  {
    title: 'Systemic Infection',
    symptoms: 'Persistent fever of 102.5 F, productive cough with yellow sputum, fatigue, and pleuritic chest discomfort.',
    dept: 'General Medicine',
    deptId: 5,
    urgency: 'HIGH',
    confidence: '91%',
    reasoning: 'Suspicion of lower respiratory tract infection / community-acquired pneumonia. Chest auscultation and CBC recommended.',
    precautions: 'Adequate hydration (at least 2.5L fluids), antipyretic control as advised, isolate from vulnerable persons.'
  }
];

export default function AITriageView({ onBookWithDepartment }) {
  const [symptomText, setSymptomText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const runTriage = async (preset = null) => {
    const text = preset ? preset.symptoms : symptomText;
    if (!text.trim()) return;

    setAnalyzing(true);
    setResult(null);

    try {
      const res = await api.runAITriage({ symptoms: text });
      const t = res?.triage;
      if (t) {
        setResult({
          urgency: t.urgency,
          confidence: `${t.confidence}%`,
          dept: t.departmentName,
          deptId: t.departmentId,
          reasoning: t.clinicalReasoning,
          precautions: Array.isArray(t.immediatePrecautions) ? t.immediatePrecautions.join(' • ') : t.immediatePrecautions,
          estimatedWaitTime: t.estimatedWaitTime,
          suspectedConditions: t.suspectedConditions || [],
          redFlags: t.redFlags || []
        });
      } else if (preset) {
        setResult(preset);
      }
    } catch (err) {
      console.warn('API triage fallback to preset:', err);
      if (preset) setResult(preset);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setSymptomText(preset.symptoms);
    runTriage(preset);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.12) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '20px', color: '#c084fc', fontSize: '0.75rem', fontWeight: '700', marginBottom: '10px' }}>
            <Sparkles size={14} /> CLINICAL TRIAGE ENGINE
          </div>
          <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: '800' }}>
            AI Symptom Screening & Rapid Triage
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5', marginTop: '4px' }}>
            State-of-the-art diagnostic reasoning system that evaluates patient symptomatology, computes urgency acuity level, and routes directly to the specialized clinical department.
          </p>
        </div>

        <div style={{
          padding: '12px 18px',
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
            Triage Standard
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#38bdf8', marginTop: '2px' }}>
            Emergency Severity Index (ESI)
          </div>
        </div>
      </div>

      {/* Preset Quick Symptoms */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
          Test Clinical Scenarios:
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(p)}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.8rem', padding: '6px 14px', borderRadius: '8px' }}
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <label className="form-label" style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          Describe Presenting Symptoms, Onset, and Pain Severity:
        </label>
        <textarea
          rows="4"
          className="form-textarea"
          placeholder="e.g. Sharp chest pain radiating to left arm for 45 minutes, accompanied by cold sweats..."
          value={symptomText}
          onChange={(e) => setSymptomText(e.target.value)}
          style={{ fontSize: '0.925rem', lineHeight: '1.5' }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => runTriage()}
            disabled={analyzing || !symptomText.trim()}
            className="btn btn-primary"
            style={{ minWidth: '180px' }}
          >
            {analyzing ? (
              <>
                <Activity size={16} className="heartbeat-icon" /> Analyzing Triage...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Run Clinical Triage
              </>
            )}
          </button>
        </div>
      </div>

      {/* Triage Output Card */}
      {result && (
        <div
          className="glass-card"
          style={{
            border: `2px solid ${
              result.urgency === 'CRITICAL' ? 'rgba(244, 63, 94, 0.5)' :
              result.urgency === 'HIGH' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(6, 182, 212, 0.5)'
            }`,
            background: 'linear-gradient(180deg, rgba(18, 28, 46, 0.95) 0%, rgba(13, 21, 36, 0.98) 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          {/* Top: Urgency & Department */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className={`badge ${
                result.urgency === 'CRITICAL' ? 'badge-rose' :
                result.urgency === 'HIGH' ? 'badge-amber' : 'badge-cyan'
              }`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                <AlertTriangle size={14} /> {result.urgency} URGENCY
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                AI Diagnostic Confidence: <strong style={{ color: '#34d399' }}>{result.confidence}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Recommended Department:</span>
              <span style={{ fontWeight: '700', fontSize: '1rem', color: '#38bdf8' }}>{result.dept}</span>
            </div>
          </div>

          {/* Differential Conditions & Wait Time */}
          {(result.suspectedConditions?.length > 0 || result.estimatedWaitTime) && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Differential Diagnosis:
                </span>
                {result.suspectedConditions.map((cond, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(6, 182, 212, 0.15)',
                      color: '#38bdf8',
                      fontWeight: '600'
                    }}
                  >
                    {cond}
                  </span>
                ))}
              </div>

              {result.estimatedWaitTime && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#fbbf24', fontWeight: '600' }}>
                  <Clock size={14} /> Priority Wait: {result.estimatedWaitTime}
                </div>
              )}
            </div>
          )}

          {/* Reasoning */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-muted)' }}>
              Clinical Diagnostic Assessment
            </div>
            <p style={{ fontSize: '0.925rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
              {result.reasoning}
            </p>
          </div>

          {/* Precautions */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '10px',
            padding: '14px 16px'
          }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: '700', color: '#fbbf24', marginBottom: '4px' }}>
              Suggested Immediate First-Aid & Patient Guidance
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {result.precautions}
            </p>
          </div>

          {/* 1-Click Action to Book */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <button
              onClick={() => onBookWithDepartment(result.deptId)}
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '0.95rem' }}
            >
              Book Immediate Consultation with {result.dept} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
