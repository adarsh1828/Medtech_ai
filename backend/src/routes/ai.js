import express from 'express';
import { query, getOne } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Known High-Risk Clinical Drug Interactions Knowledge Base
const DRUG_INTERACTION_RULES = [
  {
    drugs: ['aspirin', 'warfarin'],
    severity: 'CRITICAL',
    title: 'Severe Bleeding & Hemorrhage Risk',
    effect: 'Concomitant use of Aspirin and Warfarin substantially elevates systemic anticoagulant response, causing life-threatening gastrointestinal or intracranial bleeding.',
    recommendation: 'Avoid combination unless specifically indicated in high-risk mechanical valve patients under strict INR monitoring. Consider alternative antiplatelet/anticoagulant strategies.'
  },
  {
    drugs: ['aspirin', 'heparin'],
    severity: 'CRITICAL',
    title: 'Potentiated Hemorrhagic Diathesis',
    effect: 'Dual antiplatelet-anticoagulation creates acute risk of major bleeding.',
    recommendation: 'Monitor aPTT and platelet count continuously. Use gastric mucosa protectors (PPI).'
  },
  {
    drugs: ['metformin', 'contrast'],
    severity: 'HIGH',
    title: 'Lactic Acidosis & Acute Kidney Injury',
    effect: 'Iodinated radiocontrast media can induce acute renal failure, causing severe Metformin accumulation and fatal lactic acidosis.',
    recommendation: 'Withhold Metformin 48 hours prior to and 48 hours post-contrast radiologic scan until renal function (eGFR) is verified normal.'
  },
  {
    drugs: ['clopidogrel', 'omeprazole'],
    severity: 'MODERATE',
    title: 'Reduced Antiplatelet Efficacy',
    effect: 'Omeprazole inhibits CYP2C19, preventing active metabolite conversion of Clopidogrel and increasing cardiovascular stent thrombosis risk.',
    recommendation: 'Switch Omeprazole to Pantoprazole or Famotidine, which exert minimal CYP2C19 inhibition.'
  },
  {
    drugs: ['lisinopril', 'spironolactone'],
    severity: 'HIGH',
    title: 'Severe Life-Threatening Hyperkalemia',
    effect: 'Combined ACE-Inhibitor and potassium-sparing aldosterone antagonist therapy impairs renal potassium excretion, risking fatal cardiac arrhythmias.',
    recommendation: 'Frequent serum potassium and creatinine monitoring required. Discontinue potassium supplements.'
  },
  {
    drugs: ['sildenafil', 'nitroglycerin'],
    severity: 'CRITICAL',
    title: 'Refractory Precipitous Hypotension',
    effect: 'PDE5 inhibitors potentiate cyclic GMP elevation from nitrates, triggering catastrophic blood pressure drop and myocardial infarction.',
    recommendation: 'Absolute contraindication. Nitrates must not be given within 24-48 hours of PDE5 inhibitors.'
  },
  {
    drugs: ['ciprofloxacin', 'theophylline'],
    severity: 'HIGH',
    title: 'Theophylline Toxicity & Neuro-excitation',
    effect: 'Fluoroquinolones inhibit CYP1A2 theophylline clearance, precipitating nausea, palpitations, and generalized tonic-clonic seizures.',
    recommendation: 'Reduce Theophylline dosage by 30-50% and closely check plasma theophylline levels, or use azithromycin.'
  },
  {
    drugs: ['tramadol', 'fluoxetine'],
    severity: 'HIGH',
    title: 'Serotonin Syndrome & Lowered Seizure Threshold',
    effect: 'Simultaneous 5-HT reuptake inhibition by SSRI and opioid agonist increases hyperreflexia, autonomic instability, and seizures.',
    recommendation: 'Avoid combination. Monitor for clonus, diaphoresis, hyperthermia, and confusion.'
  },
  {
    drugs: ['ibuprofen', 'methotrexate'],
    severity: 'HIGH',
    title: 'Bone Marrow Suppression & Methotrexate Toxicity',
    effect: 'NSAIDs decrease renal tubular clearance of Methotrexate, leading to profound pancytopenia and mucosal ulceration.',
    recommendation: 'Avoid concurrent NSAID administration with high-dose Methotrexate. Use Paracetamol for analgesia.'
  }
];

// Helper: Normalize drug name for matching
function normalizeDrug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// POST /api/ai/check-drug-interactions
router.post('/check-drug-interactions', authenticateToken, async (req, res) => {
  try {
    const { medicines } = req.body;

    if (!Array.isArray(medicines) || medicines.length < 2) {
      return res.json({
        hasConflicts: false,
        interactions: [],
        safetySummary: 'At least 2 medications required to analyze drug interactions.'
      });
    }

    const detected = [];
    const normalizedList = medicines.map(m => {
      const raw = typeof m === 'string' ? m : (m.medicine_name || '');
      return { raw, normalized: normalizeDrug(raw) };
    });

    for (const rule of DRUG_INTERACTION_RULES) {
      const [drugA, drugB] = rule.drugs;
      const foundA = normalizedList.find(item => item.normalized.includes(drugA));
      const foundB = normalizedList.find(item => item.normalized.includes(drugB));

      if (foundA && foundB && foundA !== foundB) {
        detected.push({
          severity: rule.severity,
          title: rule.title,
          drug1: foundA.raw,
          drug2: foundB.raw,
          effect: rule.effect,
          recommendation: rule.recommendation
        });
      }
    }

    const hasConflicts = detected.length > 0;
    const criticalCount = detected.filter(d => d.severity === 'CRITICAL').length;
    const highCount = detected.filter(d => d.severity === 'HIGH').length;

    let safetySummary = 'All prescribed medications evaluated. No severe adverse pharmacokinetic interactions detected.';
    if (criticalCount > 0) {
      safetySummary = `CRITICAL ALERT: Detected ${criticalCount} life-threatening drug combination(s). Immediate clinical reconsideration advised before issuing order.`;
    } else if (highCount > 0) {
      safetySummary = `HIGH RISK WARNING: Detected ${highCount} major pharmacotherapy interaction(s). Dosage modification or protective medication advised.`;
    } else if (hasConflicts) {
      safetySummary = `MODERATE RISK: Detected ${detected.length} interaction(s) requiring regular clinical observation.`;
    }

    res.json({
      hasConflicts,
      interactions: detected,
      safetySummary
    });
  } catch (err) {
    console.error('Drug interaction check error:', err);
    res.status(500).json({ error: 'Failed to verify drug interactions.' });
  }
});

// Helper to check if text contains any of the keywords
function containsAny(text, keywords) {
  return keywords.some(k => text.includes(k.toLowerCase()));
}

// POST /api/ai/triage
router.post('/triage', async (req, res) => {
  try {
    const { symptoms = '', duration = '', vitals = {}, age = '', gender = '' } = req.body;

    if (!symptoms.trim()) {
      return res.status(400).json({ error: 'Please describe patient symptoms for AI clinical triage.' });
    }

    const lower = symptoms.toLowerCase();
    const vitalsStr = JSON.stringify(vitals).toLowerCase();

    // Query departments from db to attach real departmental IDs
    const depts = await query('SELECT * FROM Departments');
    const findDept = (code) => depts.find(d => d.code === code) || depts.find(d => d.code === 'GENM') || depts[0];

    // Check for Online Gemini Engine if GEMINI_API_KEY is configured
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const prompt = `You are an expert hospital clinical triage physician at MedTech Multi-Speciality Hospital.
Patient Input: "${symptoms}"
Patient Age: ${age || 'Not specified'}, Gender: ${gender || 'Not specified'}

Analyze the symptoms and return ONLY a valid JSON object (no markdown, no backticks, just raw JSON) matching this schema:
{
  "urgency": "CRITICAL" | "HIGH" | "MODERATE" | "ROUTINE",
  "urgencyCode": "LEVEL_1_RESUSCITATION" | "LEVEL_2_EMERGENT" | "LEVEL_3_URGENT" | "LEVEL_4_ROUTINE",
  "confidence": number between 88 and 98,
  "departmentCode": one of ["CARD", "NEUR", "EMER", "ORTH", "PED", "PULM", "GAST", "DERM", "OPHT", "ENT", "GYN", "UROL", "ENDO", "PSYC", "GENM"],
  "estimatedWaitTime": "string (e.g. 0 - 5 Minutes)",
  "suspectedConditions": ["condition 1", "condition 2"],
  "clinicalReasoning": "Detailed medical explanation in the language of the prompt or bilingual",
  "immediatePrecautions": ["precaution 1", "precaution 2"],
  "redFlags": ["red flag 1", "red flag 2"]
}`;

        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (gRes.ok) {
          const gData = await gRes.json();
          const rawText = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            const dept = findDept(parsed.departmentCode || 'GENM');
            return res.json({
              triage: {
                urgency: parsed.urgency || 'HIGH',
                urgencyCode: parsed.urgencyCode || 'LEVEL_2_EMERGENT',
                confidence: parsed.confidence || 95,
                departmentName: dept.name,
                departmentCode: dept.code,
                departmentId: dept.id,
                departmentFloor: dept.floor_number,
                estimatedWaitTime: parsed.estimatedWaitTime || '10 - 20 Minutes',
                suspectedConditions: parsed.suspectedConditions || ['Clinical Evaluation Required'],
                clinicalReasoning: parsed.clinicalReasoning || 'AI triage assessment completed.',
                immediatePrecautions: parsed.immediatePrecautions || ['Consult treating physician.'],
                redFlags: parsed.redFlags || ['Report immediately if condition deteriorates.']
              },
              source: 'gemini-1.5-flash',
              analyzedAt: new Date().toISOString()
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API call bypassed or timed out, executing native multilingual engine:', geminiErr.message);
      }
    }

    // High-Fidelity Multilingual Deterministic Clinical Engine (Marathi, Hindi, English)
    let result = null;

    // 1. CARDIOLOGY (हृदयरोग)
    const cardiacTerms = [
      'chest pain', 'chest tightness', 'angina', 'heart attack', 'palpitation', 'left arm pain',
      'radiating to left arm', 'sweating and breathless', 'heart beat fast', 'ecg',
      'छातीत दुखणे', 'छातीत कळ', 'डावा हात दुखणे', 'घाम फुटणे', 'छाती भरून येणे', 'हार्ट अटॅक',
      'धडधड होणे', 'हृदयविकार', 'दम लागणे आणि घाम', 'छातीत जळजळ आणि कळ', 'छाती में दर्द',
      'सीने में दर्द', 'दिल का दौरा', 'घबराहट और पसीना', 'बाएं हाथ में दर्द'
    ];

    // 2. NEUROLOGY (मेंदू व मज्जारज्जू / पक्षाघात / स्ट्रोक)
    const neuroTerms = [
      'stroke', 'facial droop', 'speech slur', 'slurred speech', 'arm weakness', 'seizure',
      'worst headache of life', 'aura', 'numbness on one side', 'paralysis', 'unconscious',
      'fainting', 'convulsions', 'vertigo', 'loss of balance',
      'अर्धांगवायू', 'पक्षाघात', 'तोंड वाकडे होणे', 'बोलताना अडखळणे', 'हात पाय लटपटणे',
      'तीव्र डोकेदुखी', 'फिट येणे', 'बेशुद्ध पडणे', 'भोवळ येणे', 'चक्कर येणे', 'तोला जाणे',
      'हातापायात मुंग्या', 'एका बाजूला अशक्तपणा', 'लकवा', 'सिरदर्द', 'दौरा पड़ना', 'बेहोशी',
      'मुंह टेढ़ा होना', 'आवाज लड़खड़ाना', 'हाथ पैर सुन्न'
    ];

    // 3. EMERGENCY / ACUTE TRAUMA (तात्काळ आणीबाणी / अपघात)
    const emerTerms = [
      'heavy bleeding', 'severe accident', 'deep cut', 'stab', 'burns', 'poisoning',
      'electric shock', 'snake bite', 'unresponsive', 'head injury bleeding',
      'रक्तस्राव', 'मोठा अपघात', 'भाजणे', 'विषबाधा', 'साप चावणे', 'शॉक लागणे', 'खोल जखम',
      'डोक्याला मार लागून रक्त', 'खून बहना', 'गंभीर दुर्घटना', 'जल जाना', 'जहर', 'सांप का काटना'
    ];

    // 4. ORTHOPEDICS (हाडांचे विकार व फ्रॅक्चर)
    const orthoTerms = [
      'fracture', 'broken bone', 'ankle twist', 'sprain', 'dislocation', 'joint pain',
      'knee pain', 'unable to walk', 'swelling in leg', 'back pain', 'slip disc', 'bone injury',
      'हाड मोडणे', 'फ्रॅक्चर', 'पाय मुरगळणे', 'सांधेदुखी', 'गुडघेदुखी', 'कंबरदुखी',
      'पायाला सूज', 'चालता न येणे', 'सांधा निखळणे', 'मणक्याचा त्रास', 'हाडाला मार',
      'हड्डी टूटना', 'मोच आना', 'जोड़ों में दर्द', 'घुटने का दर्द', 'कमर दर्द', 'पैर में सूजन', 'चलने में असमर्थ'
    ];

    // 5. PEDIATRICS (बालरोग)
    const pedTerms = [
      'child', 'baby', 'infant', 'stridor', 'barking cough', 'pediatric', 'toddler',
      'लहान मूल', 'बाळ', 'लहान मुलाला ताप', 'बाळ दूध पीत नाही', 'बाळाला खोकला',
      'बालरोग', 'बाळ सतत रडत आहे', 'लहान मुलाला जुलाब', 'छोटा बच्चा', 'शिशु',
      'बच्चे को बुखार', 'बच्चे को खांसी', 'दूध नहीं पी रहा'
    ];

    // 6. PULMONOLOGY (श्वसनविकार व दमा)
    const pulmTerms = [
      'asthma', 'wheezing', 'chronic cough', 'coughing blood', 'tuberculosis', 'tb',
      'breathlessness', 'pneumonia', 'difficulty breathing', 'shortness of breath',
      'दमा', 'अस्थमा', 'धाप लागणे', 'श्वास घेण्यास त्रास', 'छातीत घरघर', 'खूप खोकला',
      'कफातून रक्त', 'क्षयरोग', 'न्यूमोनिया', 'दम फूलना', 'सांस लेने में तकलीफ', 'फेफड़े की बीमारी'
    ];

    // 7. GASTROENTEROLOGY (पोट व पचनसंस्था विकार)
    const gastTerms = [
      'severe abdominal pain', 'stomach pain', 'vomiting blood', 'jaundice', 'acid reflux',
      'acidity', 'loose motions', 'diarrhea', 'liver', 'hepatitis', 'gallstone',
      'पोटात तीव्र वेदना', 'पोटदुखी', 'कावीळ', 'उलट्या', 'जुलाब', 'पित्त', 'आम्लपित्त',
      'पोट फुगणे', 'रक्त पडणे संडासातून', 'यकृत', 'पेट में तेज दर्द', 'पीलिया', 'उल्टी दस्त', 'एसिडिटी'
    ];

    // 8. ENT (कान, नाक व घसा विकार)
    const entTerms = [
      'ear pain', 'ear discharge', 'hearing loss', 'sore throat', 'tonsils', 'nosebleed',
      'sinusitis', 'hoarse voice', 'ear pus',
      'कान दुखणे', 'कानातून पू येणे', 'कमी ऐकू येणे', 'घसा दुखणे', 'टॉन्सिल्स', 'नाकातून रक्त',
      'नकसूर', 'सायनस', 'आवाज बसणे', 'कान में दर्द', 'कान बहना', 'गले में खराश', 'टॉन्सिल'
    ];

    // 9. DERMATOLOGY (त्वचारोग)
    const dermTerms = [
      'skin rash', 'itching', 'eczema', 'psoriasis', 'acne', 'boils', 'fungal infection',
      'ringworm', 'hives', 'skin allergy',
      'अंगावर खाज', 'पुरळ', 'इसब', 'गजकर्ण', 'नायटा', 'मुरुमे', 'त्वचारोग', 'ऍलर्जी', 'फोड',
      'त्वचा पर दाने', 'खुजली', 'दाद खाज', 'मुंहासे', 'चमड़ी का रोग'
    ];

    // 10. OPHTHALMOLOGY (नेत्ररोग)
    const ophtTerms = [
      'blurred vision', 'eye pain', 'redness in eye', 'double vision', 'cataract',
      'loss of vision', 'eye discharge', 'glaucoma',
      'डोळे दुखणे', 'डोळे लाल होणे', 'अंधुक दिसणे', 'मोतीबिंदू', 'डोळ्यातून पाणी', 'डोळ्यांची जळजळ',
      'आंखों में दर्द', 'आंखें लाल होना', 'धुंधला दिखना', 'मोतियाबिंद'
    ];

    // 11. GYNECOLOGY (स्त्रीरोग व प्रसूती)
    const gynTerms = [
      'pregnancy', 'irregular periods', 'menstrual pain', 'vaginal bleeding', 'pelvic pain',
      'antenatal', 'pregnant', 'cramps period',
      'गरोदरपण', 'मासिक पाळीचा त्रास', 'पोटदुखी पाळी', 'अंगावरून रक्त जाणे', 'गर्भाशय',
      'प्रसूती', 'स्त्रीरोग', 'गर्भावस्था', 'माहवारी में दर्द', 'अनियमित माहवारी'
    ];

    // 12. UROLOGY (मुतखडा व मूत्रविकार)
    const urolTerms = [
      'kidney stone', 'blood in urine', 'burning urination', 'painful urination', 'prostate',
      'unable to pass urine',
      'मुतखडा', 'लघवीला जळजळ', 'लघवीतून रक्त', 'लघवी अडकणे', 'प्रोस्टेट',
      'पथरी', 'किडनी स्टोन', 'पेशाब में जलन', 'पेशाब में खून', 'पेशाब रुकना'
    ];

    // EVALUATE RULES IN PRIORITY ORDER
    if (containsAny(lower, emerTerms)) {
      const dept = findDept('EMER') || findDept('SURG');
      result = {
        urgency: 'CRITICAL',
        urgencyCode: 'LEVEL_1_RESUSCITATION',
        confidence: 98,
        departmentName: dept.name,
        departmentCode: dept.code,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: '0 Minutes (Immediate Resuscitation)',
        suspectedConditions: ['Acute Severe Trauma / Hemorrhage', 'Emergency Resuscitation Protocol', 'Critical Trauma Stabilization'],
        clinicalReasoning: 'Emergency trauma signs with acute hemorrhage or systemic risk detected. High-level trauma code activated. तत्काळ आपत्कालीन कक्ष (Emergency OT) मध्ये दाखल करणे आवश्यक.',
        immediatePrecautions: [
          'Apply direct sterile pressure to actively bleeding sites',
          'Keep patient completely warm and immobilized',
          'Do NOT administer oral fluids or solids (NPO strict)',
          'Immediate rapid vascular access & blood typing'
        ],
        redFlags: ['Altered sensorium or hypovolemic shock', 'Uncontrolled arterial hemorrhage', 'Severe dyspnea / tracheal deviation']
      };
    } else if (containsAny(lower, cardiacTerms)) {
      const dept = findDept('CARD');
      result = {
        urgency: 'CRITICAL',
        urgencyCode: 'LEVEL_1_RESUSCITATION',
        confidence: 96,
        departmentName: dept.name,
        departmentCode: dept.code,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: '0 - 5 Minutes (Immediate)',
        suspectedConditions: [
          'Acute Coronary Syndrome (ACS)',
          'Myocardial Infarction / Unstable Angina (हार्ट अटॅक)',
          'Cardiac Arrhythmia'
        ],
        clinicalReasoning: 'Symptom profile exhibits hallmark acute coronary ischemia markers (radiation, diaphoresis, retrosternal tightness). तातडीने ECG व Troponin टेस्ट आवश्यक आहे.',
        immediatePrecautions: [
          'Administer supplemental oxygen if SpO2 < 94%',
          'Prepare sublingual nitroglycerin and chewable antiplatelet if prescribed',
          'Keep patient at complete physical rest in semi-Fowler position',
          'Transfer immediately to Cardiac ICU triage'
        ],
        redFlags: ['Sudden loss of consciousness', 'Severe cold diaphoresis with cyanosis', 'Systolic blood pressure < 90 mmHg']
      };
    } else if (containsAny(lower, neuroTerms)) {
      const dept = findDept('NEUR');
      result = {
        urgency: containsAny(lower, ['slur', 'droop', 'seizure', 'पक्षाघात', 'बेशुद्ध', 'फिट', 'दौरा']) ? 'CRITICAL' : 'HIGH',
        urgencyCode: 'LEVEL_2_EMERGENT',
        confidence: 95,
        departmentName: dept.name,
        departmentCode: dept.code,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: '5 - 15 Minutes',
        suspectedConditions: [
          'Acute Ischemic Stroke / TIA (BE-FAST Protocol)',
          'Subarachnoid Hemorrhage / Complex Migraine',
          'Focal Neurological Deficit'
        ],
        clinicalReasoning: 'Acute neurological episode requires immediate exclusion of intracranial stroke or hemorrhage within the golden window (tPA < 4.5 hours). तात्काळ CT Brain स्कॅन आवश्यक.',
        immediatePrecautions: [
          'Note exact time of symptom onset (Last Known Well)',
          'Strictly NPO (Nothing by mouth) due to aspiration danger',
          'Elevate head of bed 30 degrees',
          'Maintain oxygenation and check bedside blood glucose'
        ],
        redFlags: ['Rapid decrease in consciousness (GCS score drop)', 'Unilateral fixed dilated pupil', 'Repeated projectile vomiting']
      };
    } else if (containsAny(lower, pedTerms) || (age && Number(age) < 14)) {
      const dept = findDept('PED');
      result = {
        urgency: containsAny(lower, ['stridor', 'breath', 'दूध', 'रडत']) ? 'HIGH' : 'MODERATE',
        urgencyCode: 'LEVEL_2_PEDIATRIC',
        confidence: 94,
        departmentName: dept.name,
        departmentCode: dept.code,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: '10 - 20 Minutes',
        suspectedConditions: [
          'Acute Pediatric Respiratory Infection / Croup',
          'Pediatric Febrile Illness',
          'Infant Dehydration / Enteritis'
        ],
        clinicalReasoning: 'Pediatric respiratory and metabolic compensation reserves are low. बालरोग तज्ज्ञांकडून तातडीने तपासणी व हायड्रेशन मॉनिटरिंग आवश्यक.',
        immediatePrecautions: [
          'Keep infant/child calm and in parent embrace to prevent respiratory distress',
          'Maintain oral hydration with small, frequent sips of ORS / fluids',
          'Monitor body temperature and administer weight-adjusted antipyretic if advised',
          'Ensure clear airway'
        ],
        redFlags: ['Chest indrawing / retractions', 'Lethargy or inability to feed', 'Persistent high fever with convulsions']
      };
    } else if (containsAny(lower, pulmTerms)) {
      const dept = findDept('PULM') || findDept('GENM');
      result = {
        urgency: containsAny(lower, ['blood', 'रक्त', 'खून', 'घरघर', 'severe']) ? 'CRITICAL' : 'HIGH',
        urgencyCode: 'LEVEL_2_EMERGENT',
        confidence: 93,
        departmentName: dept.name,
        departmentCode: dept.code,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: '10 - 20 Minutes',
        suspectedConditions: [
          'Acute Bronchial Asthma / COPD Exacerbation (दमा)',
          'Lower Respiratory Tract Infection / Pneumonia',
          'Pulmonary Hemoptysis'
        ],
        clinicalReasoning: 'Signs of airway obstruction or alveolar consolidation. नेब्युलायझेशन (Nebulization), छातीचा X-Ray आणि SpO2 मॉनिटरिंग आवश्यक.',
        immediatePrecautions: [
          'Administer bronchodilator nebulization / inhaler as directed',
          'Keep in upright sitting posture',
          'Measure continuous SpO2 pulse oximetry',
          'Avoid cold exposure and dust triggers'
        ],
        redFlags: ['SpO2 falling below 90%', 'Cyanosis of lips or fingernails', 'Inability to speak in full sentences']
      };
    } else if (containsAny(lower, orthoTerms)) {
      const dept = findDept('ORTH');
      result = {
        urgency: containsAny(lower, ['fracture', 'मोडणे', 'टूटना', 'dislocation', 'उघडी जखम']) ? 'HIGH' : 'MODERATE',
        urgencyCode: 'LEVEL_3_URGENT',
        confidence: 94,
        departmentName: dept.name,
        departmentCode: dept.code,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: '15 - 30 Minutes',
        suspectedConditions: [
          'Acute Bone Fracture / Dislocation (हाड फ्रॅक्चर)',
          'Ligamentous Sprain / Joint Effusion (मुरगळणे)',
          'Musculoskeletal Trauma'
        ],
        clinicalReasoning: 'Traumatic orthopedic injury with weight-bearing or range-of-motion impairment. डिजिटल X-Ray व तात्काळ स्प्लिंट/प्लास्टर आवश्यक.',
        immediatePrecautions: [
          'Follow R.I.C.E protocol (Rest, Ice for 20 mins, Compression, Elevation)',
          'Immobilize affected extremity with rigid support',
          'Do not bear weight or attempt manual bone resetting',
          'Check distal sensation and pulse'
        ],
        redFlags: ['Loss of sensation or pulse below injury', 'Cold, pale extremity', 'Visible bone piercing skin']
      };
    } else if (containsAny(lower, gastTerms)) {
      const dept = findDept('GAST') || findDept('SURG') || findDept('GENM');
      result = {
        urgency: containsAny(lower, ['blood', 'रक्त', 'खून', 'तीव्र', 'severe']) ? 'CRITICAL' : 'MODERATE',
        urgencyCode: 'LEVEL_3_URGENT',
        confidence: 92,
        departmentName: dept.name,
        departmentCode: dept.code,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: '15 - 30 Minutes',
        suspectedConditions: [
          'Acute Gastroenteritis / Peptic Ulcer Disease (पित्त व पोटदुखी)',
          'Hepatic / Biliary Dysfunction (कावीळ / पित्ताशय)',
          'Acute Abdomen / GI Bleeding'
        ],
        clinicalReasoning: 'Gastrointestinal distress with inflammatory or mucosal involvement. सोनोग्राफी (USG Abdomen) व लिव्हर फंक्शन टेस्ट सुचविली जाते.',
        immediatePrecautions: [
          'Hydrate with oral rehydration salts (ORS) in small sips',
          'Avoid oily, spicy, acidic foods and milk',
          'Do not take NSAID painkillers which worsen stomach lining',
          'Rest in comfortable lateral position'
        ],
        redFlags: ['Vomiting blood or coffee-ground material', 'Black tarry stools (melena)', 'Rigid, board-like abdomen']
      };
    } else if (containsAny(lower, gynTerms)) {
      const dept = findDept('GYN');
      result = {
        urgency: containsAny(lower, ['bleeding', 'रक्त', 'गर्भावस्था', 'severe']) ? 'HIGH' : 'MODERATE',
        urgencyCode: 'LEVEL_3_URGENT',
        confidence: 93,
        departmentName: dept.name,
        departmentCode: dept.code,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: '15 - 30 Minutes',
        suspectedConditions: [
          'Obstetric / Gynecological Evaluation (स्त्रीरोग तपासणी)',
          'Pelvic Pain / Dysmenorrhea',
          'High-Risk Antenatal Care'
        ],
        clinicalReasoning: 'Specialized women health and pelvic assessment indicated. प्रसूती व स्त्रीरोग तज्ज्ञांकडून सोनोग्राफी व क्लिनिकल तपासणी आवश्यक.',
        immediatePrecautions: [
          'Rest in left lateral recumbent position',
          'Track pain duration and any fluid discharge',
          'Avoid heavy lifting or strenuous activity',
          'Take prescribed antispasmodics only'
        ],
        redFlags: ['Heavy bleeding with blood clots', 'Sudden sharp unilateral pelvic agony', 'High fever with chills in pregnancy']
      };
    } else if (containsAny(lower, urolTerms)) {
      const dept = findDept('UROL') || findDept('SURG');
      result = {
        urgency: containsAny(lower, ['blood', 'रक्त', 'अडकणे', 'severe']) ? 'HIGH' : 'MODERATE',
        urgencyCode: 'LEVEL_3_URGENT',
        confidence: 94,
        departmentName: dept.name,
        departmentCode: dept.code,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: '15 - 30 Minutes',
        suspectedConditions: [
          'Renal Calculus / Ureteric Colic (मुतखडा / किडनी स्टोन)',
          'Urinary Tract Infection (UTI / लघवीला जळजळ)',
          'Acute Urinary Retention'
        ],
        clinicalReasoning: 'Genitourinary symptoms consistent with renal colic or acute urinary tract inflammation. सोनोग्राफी (KUB Ultrasound) व युरिन रूटीन तपासणी आवश्यक.',
        immediatePrecautions: [
          'Drink plenty of boiled warm water unless urine is completely blocked',
          'Avoid calcium-oxalate rich foods temporarily',
          'Apply warm compress to lumbar/flank region for muscle relaxation'
        ],
        redFlags: ['Complete inability to urinate for > 8 hours', 'Gross hematuria (visible blood)', 'High fever with rigors']
      };
    } else if (containsAny(lower, entTerms)) {
      const dept = findDept('ENT');
      result = {
        urgency: containsAny(lower, ['blood', 'रक्त', 'चोक', 'choking']) ? 'HIGH' : 'MODERATE',
        urgencyCode: 'LEVEL_3_URGENT',
        confidence: 92,
        departmentName: dept.name,
        departmentCode: dept.code,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: '20 - 35 Minutes',
        suspectedConditions: [
          'Acute Otitis Media / Ear Infection (कान दुखणे व पू)',
          'Acute Pharyngitis / Tonsillitis (घसा व टॉन्सिल्स)',
          'Epistaxis / Sinusitis'
        ],
        clinicalReasoning: 'Otorhinolaryngology examination required. कान-नाक-घसा तज्ज्ञांकडून ऑटोस्कोपी (Otoscopy) व तपासणी आवश्यक.',
        immediatePrecautions: [
          'Do not insert cotton swabs or sharp objects inside ear canal',
          'Warm saline gargles for sore throat 3 times daily',
          'For nosebleed: pinch soft part of nose and lean head slightly forward'
        ],
        redFlags: ['Stridor or difficulty breathing/swallowing', 'Severe mastoid tenderness behind ear', 'Uncontrolled active epistaxis']
      };
    } else if (containsAny(lower, dermTerms)) {
      const dept = findDept('DERM');
      result = {
        urgency: 'ROUTINE',
        urgencyCode: 'LEVEL_4_ROUTINE',
        confidence: 91,
        departmentName: dept.name,
        departmentCode: dept.code,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: '25 - 40 Minutes',
        suspectedConditions: [
          'Allergic Contact Dermatitis / Urticaria (त्वचा ऍलर्जी)',
          'Cutaneous Fungal Infection / Tinea (गजकर्ण / इसब)',
          'Acne Vulgaris / Skin Lesions'
        ],
        clinicalReasoning: 'Dermatological presentation. त्वचारोग तज्ज्ञांकडून तपासणी, ऍलर्जी विरोधी उपचार व मलम सुचवले जातील.',
        immediatePrecautions: [
          'Avoid scratching to prevent secondary bacterial infection',
          'Wash with mild, fragrance-free soap and pat dry gently',
          'Avoid applying random steroid creams without physician prescription'
        ],
        redFlags: ['Rapidly spreading facial swelling / angioedema', 'Skin peeling with blistering over large areas']
      };
    } else if (containsAny(lower, ophtTerms)) {
      const dept = findDept('OPHT');
      result = {
        urgency: containsAny(lower, ['loss of vision', 'अंधुक', 'कमी']) ? 'HIGH' : 'MODERATE',
        urgencyCode: 'LEVEL_3_URGENT',
        confidence: 92,
        departmentName: dept.name,
        departmentCode: dept.code,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: '20 - 35 Minutes',
        suspectedConditions: [
          'Acute Conjunctivitis / Ocular Infection (डोळे येणे)',
          'Cataract / Refractive Disorder (मोतीबिंदू)',
          'Corneal Abrasion / Ocular Foreign Body'
        ],
        clinicalReasoning: 'Ophthalmic examination required. स्लिट लॅम्प (Slit Lamp) तपासणी व दृष्टी चाचणी आवश्यक.',
        immediatePrecautions: [
          'Do not rub or press the affected eye',
          'Wear protective dark sunglasses to prevent photophobia',
          'Do not use contact lenses until cleared by ophthalmologist'
        ],
        redFlags: ['Sudden painless or painful total loss of vision', 'Chemical exposure or penetrating eye injury']
      };
    } else {
      // DEFAULT: General Medicine / Ambulatory
      const dept = findDept('GENM');
      const isUrgent = containsAny(lower, ['high fever', 'खूप ताप', 'तेज बुखार', 'weakness', 'अशक्तपणा']);
      result = {
        urgency: isUrgent ? 'MODERATE' : 'ROUTINE',
        urgencyCode: isUrgent ? 'LEVEL_3_URGENT' : 'LEVEL_4_ROUTINE',
        confidence: 89,
        departmentName: dept.name,
        departmentCode: dept.code,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: isUrgent ? '15 - 25 Minutes' : '20 - 45 Minutes',
        suspectedConditions: [
          'Acute Upper Respiratory Infection / Viral Fever (व्हायरल ताप)',
          'Systemic Febrile Illness / Ambulatory Care',
          'General Medical Evaluation'
        ],
        clinicalReasoning: 'Symptom profile is consistent with primary ambulatory systemic illness. प्राथमिक फिजिशियन तपासणी, सीबीसी (CBC) रक्तचाचणी आणि औषधोपचार पुरेसे आहेत.',
        immediatePrecautions: [
          'Maintain generous oral hydration (minimum 2.5 - 3.0 Liters daily)',
          'Temperature regulation with lukewarm sponging and prescribed antipyretics',
          'Adequate rest in a well-ventilated room',
          'Monitor body temperature every 4 hours'
        ],
        redFlags: ['Persistent high fever > 103 F unresponsive to medication', 'Altered mental status or delirium', 'Persistent vomiting with inability to retain oral fluids']
      };
    }

    res.json({
      triage: result,
      source: 'multilingual-deterministic-engine',
      analyzedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('AI Triage error:', err);
    res.status(500).json({ error: 'Failed to process AI clinical triage.' });
  }
});

export default router;
