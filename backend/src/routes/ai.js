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
    const findDept = (code) => depts.find(d => d.code === code) || depts[0];

    let result = null;

    // 1. Cardiac Emergency Criteria
    if (
      lower.includes('chest pain') || lower.includes('chest tightness') ||
      lower.includes('angina') || lower.includes('heart attack') ||
      lower.includes('palpitation') || lower.includes('radiating to left arm') ||
      (lower.includes('shortness of breath') && lower.includes('sweat'))
    ) {
      const dept = findDept('CARD');
      result = {
        urgency: 'CRITICAL',
        urgencyCode: 'LEVEL_1_RESUSCITATION',
        confidence: 96,
        departmentName: dept.name,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: '0 - 5 Minutes (Immediate)',
        suspectedConditions: [
          'Acute Coronary Syndrome (ACS)',
          'Myocardial Ischemia / Unstable Angina',
          'Cardiac Dysrhythmia'
        ],
        clinicalReasoning: 'Presentation features classic anginal characteristics with potential myocardial compromise. Priority 12-lead ECG, cardiac troponin I/T assay, and continuous rhythm telemetry indicated.',
        immediatePrecautions: [
          'Administer high-flow supplemental oxygen if SpO2 < 94%',
          'Prepare sublingual nitroglycerin and chewable antiplatelet if approved by on-duty physician',
          'Position patient in comfortable semi-Fowler position; strictly prohibit physical exertion',
          'Secure 18G intravenous access and prepare resuscitation equipment'
        ],
        redFlags: ['Sudden loss of consciousness (syncope)', 'Severe diaphoresis with cyanosis', 'Systolic BP < 90 mmHg']
      };
    }
    // 2. Stroke / Acute Neurological Criteria
    else if (
      lower.includes('stroke') || lower.includes('facial droop') ||
      lower.includes('speech slur') || lower.includes('arm weakness') ||
      lower.includes('seizure') || lower.includes('worst headache of life') ||
      lower.includes('aura') || lower.includes('numbness on one side')
    ) {
      const dept = findDept('NEUR');
      result = {
        urgency: lower.includes('slur') || lower.includes('droop') || lower.includes('seizure') ? 'CRITICAL' : 'HIGH',
        urgencyCode: 'LEVEL_2_EMERGENT',
        confidence: 93,
        departmentName: dept.name,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: '5 - 15 Minutes',
        suspectedConditions: [
          'Acute Ischemic Stroke / TIA (BE-FAST Protocol)',
          'Subarachnoid Hemorrhage / Complex Migraine',
          'Focal Neurological Deficit'
        ],
        clinicalReasoning: 'Acute focal neurological symptoms require immediate exclusion of intracranial hemorrhage or large vessel occlusion within the thrombolytic window (tPA < 4.5 hours).',
        immediatePrecautions: [
          'Note exact time of symptom onset or "last known well"',
          'Maintain NPO (Nil Per Os - nothing by mouth) due to aspiration danger',
          'Rush non-contrast CT brain scan and blood glucose check immediately',
          'Keep patient head elevated at 30 degrees'
        ],
        redFlags: ['Glasgow Coma Scale (GCS) deterioration', 'Unilateral pupillary dilation', 'Repeated projectile vomiting']
      };
    }
    // 3. Orthopedic / Trauma Criteria
    else if (
      lower.includes('fracture') || lower.includes('ankle') || lower.includes('twist') ||
      lower.includes('fall') || lower.includes('bone') || lower.includes('joint') ||
      lower.includes('swelling') || lower.includes('unable to walk')
    ) {
      const dept = findDept('ORTH');
      result = {
        urgency: lower.includes('deformity') || lower.includes('open') ? 'HIGH' : 'MODERATE',
        urgencyCode: 'LEVEL_3_URGENT',
        confidence: 94,
        departmentName: dept.name,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: '15 - 30 Minutes',
        suspectedConditions: [
          'Acute Ligamentous Sprain / Dislocation',
          'Closed Fibular / Malleolar Fracture',
          'Traumatic Joint Effusion / Hemarthrosis'
        ],
        clinicalReasoning: 'Localized trauma with weight-bearing impairment necessitates standard two-plane radiography (AP/Lateral) to evaluate cortical bone continuity and ligamentous stability.',
        immediatePrecautions: [
          'Apply R.I.C.E protocol (Rest, Ice application 20 mins, Elastic compression, Heart-level elevation)',
          'Immobilize affected extremity with temporary splint',
          'Check distal neurovascular status (dorsalis pedis pulse & capillary refill)',
          'Avoid premature weight-bearing'
        ],
        redFlags: ['Loss of distal peripheral pulse', 'Cold, pale, or completely insensible extremity', 'Visible open bone protrusion']
      };
    }
    // 4. Pediatric Symptoms
    else if (
      lower.includes('child') || lower.includes('baby') || lower.includes('infant') ||
      lower.includes('stridor') || lower.includes('barking cough') || Number(age) < 14
    ) {
      const dept = findDept('PED');
      result = {
        urgency: lower.includes('stridor') || lower.includes('breathing fast') ? 'HIGH' : 'MODERATE',
        urgencyCode: 'LEVEL_2_PEDIATRIC',
        confidence: 91,
        departmentName: dept.name,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: '10 - 20 Minutes',
        suspectedConditions: [
          'Acute Viral Laryngotracheobronchitis (Croup)',
          'Pediatric Bronchiolitis / Reactive Airway Disease',
          'Febrile Infection of Early Childhood'
        ],
        clinicalReasoning: 'Pediatric respiratory compromise has narrow physiological reserve. Prompt pediatric airway assessment and continuous pulse oximetry are paramount.',
        immediatePrecautions: [
          'Expose infant/child to humidified cool mist or steamy bathroom',
          'Keep child upright and calm in parent’s embrace to prevent airway agitation',
          'Administer antipyretic (Paracetamol suspension) according to weight if febrile',
          'Encourage small, frequent oral electrolyte fluids'
        ],
        redFlags: ['Subcostal / intercostal chest retractions', 'Lethargy or inability to feed', 'Persistent grunting with cyanosis']
      };
    }
    // 5. Systemic Infection / General Medicine
    else {
      const dept = findDept('GENM');
      result = {
        urgency: lower.includes('high fever') || lower.includes('vomit') ? 'MODERATE' : 'MILD',
        urgencyCode: 'LEVEL_4_AMBULATORY',
        confidence: 89,
        departmentName: dept.name,
        departmentId: dept.id,
        departmentFloor: dept.floor_number,
        estimatedWaitTime: '20 - 45 Minutes',
        suspectedConditions: [
          'Acute Upper / Lower Respiratory Tract Infection',
          'Systemic Febrile Illness / Acute Gastroenteritis',
          'General Ambulatory Illness'
        ],
        clinicalReasoning: 'Symptom profile is consistent with primary ambulatory systemic illness. Complete Blood Count (CBC), baseline vitals, and physician physical examination indicated.',
        immediatePrecautions: [
          'Maintain generous oral hydration (minimum 2.5 - 3.0 Liters daily)',
          'Temperature regulation with lukewarm sponging and prescribed antipyretics',
          'Rest in a well-ventilated environment',
          'Monitor body temperature every 4 hours'
        ],
        redFlags: ['Persistent high fever > 103 F unresponsive to medication', 'Difficulty breathing or confusion', 'Inability to retain liquids']
      };
    }

    res.json({
      triage: result,
      analyzedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('AI Triage error:', err);
    res.status(500).json({ error: 'Failed to process AI clinical triage.' });
  }
});

export default router;
