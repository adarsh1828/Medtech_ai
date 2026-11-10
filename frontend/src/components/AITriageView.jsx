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
  ShieldCheck,
  Mic,
  MicOff,
  Flame,
  Volume2
} from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

const PRESETS = [
  {
    title: '❤️ छातीत कळ व घाम (Cardiac)',
    titleEn: 'Cardiac Emergency',
    symptoms: 'छातीत डाव्या बाजूला तीव्र कळ येत आहे, डाव्या हातात वेदना होतात आणि खूप घाम फुटतोय.',
    dept: 'Cardiology',
    deptId: 1,
    urgency: 'CRITICAL',
    confidence: '96%',
    reasoning: 'लक्षणे एक्यूट कोरोनरी सिंड्रोम (हार्ट अटॅक / एंजायना) दर्शवतात. त्वरित ECG व कार्डियाक तपासणी आवश्यक.',
    precautions: 'हालचाल थांबवा, विश्रांती घ्या, त्वरित कार्डियाक ICU मध्ये नेणे आवश्यक.'
  },
  {
    title: '🧠 तीव्र डोकेदुखी व पक्षाघात (Neuro)',
    titleEn: 'Neurological / Stroke',
    symptoms: 'तीव्र डोकेदुखी, बोलताना अडखळणे आणि शरीराच्या उजव्या बाजूला अशक्तपणा जाणवत आहे.',
    dept: 'Neurology',
    deptId: 2,
    urgency: 'CRITICAL',
    confidence: '95%',
    reasoning: 'एक्यूट स्ट्रोक (पक्षाघात) ची तीव्र शक्यता. गोल्डन अवर (4.5 तास) मध्ये तात्काळ CT Brain स्कॅन आवश्यक.',
    precautions: 'काहीही खायला किंवा प्यायला देऊ नका (NPO), डोके ३० अंश वर ठेवा.'
  },
  {
    title: '🦴 फ्रॅक्चर व पाय मुरगळणे (Ortho)',
    titleEn: 'Orthopedic Trauma',
    symptoms: 'पायऱ्यांवरून घसरून पडल्यामुळे पायाचा घोटा मुरगळला असून तीव्र सूज आली आहे आणि चालता येत नाही.',
    dept: 'Orthopedics',
    deptId: 3,
    urgency: 'HIGH',
    confidence: '94%',
    reasoning: 'हाडाला फ्रॅक्चर किंवा लिगामेंट फाटल्याची शक्यता. डिजिटल X-Ray व स्प्लिंट तात्काळ आवश्यक.',
    precautions: 'पायावर वजन देऊ नका, बर्फाने शेकवा (R.I.C.E. प्रोटोकॉल).'
  },
  {
    title: '👶 बाळाला ताप व धाप (Pediatric)',
    titleEn: 'Pediatric Distress',
    symptoms: '२ वर्षांच्या लहान बाळाला १०२ ताप आहे, धाप लागत आहे आणि बाळ सतत रडत असून दूध पीत नाही.',
    dept: 'Pediatrics',
    deptId: 4,
    urgency: 'HIGH',
    confidence: '94%',
    reasoning: 'लहान मुलांमधील तीव्र श्वसन संसर्ग व डिहायड्रेशन. बालरोग तज्ज्ञांकडून तात्काळ तपासणी आवश्यक.',
    precautions: 'बाळाला शांत ठेवा, थोडे थोडे पाणी/ओआरएस पाजा, तातडीने बालरोग डॉक्टरांकडे न्या.'
  },
  {
    title: '💨 दमा व श्वास घेण्यास त्रास (Pulmonology)',
    titleEn: 'Asthma / Pulmonology',
    symptoms: 'छातीत घरघर आवाज येत असून श्वास घेण्यास खूप त्रास होत आहे आणि खूप कफ झाला आहे.',
    dept: 'Pulmonology',
    deptId: 5,
    urgency: 'HIGH',
    confidence: '93%',
    reasoning: 'एक्यूट अस्थमा किंवा फुफ्फुसाचा संसर्ग. नेब्युलायझेशन आणि SpO2 ऑक्सिजन तपासणी आवश्यक.',
    precautions: 'ताठ बसा, थंड हवा किंवा धूर टाळा, त्वरित इनहेलर किंवा नेब्युलायझर घ्या.'
  },
  {
    title: '🔥 पोटदुखी व उलट्या (Gastro)',
    titleEn: 'Severe Abdominal Pain',
    symptoms: 'पोटात तीव्र गोळा येऊन वेदना होत आहेत, सतत उलटीचा त्रास आणि संडास पातळ होत आहे.',
    dept: 'Gastroenterology',
    deptId: 6,
    urgency: 'HIGH',
    confidence: '92%',
    reasoning: 'एक्यूट गॅस्ट्रोएन्टेरिटिस किंवा ऍसिडिटी संसर्ग. डिहायड्रेशन रोखण्यासाठी हायड्रेशन व तपासणी आवश्यक.',
    precautions: 'ओआरएस (ORS) थोडे थोडे प्या, तिखट व तेलकट अन्न टाळा.'
  }
];

export default function AITriageView({ onBookWithDepartment }) {
  const { language, t } = useLanguage();
  const [symptomText, setSymptomText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [triageError, setTriageError] = useState('');

  // Voice Speech Recognition Trigger (Marathi, Hindi, English)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('तुमच्या ब्राउझरमध्ये व्हॉईस इनपुट सपोर्ट नाही. कृपया Chrome किंवा Edge वापरा.', 'warning');
      return;
    }

    if (isListening) {
      if (window._medtechRecognition) {
        window._medtechRecognition.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      window._medtechRecognition = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSymptomText(prev => (prev ? prev + ' ' + transcript : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition start failed:', e);
      setIsListening(false);
    }
  };

  const runTriage = async (preset = null) => {
    const text = preset ? preset.symptoms : symptomText;
    if (!text.trim()) return;

    setAnalyzing(true);
    setResult(null);
    setTriageError('');

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
      else setTriageError('We couldn’t complete the assessment. Please check your connection and try again, or contact the care team directly.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setSymptomText(preset.symptoms);
    runTriage(preset);
  };

  const handleBookAppointment = () => {
    if (!result || !onBookWithDepartment) return;
    onBookWithDepartment({
      deptId: result.deptId,
      deptName: result.dept,
      reason: `[AI Triage: ${result.urgency}] ${symptomText} (${result.suspectedConditions?.[0] || result.dept})`,
      urgency: result.urgency
    });
  };

  return (
    <section className="ai-triage-page">
      <header className="ai-triage-hero">
        <div className="ai-triage-orb ai-triage-orb-one" />
        <div className="ai-triage-orb ai-triage-orb-two" />
        <div className="ai-triage-hero-copy">
          <div className="ai-triage-eyebrow"><span className="ai-triage-spark"><Sparkles size={15} /></span> MEDTECH AI <span className="ai-triage-eyebrow-divider" /> CLINICAL SUPPORT</div>
          <h1>Care starts with listening<span>.</span></h1>
          <p>Share symptoms in Marathi, Hindi, or English. Get a clear urgency recommendation and the right care team to contact.</p>
          <div className="ai-triage-hero-meta"><span><HeartPulse size={15} /> Multilingual support</span><span><ShieldCheck size={15} /> Clinician-guided next steps</span></div>
        </div>
        <div className="ai-triage-hero-art" aria-hidden="true">
          <div className="ai-hero-ring ai-hero-ring-outer" /><div className="ai-hero-ring ai-hero-ring-inner" />
          <div className="ai-hero-core"><Brain size={40} strokeWidth={1.6} /><span className="ai-hero-core-spark"><Sparkles size={15} /></span></div>
          <span className="ai-hero-orbit-dot dot-one" /><span className="ai-hero-orbit-dot dot-two" /><span className="ai-hero-orbit-dot dot-three" />
        </div>
      </header>

      <div className="ai-triage-layout">
        <div className="ai-triage-main-column">
          <section className="ai-triage-panel ai-triage-input-panel">
            <div className="ai-triage-section-heading">
              <div className="ai-section-icon"><Activity size={18} /></div>
              <div><h2>Tell us what’s going on</h2><p>Include when it started and how it feels.</p></div>
              <span className="ai-step-label">STEP 01 <span>/ 02</span></span>
            </div>

            <label htmlFor="triage-symptoms" className="ai-field-label">Patient symptoms</label>
            <div className="ai-symptom-input-wrap">
              <textarea id="triage-symptoms" rows="5" className="form-textarea ai-symptom-input" placeholder="Describe the symptoms, when they began, and anything that makes them better or worse…" value={symptomText} onChange={(e) => { setSymptomText(e.target.value); setResult(null); setTriageError(''); }} />
              <div className="ai-input-footer"><span>{symptomText.length} characters</span><button type="button" onClick={toggleSpeechRecognition} className={`ai-mic-button ${isListening ? 'is-listening' : ''}`} aria-label={isListening ? 'Stop voice input' : 'Start voice input'} title={isListening ? 'Stop voice input' : 'Speak symptoms'}>{isListening ? <MicOff size={17} /> : <Mic size={17} />}<span>{isListening ? 'Listening' : 'Speak'}</span></button></div>
            </div>

            {isListening && <div className="ai-listening-status" role="status"><span className="ai-listening-dot" /> Listening in {language === 'mr' ? 'Marathi' : language === 'hi' ? 'Hindi' : 'English'}…</div>}
            {triageError && <div className="ai-triage-error" role="alert"><AlertTriangle size={17} />{triageError}</div>}
            <div className="ai-triage-form-actions">
              {symptomText && <button onClick={() => { setSymptomText(''); setResult(null); setTriageError(''); }} className="btn btn-outline">Clear</button>}
              <button onClick={() => runTriage()} disabled={analyzing || !symptomText.trim()} className="btn btn-primary ai-analyze-button" aria-busy={analyzing}>
                {analyzing ? <><span className="ai-button-spinner" /> Reviewing symptoms…</> : <><Sparkles size={17} /> Get AI guidance <ArrowRight size={16} /></>}
              </button>
            </div>
          </section>

          {result && <section className={`ai-triage-result ai-result-${(result.urgency || 'standard').toLowerCase()}`} aria-live="polite">
            <div className="ai-result-topline"><span className="ai-result-kicker"><Sparkles size={14} /> AI TRIAGE SUMMARY</span><span className={`ai-urgency-pill urgency-${(result.urgency || 'standard').toLowerCase()}`}><AlertTriangle size={14} /> {result.urgency} PRIORITY</span></div>
            <div className="ai-result-heading"><div><span className="ai-result-label">Recommended care team</span><h2><Building2 size={21} /> {result.dept}</h2></div>{result.confidence && <div className="ai-confidence"><span>Model confidence</span><strong>{result.confidence}</strong></div>}</div>
            {(result.suspectedConditions?.length > 0 || result.estimatedWaitTime) && <div className="ai-result-details">
              {result.suspectedConditions?.length > 0 && <div className="ai-detail-block"><span className="ai-detail-label">Possible considerations</span><div className="ai-condition-list">{result.suspectedConditions.map((cond, idx) => <span className="ai-condition-chip" key={idx}>{cond}</span>)}</div></div>}
              {result.estimatedWaitTime && <div className="ai-wait-time"><Clock size={17} /><div><span>Estimated wait</span><strong>{result.estimatedWaitTime}</strong></div></div>}
            </div>}
            <div className="ai-result-copy-grid">
              <div className="ai-result-copy"><span className="ai-detail-label">Why this recommendation</span><p>{result.reasoning}</p></div>
              <div className="ai-result-copy ai-result-guidance"><span className="ai-detail-label">While you arrange care</span><p>{result.precautions}</p></div>
            </div>
            <div className="ai-result-bottom"><p><ShieldCheck size={16} /> This is decision support, not a diagnosis. A clinician should assess the patient.</p><button onClick={handleBookAppointment} className="btn btn-primary">Continue to {result.dept} <ArrowRight size={16} /></button></div>
          </section>}
        </div>

        <aside className="ai-triage-side-column">
          <section className="ai-triage-panel ai-scenarios-panel">
            <div className="ai-side-heading"><div className="ai-section-icon ai-section-icon-soft"><Sparkles size={17} /></div><div><h2>Try a sample</h2><p>Choose a scenario to see how triage works.</p></div></div>
            <div className="ai-scenario-list">{PRESETS.map((preset, idx) => <button key={idx} className="ai-scenario-button" onClick={() => handleSelectPreset(preset)} disabled={analyzing}><span className="ai-scenario-number">{String(idx + 1).padStart(2, '0')}</span><span>{preset.titleEn}</span><ArrowRight size={15} /></button>)}</div>
            <div className="ai-scenario-note"><Activity size={15} /> Sample scenarios are for demonstration only.</div>
          </section>
          <section className="ai-safety-card"><div className="ai-safety-icon"><AlertTriangle size={18} /></div><div><h3>Need urgent help?</h3><p>If someone is unconscious, struggling to breathe, or has severe chest pain, contact emergency services or go to the nearest emergency department now.</p></div></section>
        </aside>
      </div>
    </section>
  );
}
