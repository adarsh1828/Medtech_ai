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

  // Voice Speech Recognition Trigger (Marathi, Hindi, English)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('तुमच्या ब्राउझरमध्ये व्हॉईस इनपुट सपोर्ट नाही. कृपया Google Chrome किंवा Edge वापरा.');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.12) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '20px', color: '#c084fc', fontSize: '0.75rem', fontWeight: '700', marginBottom: '8px' }}>
            <Sparkles size={14} /> MULTILINGUAL CLINICAL TRIAGE ENGINE
          </div>
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: '800' }}>
            AI लक्षण तपासणी व तात्काळ वर्गीकरण (AI Clinical Triage)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5', marginTop: '4px' }}>
            मराठी, हिंदी किंवा इंग्रजीत लक्षणे सांगा. सिस्टीम रुग्णाची तीव्रता तपासून तात्काळ योग्य डॉक्टर आणि विभाग सुचवेल.
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
          <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#38bdf8', marginTop: '2px' }}>
            Emergency Severity Index (ESI)
          </div>
        </div>
      </div>

      {/* Preset Quick Symptoms */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
          लक्षणे निवडून त्वरित तपासा (Quick Test Scenarios):
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

      {/* Input Box with Voice Mic Trigger */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="form-label" style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            रुग्णाची लक्षणे, दुखण्याचा प्रकार व वेळ सांगा / लिहा:
          </label>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            मराठी, हिंदी किंवा English मध्ये टाईप करा किंवा बोला
          </span>
        </div>

        <div style={{ position: 'relative' }}>
          <textarea
            rows="4"
            className="form-textarea"
            placeholder="उदा. छातीत डाव्या बाजूला खूप कळ येत आहे आणि घाम फुटत आहे... किंवा मायक्रोफोन बटण दाबून थेट बोला..."
            value={symptomText}
            onChange={(e) => setSymptomText(e.target.value)}
            style={{ fontSize: '0.925rem', lineHeight: '1.5', paddingRight: '50px' }}
          />

          {/* Voice Input Mic Button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            title={isListening ? 'बोलणे थांबवा' : 'मायक्रोफोनने लक्षणे बोला (Voice Input)'}
            style={{
              position: 'absolute',
              right: '12px',
              bottom: '16px',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              border: isListening ? '2px solid #ef4444' : '1px solid var(--border-subtle)',
              background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: isListening ? '#ef4444' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              animation: isListening ? 'pulse 1.2s infinite' : 'none'
            }}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        </div>

        {isListening && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#ef4444', fontWeight: '600' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'ping 1s infinite' }} />
            ऐकत आहे... कृपया तुमची लक्षणे बोला (Listening in {language === 'mr' ? 'Marathi' : language === 'hi' ? 'Hindi' : 'English'})...
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          {symptomText && (
            <button
              onClick={() => { setSymptomText(''); setResult(null); }}
              className="btn btn-outline btn-sm"
            >
              साफ करा (Clear)
            </button>
          )}
          <button
            onClick={() => runTriage()}
            disabled={analyzing || !symptomText.trim()}
            className="btn btn-primary"
            style={{ minWidth: '180px' }}
          >
            {analyzing ? (
              <>
                <Activity size={16} className="heartbeat-icon" /> AI तपासणी चालू आहे...
              </>
            ) : (
              <>
                <Sparkles size={16} /> AI Triage ट्रिगर करा
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
              result.urgency === 'CRITICAL' ? 'rgba(244, 63, 94, 0.6)' :
              result.urgency === 'HIGH' ? 'rgba(245, 158, 11, 0.6)' : 'rgba(6, 182, 212, 0.6)'
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
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>शिफारस केलेला विभाग:</span>
              <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#38bdf8' }}>{result.dept}</span>
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
                  संभाव्य निदान (Differential Diagnosis):
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
                  <Clock size={14} /> प्रतीक्षेचा अंदाजित वेळ: {result.estimatedWaitTime}
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
              क्लिनिकल विश्लेषण (Clinical Diagnostic Assessment)
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
              तात्काळ प्रथमोपचार व मार्गदर्शन (Immediate First-Aid Guidance)
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {result.precautions}
            </p>
          </div>

          {/* 1-Click Action to Book with Auto-Fill */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
            <button
              onClick={handleBookAppointment}
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '0.95rem', gap: '8px' }}
            >
              {result.dept} विभागात तात्काळ अपॉइंटमेंट बुक करा <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
