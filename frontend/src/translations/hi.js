export const hi = {
  // Common & Branding
  brand: {
    poweredBy: 'मेडेटेक एआई द्वारा संचालित',
    live: 'लाइव (LIVE)',
    defaultHospital: 'सिटी मल्टी-स्पेशलिटी हॉस्पिटल',
    defaultTagline: 'तृतीयक नैदानिक देखभाल एवं २४x७ ट्रॉमा सेंटर',
    statusReady: 'आपातकालीन तैयार',
    statusSubtext: 'SQLite WAL • लेवल-१ ट्रॉमा सक्रिय',
    operations: 'क्लिनिकल ऑपरेशंस',
  },

  // Navigation
  nav: {
    dashboard: 'कमांड सेंटर',
    appointments: 'अपॉइंटमेंट्स',
    beds: 'वार्ड एवं बेड्स',
    doctors: 'चिकित्सा कर्मी',
    prescriptions: 'पर्चे (प्रिस्क्रिप्शन)',
    labReports: 'डायग्नोस्टिक लैब्स',
    aiTriage: 'एआई क्लिनिकल ट्राइएज',
  },

  // Header
  header: {
    liveClock: 'लाइव',
    demoRoles: 'डेमो भूमिकाएं:',
    admin: 'प्रशासक (Admin)',
    drSarah: 'डॉ. सारा',
    patientElena: 'रोगी एलेना',
    hospitalSettings: 'अस्पताल सेटिंग्स',
    bookAppointment: 'अपॉइंटमेंट बुक करें',
    signIn: 'साइन इन करें',
    signOut: 'साइन आउट',
    languages: 'भाषा चुनें',
  },

  // Dashboard
  dashboard: {
    platformBadge: 'एआई-संचालित क्लिनिकल ऑपरेशंस प्लेटफॉर्म',
    welcome: 'वापसी पर स्वागत है,',
    clinician: 'चिकित्सक',
    telemetryDesc: 'अस्पताल टेलीमेट्री, सक्रिय वार्ड बेड, कुशल रोगी ट्राइएज और शेड्यूलिंग सभी चिकित्सा विभागों में समकालिक रूप से काम कर रहे हैं।',
    aiTriageBtn: 'एआई ट्राइएज सहायक',
    bookAppointmentBtn: 'अपॉइंटमेंट बुक करें',
    
    // KPI Cards
    totalPatients: 'कुल मरीज',
    monthGrowth: '+१२% इस महीने',
    doctorsOnDuty: 'ड्यूटी पर तैनात डॉक्टर्स',
    deptsCovered: 'सभी ५ क्लिनिकल विभाग कार्यरत',
    appointmentsToday: 'आज की नियुक्तियां',
    tokenQueueRunning: 'सक्रिय टोकन कतार चालू है',
    bedOccupancy: 'बेड ऑक्यूपेंसी',
    bedsAvailable: 'बेड उपलब्ध',

    // Active Clinical Alerts
    activeAlerts: 'सक्रिय अस्पताल टेलीमेट्री और आपातकालीन अलर्ट',
    liveFeeds: 'रियल-टाइम टेलीमेट्री फीड्स',
    alertIcu: 'आईसीयू बेड क्षमता अलर्ट',
    alertIcuDesc: 'आईसीयू वार्ड A वर्तमान में ८०% भरा हुआ है। सब-एक्यूट वार्ड में स्टैंडबाय आपातकालीन बेड तैयार हैं।',
    alertLab: 'महत्वपूर्ण लैब परिणाम ध्वजांकित',
    alertLabDesc: 'ऑटो-एआई विश्लेषक ने मरीज #PT-8821 के लिए लैब #LAB-9042 में बढ़े हुए ट्रोपोनिन-आई का पता लगाया है।',
    alertAmbulance: 'आपातकालीन एम्बुलेंस रास्ते में है',
    alertAmbulanceDesc: 'ट्रॉमा यूनिट स्टैंडबाय का अनुरोध। अनुमानित समय: १४ मिनट, मरीज के वाइटल्स लाइव स्ट्रीम हो रहे हैं।',

    // Department Distribution
    deptDistribution: 'विभाग क्षमता एवं क्लिनिकल कार्यभार',
    deptSubtext: 'लाइव बेड और दैनिक अपॉइंटमेंट विवरण',
    deptColDepartment: 'विभाग',
    deptColStaff: 'सक्रिय कर्मचारी',
    deptColAppts: 'आज की नियुक्तियां',
    deptColBeds: 'बेड ऑक्यूपेंसी',
    deptColStatus: 'स्थिति',
    optimal: 'अनुकूल (Optimal)',
    highCapacity: 'उच्च क्षमता (High)',

    // Quick Actions
    quickActions: 'त्वरित नैदानिक क्रियाएं',
    actionTriageTitle: 'एआई ट्राइएज चलाएं',
    actionTriageDesc: 'स्वचालित गंभीरता स्कोरिंग के साथ आने वाले मरीज के लक्षणों का मूल्यांकन करें।',
    actionBookTitle: 'रोगी अपॉइंटमेंट शेड्यूल करें',
    actionBookDesc: 'स्वचालित स्लॉट सत्यापन के साथ रोगी को विशेषज्ञ डॉक्टर आवंटित करें।',
    actionBedTitle: 'बेड एवं वार्ड प्रबंधन',
    actionBedDesc: 'लाइव स्टेटस अपडेट के साथ आईसीयू, जनरल या आपातकालीन बेड आवंटित करें।',
    actionRxTitle: 'ई-प्रिस्क्रिप्शन जनरेट करें',
    actionRxDesc: 'खुराक, आवृत्तियों और लैब आदेशों के साथ डिजिटल प्रिस्क्रिप्शन।'
  },

  // Book Appointment Modal
  booking: {
    modalTitle: 'क्लिनिकल अपॉइंटमेंट बुक करें',
    selectDept: 'चिकित्सा विभाग',
    selectDoctor: 'उपचार करने वाले डॉक्टर',
    patientName: 'मरीज का पूरा नाम',
    patientEmail: 'मरीज का ईमेल',
    patientPhone: 'फ़ोन नंबर',
    appointmentDate: 'अपॉइंटमेंट की तिथि',
    timeSlot: 'समय स्लॉट चुनें',
    clinicalReason: 'मुख्य लक्षण / यात्रा का कारण',
    reasonPlaceholder: 'परामर्श के लिए लक्षण या कारण का विवरण दें...',
    cancelBtn: 'रद्द करें',
    confirmBtn: 'अपॉइंटमेंट की पुष्टि करें',
    bookingSuccess: 'अपॉइंटमेंट सफलतापूर्वक बुक हो गई!',
    bookingError: 'अपॉइंटमेंट बुक करने में विफलता',
    selectDeptPrompt: 'विभाग का चयन करें',
    selectDoctorPrompt: 'डॉक्टर का चयन करें',
    availableSlots: 'उपलब्ध समय स्लॉट',
    urgencyLevel: 'ट्राइएज प्राथमिकता / तात्कालिकता',
    urgencyRoutine: 'नियमित परामर्श (Routine)',
    urgencyUrgent: 'तत्काल (Urgent)',
    urgencyEmergency: 'आपातकालीन (Emergency)'
  },

  // Common UI
  common: {
    save: 'सहेजें',
    cancel: 'रद्द करें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    loading: 'लोड हो रहा है...',
    refresh: 'रिफ्रेश करें',
    search: 'खोजें...',
    filter: 'फ़िल्टर',
    status: 'स्थिति',
    actions: 'कार्रवाई',
    close: 'बंद करें',
    viewDetails: 'विवरण देखें',
    all: 'सभी',
    confirmed: 'पुष्टीकृत',
    pending: 'लंबित',
    completed: 'पूर्ण',
    cancelled: 'रद्द किया गया',
    inProgress: 'प्रगति पर',
    available: 'उपलब्ध',
    occupied: 'व्यस्त (Occupied)',
    maintenance: 'रखरखाव'
  }
};
