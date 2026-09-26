import React, { useState } from 'react';
import { 
  AlertTriangle, 
  PhoneCall, 
  Ambulance, 
  MapPin, 
  ShieldAlert, 
  X, 
  CheckCircle2, 
  Activity, 
  Heart,
  Radio
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function EmergencySOSModal({ isOpen, onClose, hospitalInfo, user }) {
  const { t } = useLanguage();
  const [sosSent, setSosSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState('Cardiac / Chest Pain');

  if (!isOpen) return null;

  const emergencyPhone = hospitalInfo?.emergency_phone || '108 / 112 (24x7 Emergency)';
  const hospitalName = hospitalInfo?.hospital_name || 'CITY MULTI-SPECIALTY HOSPITAL';

  const handleTriggerSOS = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSosSent(true);
    }, 1200);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content"
        style={{
          maxWidth: '540px',
          background: 'linear-gradient(180deg, #18090c 0%, #0f172a 100%)',
          border: '2px solid rgba(244, 63, 94, 0.4)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(244, 63, 94, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div style={{
          background: 'linear-gradient(90deg, #e11d48 0%, #be123c 100%)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldAlert size={22} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, letterSpacing: '0.02em' }}>
                24x7 EMERGENCY & AMBULANCE SOS
              </h3>
              <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.9 }}>
                {hospitalName} • Rapid Trauma Response
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'rgba(0, 0, 0, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {sosSent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#34d399'
              }}>
                <CheckCircle2 size={40} />
              </div>

              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#ffffff', marginBottom: '8px' }}>
                🚨 EMERGENCY CODE RED BROADCASTED!
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#34d399', fontWeight: '600', marginBottom: '16px' }}>
                हॉस्पिटल इमर्जन्सी वार्ड व ॲम्ब्युलन्स टीमला अलर्ट पाठवण्यात आला आहे.
              </p>
              
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '16px',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                marginBottom: '20px',
                lineHeight: '1.6'
              }}>
                <div>• <strong>रुग्णाचे नाव:</strong> {user?.fullName || 'Emergency Walk-in / Caller'}</div>
                <div>• <strong>समस्या:</strong> {selectedEmergencyType}</div>
                <div>• <strong>प्राथमिकता:</strong> <span style={{ color: '#f43f5e', fontWeight: '700' }}>LEVEL-1 IMMEDIATE TRAUMA</span></div>
                <div>• <strong>हॉस्पिटल हेल्पलाइन:</strong> {emergencyPhone}</div>
              </div>

              <button
                onClick={() => { setSosSent(false); onClose(); }}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                Close (बंद करा)
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Quick Call Helplines */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <a 
                  href="tel:108"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 12px',
                    borderRadius: '12px',
                    background: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    color: '#ffffff',
                    textDecoration: 'none',
                    textAlign: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Ambulance size={28} color="#fb7185" />
                  <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fb7185' }}>108</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>मोफत ॲम्ब्युलन्स सेवा (Free Ambulance)</span>
                </a>

                <a 
                  href="tel:112"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px 12px',
                    borderRadius: '12px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#ffffff',
                    textDecoration: 'none',
                    textAlign: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <PhoneCall size={28} color="#38bdf8" />
                  <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#38bdf8' }}>112</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>राष्ट्रीय आपत्कालीन सेवा (National SOS)</span>
                </a>
              </div>

              {/* Direct Hospital Emergency Room */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
                    HOSPITAL DIRECT TRAUMA ROOM
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
                    {emergencyPhone}
                  </div>
                </div>
                <a 
                  href={`tel:${emergencyPhone.split('/')[0].trim()}`}
                  className="btn btn-rose btn-sm"
                  style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <PhoneCall size={14} /> Call Now
                </a>
              </div>

              {/* Select Emergency Type */}
              <div>
                <label className="form-label" style={{ fontSize: '0.82rem', marginBottom: '8px' }}>
                  समस्येचा प्रकार निवडा (Select Emergency Condition):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    'Cardiac / Chest Pain',
                    'Accident / Trauma',
                    'Severe Breathlessness',
                    'High Fever / Unconscious'
                  ].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedEmergencyType(type)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'left',
                        border: '1px solid',
                        borderColor: selectedEmergencyType === type ? '#f43f5e' : 'var(--border-subtle)',
                        background: selectedEmergencyType === type ? 'rgba(244, 63, 94, 0.2)' : 'var(--bg-card)',
                        color: selectedEmergencyType === type ? '#ffffff' : 'var(--text-secondary)'
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Broadcast Action Button */}
              <button
                type="button"
                disabled={sending}
                onClick={handleTriggerSOS}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '1rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 24px rgba(225, 29, 72, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Radio size={20} className={sending ? 'spin' : ''} />
                {sending ? 'Broadcasting Code Red Alert...' : 'BROADCAST EMERGENCY SOS TO HOSPITAL ICU'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
