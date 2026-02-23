import React, { useState, useEffect } from 'react';
import { 
  Heart, Calendar, Info, Phone, Mail, MapPin, Users, Euro, 
  ShieldCheck, Lock, LogOut, Plus, Trash2, Download, CheckCircle, 
  Menu, X, User, Briefcase, MessageSquare, Clock, GripVertical, FileText, Send, Save, ChevronRight, ChevronLeft, Zap, FileSearch, Printer, Key, Filter, CalendarDays, AlertCircle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'minten-walter-app';

// --- MASTER PRESETS FOR BURIAL TYPES ---
const BURIAL_PRESETS = {
  'Erdbestattung': [
    { title: 'Behörden & Dokumente', items: [{ text: 'Totenschein beim Arzt abgeholt', completed: false }, { text: 'Stammbuch / Ausweis der Familie erhalten', completed: false }, { text: 'Sterbefall beim Standesamt gemeldet', completed: false }, { text: 'Sterbeurkunden abgeholt', completed: false }] },
    { title: 'Beisetzung & Feier (Erde)', items: [{ text: 'Termin mit Friedhofsamt abgestimmt', completed: false }, { text: 'Erdsarg bestellt', completed: false }, { text: 'Grabmachertechnik / Träger beauftragt', completed: false }, { text: 'Florist beauftragt (Sargbouquet, Kränze)', completed: false }, { text: 'Trauerredner(in) gebucht', completed: false }] }
  ],
  'Feuerbestattung': [
    { title: 'Behörden & Dokumente', items: [{ text: 'Totenschein beim Arzt abgeholt', completed: false }, { text: 'Stammbuch / Ausweis der Familie erhalten', completed: false }, { text: 'Sterbefall beim Standesamt gemeldet', completed: false }, { text: 'Sterbeurkunden abgeholt', completed: false }] },
    { title: 'Kremation & Feier (Feuer)', items: [{ text: 'Krematoriumstermin gebucht', completed: false }, { text: '2. ärztliche Leichenschau angemeldet', completed: false }, { text: 'Verbrennungssarg bestellt', completed: false }, { text: 'Schmuckurne bestellt', completed: false }, { text: 'Termin mit Friedhofsamt (Urnenbeisetzung) abgestimmt', completed: false }] }
  ],
  'Seebestattung': [
    { title: 'Behörden & Dokumente', items: [{ text: 'Totenschein beim Arzt abgeholt', completed: false }, { text: 'Willenserklärung Seebestattung liegt vor', completed: false }, { text: 'Sterbefall beim Standesamt gemeldet', completed: false }, { text: 'Sterbeurkunden abgeholt', completed: false }] },
    { title: 'Kremation & Reederei (See)', items: [{ text: 'Krematoriumstermin gebucht', completed: false }, { text: '2. ärztliche Leichenschau angemeldet', completed: false }, { text: 'Wasserlösliche See-Urne bestellt', completed: false }, { text: 'Termin mit Reederei abgestimmt', completed: false }, { text: 'Urnenversand an Reederei organisiert', completed: false }] }
  ],
  'Baumbestattung / Friedwald': [
    { title: 'Behörden & Dokumente', items: [{ text: 'Totenschein beim Arzt abgeholt', completed: false }, { text: 'Stammbuch / Ausweis der Familie erhalten', completed: false }, { text: 'Sterbefall beim Standesamt gemeldet', completed: false }, { text: 'Sterbeurkunden abgeholt', completed: false }] },
    { title: 'Kremation & Wald (Baum)', items: [{ text: 'Krematoriumstermin gebucht', completed: false }, { text: '2. ärztliche Leichenschau angemeldet', completed: false }, { text: 'Biologisch abbaubare Urne bestellt', completed: false }, { text: 'Termin mit Friedwald / Förster abgestimmt', completed: false }, { text: 'Baumauswahl getroffen', completed: false }] }
  ],
  'Noch unklar': [
    { title: 'Behörden & Erste Schritte', items: [{ text: 'Totenschein beim Arzt abgeholt', completed: false }, { text: 'Überführung veranlasst', completed: false }, { text: 'Beratungstermin vereinbaren', completed: false }] }
  ]
};

const PRICING = {
  baseFee: 1450, 
  burialType: { 'Erdbestattung': 0, 'Feuerbestattung': 350, 'Seebestattung': 1150, 'Baumbestattung / Friedwald': 350 },
  coffinUrn: { 'Standard': 450, 'Natur / Bio': 750, 'Individuell': 950 },
  ceremony: { 'Keine Feier': 0, 'Im kleinen Kreis': 350, 'Große Trauerfeier': 850 }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('home'); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Login States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Admin Dashboard States
  const [adminTab, setAdminTab] = useState('cases'); 
  const [appointments, setAppointments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [cases, setCases] = useState([]);
  const [messages, setMessages] = useState([]);
  const [presets, setPresets] = useState([]); 

  const [activeCaseId, setActiveCaseId] = useState(null);
  const [newCaseNote, setNewCaseNote] = useState('');

  // --- FAMILY PORTAL STATES ---
  const [familyPinInput, setFamilyPinInput] = useState('');
  const [familyActiveCase, setFamilyActiveCase] = useState(null);
  const [newMemoryText, setNewMemoryText] = useState('');

  // --- WIZARD STATES (Neuer Fall im Backend) ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  
  const initialCaseData = {
    deceased: { firstName: '', lastName: '', birthDate: '', deathDate: '', deathPlace: '', maritalStatus: '', religion: '', address: '' },
    contact: { firstName: '', lastName: '', relation: '', phone: '', email: '', address: '' },
    wishes: { burialType: 'Erdbestattung', specialWishes: '' },
    checklists: JSON.parse(JSON.stringify(BURIAL_PRESETS['Erdbestattung'])),
    memories: []
  };
  const [newCaseData, setNewCaseData] = useState(initialCaseData);

  // --- VORSORGE KONFIGURATOR STATES (Kunden Website) ---
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  const [configStep, setConfigStep] = useState(1);
  const [isSubmittingVorsorge, setIsSubmittingVorsorge] = useState(false); 
  const [configData, setConfigData] = useState({
    burialType: 'Feuerbestattung',
    coffinUrn: 'Natur / Bio',
    ceremony: 'Im kleinen Kreis',
    contact: { firstName: '', lastName: '', phone: '', email: '' }
  });

  const estimatedPrice = PRICING.baseFee + (PRICING.burialType[configData.burialType] || 0) + (PRICING.coffinUrn[configData.coffinUrn] || 0) + (PRICING.ceremony[configData.ceremony] || 0);

  // --- AUFGABEN & TERMINE STATES (DASHBOARD UPGRADE) ---
  const [newApptTitle, setNewApptTitle] = useState('');
  const [newApptDate, setNewApptDate] = useState('');
  
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Alle');
  const [newTaskDueDate, setNewTaskDueDate] = useState(''); // NEU: Fälligkeitsdatum
  const [taskFilter, setTaskFilter] = useState('Alle'); // NEU: Filter für "Meine Aufgaben"

  const [newMessage, setNewMessage] = useState('');

  const KANBAN_COLUMNS = [
    { id: 'Neu', title: 'Neu / Erstkontakt', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 'In Planung', title: 'In Planung', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { id: 'Behörden & Orga', title: 'Behörden & Orga', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { id: 'Trauerfeier', title: 'Trauerfeier', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { id: 'Abgeschlossen', title: 'Abgeschlossen', color: 'bg-green-100 text-green-800 border-green-200' }
  ];

  const generateFamilyPin = () => Math.random().toString(36).substr(2, 6).toUpperCase();

  // --- AUTH & DATA FETCHING ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) { console.error("Auth error:", error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const handleErr = (err) => console.error("Firestore Error:", err);
    const unsubAppt = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'appointments'), (s) => setAppointments(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(a.date) - new Date(b.date))), handleErr);
    const unsubTasks = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'), (s) => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))), handleErr);
    const unsubCases = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'cases'), (s) => {
      const fetchedCases = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setCases(fetchedCases);
      if (familyActiveCase) {
        const updated = fetchedCases.find(c => c.id === familyActiveCase.id);
        if (updated) setFamilyActiveCase(updated);
      }
    }, handleErr);
    const unsubMessages = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'messages'), (s) => setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))), handleErr);
    const unsubPresets = onSnapshot(collection(db, 'artifacts', appId, 'users', user.uid, 'presets'), (s) => setPresets(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.name || '').localeCompare(b.name || ''))), handleErr);
    
    return () => { unsubAppt(); unsubTasks(); unsubCases(); unsubMessages(); unsubPresets(); };
  }, [user, familyActiveCase?.id]);

  // --- LOGIN LOGIC ---
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (username.toLowerCase() === 'walter' && password === '2026!') {
      setLoginError(''); setView('admin'); setUsername(''); setPassword('');
    } else { setLoginError('Falscher Benutzername oder Passwort.'); }
  };

  const handleFamilyLoginSubmit = (e) => {
    e.preventDefault();
    const foundCase = cases.find(c => c.familyPin === familyPinInput.trim().toUpperCase());
    if (foundCase) {
      setFamilyActiveCase(foundCase); setView('familyPortal'); setLoginError(''); setFamilyPinInput('');
    } else { setLoginError('Ungültiger Zugangs-Code.'); }
  };

  const handleLogout = () => { setView('home'); setAdminTab('cases'); setActiveCaseId(null); setFamilyActiveCase(null); };

  // --- ADMIN ACTIONS & KANBAN LOGIC ---
  const handleAddAppointment = async (e) => { e.preventDefault(); if (!user || !newApptTitle || !newApptDate) return; await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'appointments'), { title: newApptTitle, date: newApptDate, createdAt: new Date().toISOString() }); setNewApptTitle(''); setNewApptDate(''); };
  
  const handleAddTask = async (e) => { 
    e.preventDefault(); 
    if (!user || !newTaskTitle) return; 
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'tasks'), { 
      title: newTaskTitle, 
      assignee: newTaskAssignee, 
      dueDate: newTaskDueDate || null, // Speichere Fälligkeitsdatum
      completed: false, 
      createdAt: new Date().toISOString() 
    }); 
    setNewTaskTitle(''); 
    setNewTaskDueDate('');
  };
  
  const handleAddMessage = async (e) => { e.preventDefault(); if (!user || !newMessage) return; await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'messages'), { text: newMessage, author: 'Ralph', createdAt: new Date().toISOString() }); setNewMessage(''); };
  const toggleTaskCompletion = async (id, currentStatus) => { await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'tasks', id), { completed: !currentStatus }); };
  const deleteDocItem = async (collectionName, id) => { await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, collectionName, id)); if (collectionName === 'cases' && activeCaseId === id) setActiveCaseId(null); };

  const handleDragStart = (e, caseId) => { e.dataTransfer.setData('caseId', caseId); e.currentTarget.style.opacity = '0.5'; };
  const handleDragEnd = (e) => { e.currentTarget.style.opacity = '1'; };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = async (e, targetStatus) => { e.preventDefault(); const caseId = e.dataTransfer.getData('caseId'); if (caseId && user) await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'cases', caseId), { status: targetStatus }); };

  // --- CASE WIZARD LOGIC (Backend) ---
  const openCreateModal = () => { setNewCaseData(initialCaseData); setCreateStep(1); setIsCreateModalOpen(true); };
  const handleCaseDataChange = (section, field, value) => {
    setNewCaseData(prev => {
      const updatedData = { ...prev, [section]: { ...prev[section], [field]: value } };
      if (section === 'wishes' && field === 'burialType' && BURIAL_PRESETS[value]) {
        updatedData.checklists = JSON.parse(JSON.stringify(BURIAL_PRESETS[value]));
      }
      return updatedData;
    });
  };
  const handleAddChecklist = () => { setNewCaseData(prev => ({ ...prev, checklists: [...prev.checklists, { title: 'Neue Liste', items: [] }] })); };
  const handleUpdateChecklistTitle = (listIndex, newTitle) => { const newLists = [...newCaseData.checklists]; newLists[listIndex].title = newTitle; setNewCaseData(prev => ({ ...prev, checklists: newLists })); };
  const handleAddChecklistItem = (listIndex) => { const newLists = [...newCaseData.checklists]; newLists[listIndex].items.push({ text: 'Neue Aufgabe', completed: false }); setNewCaseData(prev => ({ ...prev, checklists: newLists })); };
  const handleUpdateChecklistItem = (listIndex, itemIndex, newText) => { const newLists = [...newCaseData.checklists]; newLists[listIndex].items[itemIndex].text = newText; setNewCaseData(prev => ({ ...prev, checklists: newLists })); };
  const handleRemoveChecklistItem = (listIndex, itemIndex) => { const newLists = [...newCaseData.checklists]; newLists[listIndex].items.splice(itemIndex, 1); setNewCaseData(prev => ({ ...prev, checklists: newLists })); };
  const handleRemoveChecklist = (listIndex) => { const newLists = [...newCaseData.checklists]; newLists.splice(listIndex, 1); setNewCaseData(prev => ({ ...prev, checklists: newLists })); };

  const loadPreset = (presetId) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) setNewCaseData(prev => ({ ...prev, checklists: JSON.parse(JSON.stringify(preset.checklists)) }));
  };
  const saveAsPreset = async () => {
    if (!user || !presetNameInput.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'presets'), { name: presetNameInput, checklists: newCaseData.checklists, createdAt: new Date().toISOString() });
    setPresetNameInput(''); setIsSavingPreset(false);
  };
  const submitNewCase = async () => {
    if (!user) return;
    const displayName = `${newCaseData.deceased.lastName || 'Unbekannt'}, ${newCaseData.deceased.firstName || ''}`.trim();
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'cases'), { 
      name: displayName === ',' ? 'Neuer Fall' : displayName,
      status: 'Neu', 
      createdAt: new Date().toISOString(), 
      deceased: newCaseData.deceased, 
      contact: newCaseData.contact, 
      wishes: newCaseData.wishes, 
      checklists: newCaseData.checklists, 
      notes: [],
      memories: [],
      familyPin: generateFamilyPin() 
    });
    setIsCreateModalOpen(false);
  };

  const getActiveCase = () => cases.find(c => c.id === activeCaseId);
  const toggleChecklistItem = async (checklistIndex, itemIndex, currentStatus) => {
    if (!user || !activeCaseId) return;
    const currentCase = getActiveCase(); if (!currentCase) return;
    const newChecklists = JSON.parse(JSON.stringify(currentCase.checklists || []));
    newChecklists[checklistIndex].items[itemIndex].completed = !currentStatus;
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'cases', activeCaseId), { checklists: newChecklists });
  };
  const addCaseNote = async (e) => {
    e.preventDefault(); if (!user || !activeCaseId || !newCaseNote.trim()) return;
    const currentCase = getActiveCase(); if (!currentCase) return;
    const newNote = { text: newCaseNote, author: 'Ralph', createdAt: new Date().toISOString(), id: Date.now().toString() };
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'cases', activeCaseId), { notes: [...(currentCase.notes || []), newNote] });
    setNewCaseNote('');
  };

  // --- VORSORGE KONFIGURATOR LOGIC ---
  const submitVorsorgeAnfrage = async () => {
    if (!user || isSubmittingVorsorge) return; 
    setIsSubmittingVorsorge(true);
    try {
      const displayName = `VORSORGE: ${configData.contact.lastName || 'Unbekannt'}, ${configData.contact.firstName || ''}`.trim();
      const specialWishesText = `Ausstattung: ${configData.coffinUrn} | Trauerfeier: ${configData.ceremony} | Kostenschätzung: ${estimatedPrice.toLocaleString('de-DE')} €`;

      await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'cases'), { 
        name: displayName,
        status: 'Neu', 
        createdAt: new Date().toISOString(),
        deceased: { firstName: configData.contact.firstName, lastName: configData.contact.lastName, birthDate: '', deathDate: '', deathPlace: '', maritalStatus: '', religion: '', address: '' }, 
        contact: configData.contact,
        wishes: { burialType: configData.burialType, specialWishes: specialWishesText },
        checklists: [
          { title: 'Vorsorge-Anfrage bearbeiten', items: [
            { text: 'Kunden kontaktieren / Termin vereinbaren', completed: false },
            { text: 'Vorsorgevertrag & Kostenvoranschlag finalisieren', completed: false }
          ]}
        ],
        notes: [{ text: `Automatische Anfrage über Website-Konfigurator. System-Schätzung: ${estimatedPrice.toLocaleString('de-DE')} €.`, author: 'System', createdAt: new Date().toISOString(), id: Date.now().toString() }],
        memories: [],
        familyPin: generateFamilyPin() 
      });
      setIsConfiguratorOpen(false); setConfigStep(1); 
      alert("Ihre Anfrage wurde sicher an uns übermittelt. Wir melden uns zeitnah bei Ihnen.");
    } catch (error) { 
      console.error(error); alert("Fehler beim Absenden."); 
    } finally { setIsSubmittingVorsorge(false); }
  };

  // --- FAMILY PORTAL LOGIC ---
  const submitMemory = async (e) => {
    e.preventDefault();
    if (!user || !familyActiveCase || !newMemoryText.trim()) return;
    const newMemory = { text: newMemoryText, createdAt: new Date().toISOString(), id: Date.now().toString() };
    await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'cases', familyActiveCase.id), { 
      memories: [...(familyActiveCase.memories || []), newMemory] 
    });
    setNewMemoryText('');
  };

  // --- DRUCK LOGIK ---
  const triggerNativePrint = () => window.print();

  const scrollTo = (id) => { setView('home'); setMobileMenuOpen(false); setTimeout(() => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 100); };

  // --- RENDER FUNCTIONS ---
  const renderNavbar = () => (
    <nav className="fixed w-full bg-[#f8f6f3]/90 backdrop-blur-md shadow-sm z-40 border-b border-[#e8e6e1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex-shrink-0 cursor-pointer" onClick={() => scrollTo('hero')}>
            <h1 className="font-serif text-2xl text-[#4a554e]">minten & walter</h1>
            <p className="text-xs tracking-widest text-[#7a857e] uppercase">bestattungen</p>
          </div>
          <div className="hidden md:flex space-x-8 items-center">
            <button onClick={() => scrollTo('philosophie')} className="text-gray-600 hover:text-[#4a554e] transition text-sm font-medium">Philosophie</button>
            <button onClick={() => scrollTo('leistungen')} className="text-gray-600 hover:text-[#4a554e] transition text-sm font-medium">Leistungen</button>
            <button onClick={() => setIsConfiguratorOpen(true)} className="text-[#4a554e] font-medium flex items-center gap-1 hover:text-[#38413b] transition text-sm"><FileSearch size={16}/> Vorsorge Planer</button>
            <button onClick={() => scrollTo('kontakt')} className="px-6 py-2.5 rounded-full border border-[#4a554e] text-[#4a554e] hover:bg-[#4a554e] hover:text-white transition text-sm font-medium">Kontakt</button>
            <div className="flex items-center gap-4 border-l border-gray-300 pl-6">
              <button onClick={() => { setView('familyLogin'); setMobileMenuOpen(false); }} className="text-gray-500 hover:text-[#4a554e] transition text-sm font-medium flex items-center gap-1"><Key size={16} /> Familien-Login</button>
              <button onClick={() => { setView('login'); setMobileMenuOpen(false); }} className="text-gray-400 hover:text-[#4a554e] bg-gray-100 p-2 rounded-full transition" title="Mitarbeiter Login"><User size={16} /></button>
            </div>
          </div>
          <div className="md:hidden flex items-center"><button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-600">{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button></div>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden bg-white px-4 py-4 space-y-4 shadow-lg border-t border-gray-100">
          <button onClick={() => scrollTo('philosophie')} className="block w-full text-left py-2 text-gray-700">Philosophie</button>
          <button onClick={() => scrollTo('leistungen')} className="block w-full text-left py-2 text-gray-700">Leistungen</button>
          <button onClick={() => { setIsConfiguratorOpen(true); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-[#4a554e] font-medium">Vorsorge planen</button>
          <button onClick={() => scrollTo('kontakt')} className="block w-full text-left py-2 text-gray-700">Kontakt</button>
          <div className="border-t pt-4 space-y-4">
            <button onClick={() => { setView('familyLogin'); setMobileMenuOpen(false); }} className="block w-full text-left text-gray-600 font-medium flex items-center gap-2"><Key size={16} /> Familien-Login</button>
            <button onClick={() => { setView('login'); setMobileMenuOpen(false); }} className="block w-full text-left text-gray-400 font-medium flex items-center gap-2"><Lock size={16} /> Mitarbeiter Login</button>
          </div>
        </div>
      )}
    </nav>
  );

  const renderHomeView = () => (
    <div className="pt-20 bg-[#faf9f7] min-h-screen">
      <section id="hero" className="relative bg-[#ebe8e1] py-24 sm:py-32 lg:pb-40 text-center px-4 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#e1ded5] opacity-50 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#3e4842] mb-6 leading-tight">Wir begleiten Abschied. <br className="hidden sm:block" />Einfühlsam, offen und menschlich.</h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">Seit über 20 Jahren sind wir in Bonn jederzeit für Sie da. Im Trauerfall ebenso wie bei der Vorsorge. Wir geben Ihnen den Raum, den es braucht.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={() => scrollTo('kontakt')} className="bg-[#4a554e] text-white px-8 py-3.5 rounded-full text-lg font-medium hover:bg-[#38413b] transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"><Phone size={20} /> Im Trauerfall anrufen</button>
            <button onClick={() => setIsConfiguratorOpen(true)} className="bg-white text-[#4a554e] px-8 py-3.5 rounded-full text-lg font-medium hover:bg-gray-50 border border-gray-200 transition flex items-center justify-center gap-2 shadow-sm"><FileSearch size={20} /> Vorsorge digital planen</button>
          </div>
        </div>
      </section>
      <section id="philosophie" className="py-24 bg-white px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          <div className="bg-[#faf9f7] p-10 rounded-3xl border border-gray-100 hover:border-[#d5d0c5] transition"><Heart className="text-[#849289] w-12 h-12 mb-6" /><h4 className="text-2xl font-serif text-[#4a554e] mb-4">Wir sind einfühlsam.</h4><p className="text-gray-600 leading-relaxed">Wir nehmen uns Zeit. Gemeinsam gestalten wir individuelle Abschiede. Den Sarg bemalen, die Urne selbst tragen – all das kann helfen, den Verlust zu begreifen.</p></div>
          <div className="bg-[#faf9f7] p-10 rounded-3xl border border-gray-100 hover:border-[#d5d0c5] transition"><ShieldCheck className="text-[#849289] w-12 h-12 mb-6" /><h4 className="text-2xl font-serif text-[#4a554e] mb-4">Wir sind offen.</h4><p className="text-gray-600 leading-relaxed">Offen für alle Menschen (LGBTQIA+ friendly) und Formen des Abschieds. Wir zeigen auf, was möglich ist und machen unsere Kosten absolut transparent.</p></div>
          <div className="bg-[#faf9f7] p-10 rounded-3xl border border-gray-100 hover:border-[#d5d0c5] transition"><Users className="text-[#849289] w-12 h-12 mb-6" /><h4 className="text-2xl font-serif text-[#4a554e] mb-4">Wir sind menschlich.</h4><p className="text-gray-600 leading-relaxed">Nahbar und respektvoll. Wir waschen den verstorbenen Menschen, gerne in eigener Kleidung, wenn gewünscht auch gemeinsam mit Ihnen zu Hause.</p></div>
        </div>
      </section>
      <section id="leistungen" className="py-24 bg-[#ebe8e1] px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2">
            <h3 className="text-3xl sm:text-4xl font-serif text-[#4a554e] mb-6 leading-tight">Selbstbestimmt bis zum Schluss. <br/>Unsere Vorsorge.</h3>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">Nehmen Sie Ihren Liebsten die schwersten Entscheidungen ab. Mit einer Bestattungsvorsorge legen Sie zu Lebzeiten fest, wie Ihr Abschied gestaltet werden soll.</p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3"><CheckCircle className="text-[#4a554e] mt-1 shrink-0" size={20} /><span className="text-gray-700">Sicherheit und Entlastung für Angehörige.</span></li>
              <li className="flex items-start gap-3"><CheckCircle className="text-[#4a554e] mt-1 shrink-0" size={20} /><span className="text-gray-700">Garantiert Ihre persönlichen Wünsche.</span></li>
              <li className="flex items-start gap-3"><CheckCircle className="text-[#4a554e] mt-1 shrink-0" size={20} /><span className="text-gray-700">Volle finanzielle Absicherung möglich.</span></li>
            </ul>
          </div>
          <div className="md:w-1/2 w-full bg-white p-8 sm:p-12 rounded-3xl shadow-xl border border-gray-100 text-center">
            <Euro className="text-[#4a554e] w-16 h-16 mx-auto mb-6 opacity-80" />
            <h4 className="text-2xl font-serif text-[#4a554e] mb-4">Transparente Kostenplanung</h4>
            <p className="text-gray-600 mb-8">Nutzen Sie unseren digitalen Konfigurator, um in 3 einfachen Schritten Ihre Wünsche zusammenzustellen und eine sofortige Kostenschätzung zu erhalten.</p>
            <button onClick={() => setIsConfiguratorOpen(true)} className="bg-[#4a554e] text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-[#38413b] transition w-full shadow-md">Jetzt Wünsche konfigurieren</button>
          </div>
        </div>
      </section>
      <footer id="kontakt" className="bg-[#3e4842] text-white py-20 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16">
          <div>
            <h4 className="text-3xl font-serif mb-8 text-[#e1ded5]">Wir sind für Sie da.</h4>
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-gray-200 bg-[#4a554e]/30 p-4 rounded-2xl"><Phone size={24} className="text-[#a8b5ab]" /><span className="text-xl">0228 620 58 15</span></div>
              <div className="flex items-center gap-4 text-gray-200 p-4"><Mail size={24} className="text-[#a8b5ab]" /><a href="mailto:info@minten-walter.de" className="text-lg hover:text-white transition">info@minten-walter.de</a></div>
            </div>
          </div>
          <div className="bg-[#4a554e] rounded-3xl p-10 text-center shadow-2xl flex flex-col justify-center">
            <Info size={48} className="mx-auto mb-6 text-[#a8b5ab]" />
            <h5 className="text-2xl font-serif mb-4 text-[#e1ded5]">Im Trauerfall - Was tun?</h5>
            <p className="text-gray-300 mb-8 leading-relaxed">Sie haben Zeit. Sie dürfen den verstorbenen Menschen bis zu 36h zu Hause behalten. Rufen Sie den Arzt (Totenschein) und im Anschluss uns an.</p>
            <a href="tel:02286205815" className="inline-block bg-white text-[#3e4842] px-8 py-3.5 rounded-full font-medium hover:bg-gray-100 transition mx-auto shadow-md">Jetzt anrufen</a>
          </div>
        </div>
      </footer>
    </div>
  );

  const renderVorsorgeConfigurator = () => {
    if (!isConfiguratorOpen) return null;
    const OptionCard = ({ title, desc, price, selected, onClick }) => (
      <div onClick={onClick} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${selected ? 'border-[#4a554e] bg-[#f8f6f3]' : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'}`}>
        <div className="flex justify-between items-start mb-2"><h4 className={`font-medium ${selected ? 'text-[#4a554e]' : 'text-gray-800'}`}>{title}</h4>{selected ? <CheckCircle size={20} className="text-[#4a554e] shrink-0" /> : null}</div>
        <p className="text-xs text-gray-500 mb-4 h-10">{desc}</p>
        <span className="text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">+{price} €</span>
      </div>
    );
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex justify-center items-center p-4 sm:p-6 overflow-y-auto">
        <div className="bg-[#faf9f7] w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] relative animate-in fade-in zoom-in-95 duration-300">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-3xl sticky top-0 z-10"><div><h2 className="text-2xl font-serif text-[#4a554e]">Vorsorge Konfigurator</h2><p className="text-sm text-gray-500 mt-1">Schritt {configStep} von 4</p></div><button onClick={() => { setIsConfiguratorOpen(false); setConfigStep(1); }} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition"><X size={24} /></button></div>
          <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
            <div className="w-full md:w-2/3 p-6 sm:p-8">
              {configStep === 1 && (<div className="space-y-6 animate-in slide-in-from-right-4"><h3 className="text-xl font-medium text-gray-800 mb-6">Bestattungsart</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><OptionCard title="Feuerbestattung" desc="Kremation und Urnenbeisetzung." price={PRICING.burialType['Feuerbestattung']} selected={configData.burialType === 'Feuerbestattung'} onClick={() => setConfigData({...configData, burialType: 'Feuerbestattung'})} /><OptionCard title="Erdbestattung" desc="Klassische Sarg-Beisetzung." price={PRICING.burialType['Erdbestattung']} selected={configData.burialType === 'Erdbestattung'} onClick={() => setConfigData({...configData, burialType: 'Erdbestattung'})} /><OptionCard title="Baumbestattung" desc="Kremation und Beisetzung im Wald." price={PRICING.burialType['Baumbestattung / Friedwald']} selected={configData.burialType === 'Baumbestattung / Friedwald'} onClick={() => setConfigData({...configData, burialType: 'Baumbestattung / Friedwald'})} /><OptionCard title="Seebestattung" desc="Kremation und Seebestattung." price={PRICING.burialType['Seebestattung']} selected={configData.burialType === 'Seebestattung'} onClick={() => setConfigData({...configData, burialType: 'Seebestattung'})} /></div></div>)}
              {configStep === 2 && (<div className="space-y-6 animate-in slide-in-from-right-4"><h3 className="text-xl font-medium text-gray-800 mb-6">Wahl der Ausstattung</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><OptionCard title="Natur / Bio" desc="Unbehandeltes Holz, Bio-Matratze." price={PRICING.coffinUrn['Natur / Bio']} selected={configData.coffinUrn === 'Natur / Bio'} onClick={() => setConfigData({...configData, coffinUrn: 'Natur / Bio'})} /><OptionCard title="Standard" desc="Einfacher Sarg oder Standardurne." price={PRICING.coffinUrn['Standard']} selected={configData.coffinUrn === 'Standard'} onClick={() => setConfigData({...configData, coffinUrn: 'Standard'})} /><OptionCard title="Individuell" desc="Hochwertige Hölzer, Design-Urnen." price={PRICING.coffinUrn['Individuell']} selected={configData.coffinUrn === 'Individuell'} onClick={() => setConfigData({...configData, coffinUrn: 'Individuell'})} /></div></div>)}
              {configStep === 3 && (<div className="space-y-6 animate-in slide-in-from-right-4"><h3 className="text-xl font-medium text-gray-800 mb-6">Rahmen der Abschiednahme</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><OptionCard title="Im kleinen Kreis" desc="Stille Abschiednahme, Grunddekoration." price={PRICING.ceremony['Im kleinen Kreis']} selected={configData.ceremony === 'Im kleinen Kreis'} onClick={() => setConfigData({...configData, ceremony: 'Im kleinen Kreis'})} /><OptionCard title="Große Trauerfeier" desc="Feierhalle, Floristik, Redner(in)." price={PRICING.ceremony['Große Trauerfeier']} selected={configData.ceremony === 'Große Trauerfeier'} onClick={() => setConfigData({...configData, ceremony: 'Große Trauerfeier'})} /><OptionCard title="Keine Feier" desc="Stille Beisetzung ohne Angehörige." price={PRICING.ceremony['Keine Feier']} selected={configData.ceremony === 'Keine Feier'} onClick={() => setConfigData({...configData, ceremony: 'Keine Feier'})} /></div></div>)}
              {configStep === 4 && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                  <h3 className="text-xl font-medium text-gray-800 mb-2">Ihre Konfiguration</h3>
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-medium text-gray-500 mb-1">Vorname</label><input type="text" className="w-full p-3 border border-gray-300 rounded-xl outline-none" value={configData.contact.firstName} onChange={(e) => setConfigData({...configData, contact: {...configData.contact, firstName: e.target.value}})} required /></div>
                      <div><label className="block text-xs font-medium text-gray-500 mb-1">Nachname</label><input type="text" className="w-full p-3 border border-gray-300 rounded-xl outline-none" value={configData.contact.lastName} onChange={(e) => setConfigData({...configData, contact: {...configData.contact, lastName: e.target.value}})} required /></div>
                      <div className="md:col-span-2"><label className="block text-xs font-medium text-gray-500 mb-1">E-Mail Adresse</label><input type="email" className="w-full p-3 border border-gray-300 rounded-xl outline-none" value={configData.contact.email} onChange={(e) => setConfigData({...configData, contact: {...configData.contact, email: e.target.value}})} required /></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="w-full md:w-1/3 bg-gray-50 border-l border-gray-200 p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-serif text-xl text-[#4a554e] mb-6">Kostenschätzung</h3>
                <div className="space-y-4 text-sm text-gray-600 border-b border-gray-200 pb-6 mb-6">
                  <div className="flex justify-between"><span>Basis (Begleitung)</span><span className="font-medium">{PRICING.baseFee} €</span></div>
                  <div className="flex justify-between"><span className="truncate pr-2">{configData.burialType}</span><span className="font-medium">+{PRICING.burialType[configData.burialType] || 0} €</span></div>
                  <div className="flex justify-between"><span className="truncate pr-2">Ausstattung: {configData.coffinUrn}</span><span className="font-medium">+{PRICING.coffinUrn[configData.coffinUrn] || 0} €</span></div>
                  <div className="flex justify-between"><span className="truncate pr-2">{configData.ceremony}</span><span className="font-medium">+{PRICING.ceremony[configData.ceremony] || 0} €</span></div>
                </div>
                <div className="flex justify-between items-end"><span className="text-gray-800 font-medium">Summe (ca.)*</span><span className="text-2xl font-serif text-[#4a554e] font-bold">{estimatedPrice.toLocaleString('de-DE')} €</span></div>
              </div>
            </div>
          </div>
          <div className="p-6 border-t border-gray-200 bg-white rounded-b-3xl flex justify-between items-center sticky bottom-0 z-10">
            {configStep > 1 ? <button onClick={() => setConfigStep(configStep - 1)} className="flex items-center gap-2 text-gray-600 px-4 py-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={16}/> Zurück</button> : <div></div>}
            {configStep < 4 ? <button onClick={() => setConfigStep(configStep + 1)} className="bg-[#4a554e] text-white px-6 py-3 rounded-xl hover:bg-[#38413b] transition flex items-center gap-2 font-medium">Weiter <ChevronRight size={18}/></button> : <button onClick={submitVorsorgeAnfrage} disabled={!configData.contact.firstName || !configData.contact.email || isSubmittingVorsorge} className="bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition flex items-center gap-2 font-medium shadow-md"><Send size={18}/> {isSubmittingVorsorge ? 'Wird gesendet...' : 'Unverbindlich anfragen'}</button>}
          </div>
        </div>
      </div>
    );
  };

  const renderFamilyLoginView = () => (
    <div className="min-h-screen bg-[#ebe8e1] flex items-center justify-center px-4 relative z-50">
      <div className="absolute top-6 left-6 cursor-pointer" onClick={() => setView('home')}><h1 className="font-serif text-xl text-[#4a554e]">minten & walter</h1></div>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 sm:p-12 relative overflow-hidden border border-gray-100">
        <div className="absolute top-0 left-0 w-full h-2 bg-[#849289]"></div>
        <button onClick={() => setView('home')} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={24} /></button>
        <div className="text-center mb-10"><div className="w-16 h-16 bg-[#f8f6f3] rounded-full mx-auto flex items-center justify-center mb-4"><Key className="text-[#849289]" size={32} /></div><h2 className="text-2xl font-serif text-[#4a554e]">Angehörigen Login</h2></div>
        <form onSubmit={handleFamilyLoginSubmit} className="space-y-6">
          {loginError ? <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">{loginError}</div> : null}
          <div><input type="text" value={familyPinInput} onChange={(e) => setFamilyPinInput(e.target.value)} className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#849289] outline-none text-center text-2xl tracking-widest uppercase font-mono" placeholder="Z.B. A1B2C3" required maxLength={6} /></div>
          <button type="submit" className="w-full bg-[#849289] text-white py-4 rounded-xl font-medium hover:bg-[#6c7870] flex justify-center items-center gap-2 shadow-md">Zum Family-Portal <ChevronRight size={18} /></button>
        </form>
      </div>
    </div>
  );

  const renderFamilyPortalView = () => {
    if (!familyActiveCase) return null;
    const statusIndex = KANBAN_COLUMNS.findIndex(c => c.id === familyActiveCase.status);
    const progressPercent = Math.max(10, (statusIndex / (KANBAN_COLUMNS.length - 1)) * 100);
    return (
      <div className="min-h-screen bg-[#faf9f7] font-sans text-gray-800">
        <nav className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div><h1 className="font-serif text-xl text-[#4a554e]">minten & walter</h1><p className="text-[10px] tracking-widest text-[#7a857e] uppercase">Angehörigen portal</p></div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 text-sm font-medium flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg transition"><LogOut size={16}/> Abmelden</button>
        </nav>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <header className="mb-12 text-center"><h2 className="text-3xl sm:text-4xl font-serif text-[#4a554e] mb-4">Übersicht & Planung</h2><p className="text-gray-600 max-w-2xl mx-auto">Für <strong>{(familyActiveCase.name || '').replace('VORSORGE: ', '')}</strong>.</p></header>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-medium text-[#4a554e] mb-6 flex items-center gap-2"><Clock size={20}/> Aktueller Status</h3>
                <div className="relative">
                  <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gray-100"></div>
                  <div className="absolute left-3.5 top-2 w-0.5 bg-[#849289] transition-all duration-1000" style={{ height: `${progressPercent}%` }}></div>
                  <div className="space-y-6 relative z-10">
                    {KANBAN_COLUMNS.map((col, index) => {
                      const isPast = index < statusIndex; const isCurrent = index === statusIndex;
                      return (
                        <div key={col.id} className={`flex items-center gap-4 ${isPast ? 'opacity-50' : isCurrent ? 'opacity-100' : 'opacity-30'}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${isCurrent ? 'bg-white border-[#849289] text-[#849289]' : isPast ? 'bg-[#849289] border-[#849289] text-white' : 'bg-white border-gray-300 text-gray-300'}`}>{isPast ? <CheckCircle size={14}/> : (index + 1)}</div>
                          <div><span className={`block text-sm ${isCurrent ? 'font-bold text-[#4a554e]' : 'font-medium text-gray-500'}`}>{col.title}</span></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col">
                <div className="flex items-start justify-between mb-6"><div><h3 className="text-xl font-serif text-[#4a554e] flex items-center gap-2 mb-2"><Heart size={24} className="text-[#849289]"/> Erinnerungen & Anekdoten</h3></div></div>
                <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
                  {(familyActiveCase.memories || []).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 border-2 border-dashed border-gray-200 rounded-2xl"><FileText size={48} className="mb-4 opacity-50"/><p className="text-center text-sm">Noch keine Einträge vorhanden.</p></div>
                  ) : (
                    (familyActiveCase.memories || []).map(mem => (
                      <div key={mem.id} className="bg-[#faf9f7] p-4 rounded-2xl border border-gray-100"><div className="flex justify-between items-center mb-2"><span className="font-bold text-xs text-[#849289]">Familien-Eintrag</span><span className="text-xs text-gray-400">{new Date(mem.createdAt).toLocaleDateString('de-DE')}</span></div><p className="text-gray-700 text-sm whitespace-pre-wrap">{mem.text}</p></div>
                    ))
                  )}
                </div>
                <div className="border-t border-gray-100 pt-6">
                  <form onSubmit={submitMemory}>
                    <textarea rows="3" placeholder="Z.B. Papa hat den Garten geliebt..." className="w-full p-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[#849289] outline-none mb-4 text-sm resize-none" value={newMemoryText} onChange={(e) => setNewMemoryText(e.target.value)} required />
                    <button type="submit" className="bg-[#4a554e] text-white px-6 py-3 rounded-xl hover:bg-[#38413b] transition font-medium flex items-center gap-2 shadow-sm"><Send size={16}/> Sicher abspeichern</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLoginView = () => (
    <div className="min-h-screen bg-[#ebe8e1] flex items-center justify-center px-4 relative z-50">
      <div className="absolute top-6 left-6 cursor-pointer" onClick={() => setView('home')}><h1 className="font-serif text-xl text-[#4a554e]">minten & walter</h1></div>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 sm:p-12 relative overflow-hidden border border-gray-100">
        <div className="absolute top-0 left-0 w-full h-2 bg-[#4a554e]"></div>
        <button onClick={() => setView('home')} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={24} /></button>
        <div className="text-center mb-10"><Lock className="mx-auto text-[#4a554e] mb-4" size={40} /><h2 className="text-2xl font-serif text-[#4a554e]">Mitarbeiter Login</h2></div>
        <form onSubmit={handleAdminLogin} className="space-y-6">
          {loginError ? <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">{loginError}</div> : null}
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Benutzername</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none" placeholder="walter" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Passwort</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none" placeholder="2026!" required /></div>
          <button type="submit" className="w-full bg-[#4a554e] text-white py-3 rounded-xl font-medium hover:bg-[#38413b] flex justify-center items-center gap-2">Einloggen <ChevronRight size={18} /></button>
        </form>
      </div>
    </div>
  );

  const renderAdminView = () => {
    // --- Sortier- und Filter-Logik für Aufgaben ---
    const filteredTasks = tasks.filter(t => taskFilter === 'Alle' || t.assignee === taskFilter);
    // Sortierung: Unfertige nach oben. Innerhalb unfertig: Fällige zuerst.
    filteredTasks.sort((a, b) => {
      if (a.completed === b.completed) {
         if (!a.dueDate) return 1;
         if (!b.dueDate) return -1;
         return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return a.completed ? 1 : -1;
    });

    // --- Gruppierungs-Logik für den Kalender (Timeline) ---
    const groupedAppointments = appointments.reduce((acc, curr) => {
      const dateObj = new Date(curr.date);
      dateObj.setHours(0,0,0,0);
      const dateKey = dateObj.toISOString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(curr);
      return acc;
    }, {});
    
    // Sortierte Tage
    const sortedDays = Object.keys(groupedAppointments).sort((a,b) => new Date(a) - new Date(b));

    const isOverdue = (dateString) => {
      if (!dateString) return false;
      const today = new Date();
      today.setHours(0,0,0,0);
      return new Date(dateString) < today;
    };

    return (
      <div className="h-screen bg-[#f3f4f6] flex flex-col md:flex-row overflow-hidden relative z-10">
        <div className="w-full md:w-64 bg-[#3e4842] text-white flex flex-col shrink-0 z-20 shadow-xl"><div className="p-6 border-b border-gray-700 flex justify-between bg-[#353e39]"><div><h2 className="font-serif text-xl">minten & walter</h2><p className="text-xs text-gray-400">Team Workspace</p></div></div><div className="flex-1 py-6 px-4 space-y-2 flex flex-col"><button onClick={() => setAdminTab('cases')} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${adminTab === 'cases' ? 'bg-[#4a554e] shadow-md' : 'hover:bg-[#4a554e]/50'}`}><Briefcase size={18} /> Sterbefälle</button><button onClick={() => setAdminTab('tasks')} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${adminTab === 'tasks' ? 'bg-[#4a554e] shadow-md' : 'hover:bg-[#4a554e]/50'}`}><CheckCircle size={18} /> Aufgaben & Termine</button><button onClick={() => setAdminTab('board')} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${adminTab === 'board' ? 'bg-[#4a554e] shadow-md' : 'hover:bg-[#4a554e]/50'}`}><MessageSquare size={18} /> Übergabebuch</button><button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white mt-auto"><LogOut size={18}/> Abmelden</button></div></div>
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="bg-white border-b border-gray-200 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center shrink-0 gap-4">
            <h2 className="text-xl sm:text-2xl font-serif text-gray-800">
              {adminTab === 'cases' ? 'Kanban-Board' : adminTab === 'tasks' ? 'Team Dashboard' : 'Allgemeines Übergabebuch'}
            </h2>
            {adminTab === 'cases' && (<button onClick={openCreateModal} className="bg-[#4a554e] text-white px-6 py-2.5 rounded-xl hover:bg-[#38413b] text-sm font-medium flex gap-2"><Plus size={18}/> Neuer Fall</button>)}
            {adminTab === 'tasks' && (
              <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                <Filter size={16} className="text-gray-400 ml-2" />
                <select value={taskFilter} onChange={(e) => setTaskFilter(e.target.value)} className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none pr-2 cursor-pointer">
                  <option value="Alle">Alle Aufgaben</option>
                  <option value="Ralph">Meine Aufgaben (Ralph)</option>
                  <option value="Katrin">Meine Aufgaben (Katrin)</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#f3f4f6] relative">
            
            {adminTab === 'cases' ? (
              <div className="flex gap-6 h-full items-start overflow-x-auto pb-4">
                {KANBAN_COLUMNS.map(column => (
                  <div key={column.id} className="flex flex-col bg-gray-200/50 rounded-2xl min-w-[320px] max-w-[320px] max-h-full" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, column.id)}>
                    <div className={`p-3 m-2 rounded-xl border ${column.color} font-medium flex justify-between`}><span>{column.title}</span><span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold">{cases.filter(c => c.status === column.id).length}</span></div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-3">
                      {cases.filter(c => c.status === column.id).map(c => {
                        const isVorsorge = (c.name || '').startsWith('VORSORGE:');
                        return (
                          <div key={c.id} draggable="true" onDragStart={(e) => handleDragStart(e, c.id)} onDragEnd={handleDragEnd} onClick={() => setActiveCaseId(c.id)} className={`bg-white p-4 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition relative group ${isVorsorge ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 hover:border-[#4a554e]/50'}`}>
                            <div className="absolute top-2 right-2 sm:opacity-0 group-hover:opacity-100 transition"><button onClick={(e) => { e.stopPropagation(); deleteDocItem('cases', c.id); }} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button></div>
                            <div className="flex items-start gap-2 mb-2"><GripVertical size={16} className="text-gray-300 mt-0.5 cursor-grab" /><h4 className={`font-medium pr-6 ${isVorsorge ? 'text-blue-800' : 'text-gray-800'}`}>{c.name}</h4></div>
                            <div className="ml-6 mb-3"><span className={`${isVorsorge ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'} text-[10px] px-2 py-0.5 rounded border`}>{c.wishes?.burialType || 'Unklar'}</span></div>
                            <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-3"><span className="flex items-center gap-1"><Clock size={12}/> {new Date(c.createdAt).toLocaleDateString()}</span></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* NEUES TEAM DASHBOARD (Option 1 umgesetzt) */}
            {adminTab === 'tasks' ? (
              <div className="grid lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
                
                {/* Spalte 1: Kalender / Agenda (4/12 Breite) */}
                <div className="lg:col-span-4 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[80vh]">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xl font-serif text-[#4a554e] flex items-center gap-2 mb-4"><CalendarDays size={20} /> Agenda</h3>
                    <form onSubmit={handleAddAppointment} className="flex flex-col gap-2">
                      <input type="text" placeholder="Neuer Termin..." className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4a554e] text-sm" value={newApptTitle} onChange={(e) => setNewApptTitle(e.target.value)} required />
                      <div className="flex gap-2">
                        <input type="datetime-local" className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700" value={newApptDate} onChange={(e) => setNewApptDate(e.target.value)} required />
                        <button type="submit" className="bg-[#4a554e] text-white p-2.5 rounded-xl hover:bg-[#38413b]"><Plus size={18} /></button>
                      </div>
                    </form>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {sortedDays.length === 0 ? (
                      <div className="text-center text-gray-400 mt-10"><CalendarDays size={32} className="mx-auto mb-2 opacity-50"/>Keine anstehenden Termine</div>
                    ) : (
                      sortedDays.map(dayStr => {
                        const dateLabel = new Date(dayStr).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' });
                        const isToday = new Date(dayStr).setHours(0,0,0,0) === new Date().setHours(0,0,0,0);
                        return (
                          <div key={dayStr}>
                            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isToday ? 'text-[#4a554e]' : 'text-gray-400'}`}>
                              {isToday ? 'Heute' : dateLabel}
                            </h4>
                            <div className="space-y-3">
                              {groupedAppointments[dayStr].map(appt => (
                                <div key={appt.id} className={`p-3 rounded-xl border flex justify-between items-start group ${isToday ? 'bg-[#f8f6f3] border-[#e1ded5]' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                                  <div>
                                    <div className="text-xs font-bold text-[#849289] mb-1">{new Date(appt.date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</div>
                                    <h5 className="font-medium text-gray-800 text-sm leading-tight">{appt.title}</h5>
                                  </div>
                                  <button onClick={() => deleteDocItem('appointments', appt.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1"><Trash2 size={14} /></button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Spalte 2: Aufgaben Liste (8/12 Breite) */}
                <div className="lg:col-span-8 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[80vh]">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xl font-serif text-[#4a554e] flex items-center gap-2 mb-4"><CheckCircle size={20} /> To-Do Liste</h3>
                    <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                      <input type="text" placeholder="Aufgabe eingeben (z.B. Zeitungsanzeige aufgeben)" className="flex-1 p-3 border-none bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-[#4a554e] outline-none text-sm" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} required />
                      <div className="flex gap-2">
                        <select value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} className="w-32 p-3 border-none bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-[#4a554e] outline-none text-sm text-gray-700">
                          <option value="Alle">Zuweisen an...</option><option value="Ralph">Ralph</option><option value="Katrin">Katrin</option>
                        </select>
                        {/* NEU: Fälligkeitsdatum Input */}
                        <input type="date" className="w-36 p-3 border-none bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-[#4a554e] outline-none text-sm text-gray-700" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} title="Fällig bis..." />
                        <button type="submit" className="bg-[#4a554e] text-white px-4 py-3 rounded-xl hover:bg-[#38413b] shadow-sm"><Plus size={20} /></button>
                      </div>
                    </form>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-2">
                    {filteredTasks.length === 0 ? (
                      <div className="text-center text-gray-400 mt-10">Keine offenen Aufgaben für {taskFilter === 'Alle' ? 'das Team' : taskFilter}.</div>
                    ) : (
                      filteredTasks.map(task => {
                        const overdue = !task.completed && isOverdue(task.dueDate);
                        return (
                          <div key={task.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${task.completed ? 'bg-gray-50 border-gray-100 opacity-60' : overdue ? 'bg-red-50/30 border-red-100 hover:shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}>
                            <div className="flex items-center gap-4 flex-1">
                              <div onClick={() => toggleTaskCompletion(task.id, task.completed)} className={`cursor-pointer w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500' : overdue ? 'border-red-300 hover:border-red-500' : 'border-gray-300 hover:border-[#4a554e]'}`}>
                                {task.completed && <CheckCircle size={14} className="text-white" />}
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>{task.title}</span>
                                <div className="flex items-center gap-3 mt-1">
                                  {task.assignee !== 'Alle' && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold">{task.assignee}</span>}
                                  {task.dueDate && (
                                    <span className={`text-[10px] font-medium flex items-center gap-1 ${task.completed ? 'text-gray-400' : overdue ? 'text-red-600' : 'text-orange-500'}`}>
                                      {overdue ? <AlertCircle size={10}/> : <Clock size={10}/>}
                                      {overdue ? 'Überfällig: ' : 'Bis: '} {new Date(task.dueDate).toLocaleDateString('de-DE')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button onClick={() => deleteDocItem('tasks', task.id)} className="p-2 text-gray-300 hover:text-red-500 transition"><Trash2 size={16}/></button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

              </div>
            ) : null}

            {adminTab === 'board' ? (
              <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-[70vh]">
                <div className="flex-1 overflow-y-auto space-y-4 mb-6">{messages.map(msg => (<div key={msg.id} className="bg-gray-50 p-4 rounded-xl border relative group"><button onClick={() => deleteDocItem('messages', msg.id)} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button><div className="font-bold text-xs text-[#4a554e] mb-1">{msg.author} <span className="text-[10px] text-gray-400 font-normal">• {new Date(msg.createdAt).toLocaleString('de-DE')}</span></div><p className="text-sm">{msg.text}</p></div>))}</div>
                <form onSubmit={handleAddMessage} className="flex gap-3"><input type="text" placeholder="Neue Notiz..." className="flex-1 p-3 border rounded-xl" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} required /><button type="submit" className="bg-[#4a554e] text-white px-6 py-3 rounded-xl">Senden</button></form>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const renderCreateCaseModal = () => {
    if (!isCreateModalOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 sm:p-6 overflow-y-auto">
        <div className="bg-[#faf9f7] w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] relative animate-in fade-in zoom-in-95">
          <div className="p-6 sm:p-8 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-3xl sticky top-0 z-10"><div><h2 className="text-2xl font-serif text-[#4a554e]">Neuen Sterbefall aufnehmen</h2><p className="text-sm text-gray-500 mt-1">Schritt {createStep} von 2</p></div><button onClick={() => setIsCreateModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X size={24} /></button></div>
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            {createStep === 1 && (
              <div className="space-y-10">
                <section><h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">1. Wünsche & Bestattungsart</h3><div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-[#4a554e] mb-2 uppercase flex items-center gap-1"><Zap size={14} className="text-yellow-500"/> Art der Bestattung</label><select className="w-full p-3 border-2 border-[#4a554e]/20 rounded-xl font-medium" value={newCaseData.wishes.burialType} onChange={(e) => handleCaseDataChange('wishes', 'burialType', e.target.value)}><option value="Erdbestattung">Erdbestattung</option><option value="Feuerbestattung">Feuerbestattung</option><option value="Seebestattung">Seebestattung</option><option value="Baumbestattung / Friedwald">Baumbestattung / Friedwald</option><option value="Noch unklar">Noch unklar</option></select></div><div><label className="block text-xs font-medium text-gray-500 mb-1">Besondere Wünsche</label><textarea rows="3" className="w-full p-3 border border-gray-300 rounded-xl" value={newCaseData.wishes.specialWishes} onChange={(e) => handleCaseDataChange('wishes', 'specialWishes', e.target.value)} /></div></div></section>
                <section><h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">2. Verstorbene Person</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-xs font-medium text-gray-500 mb-1">Vorname</label><input type="text" className="w-full p-3 border border-gray-300 rounded-xl" value={newCaseData.deceased.firstName} onChange={(e) => handleCaseDataChange('deceased', 'firstName', e.target.value)} /></div><div><label className="block text-xs font-medium text-gray-500 mb-1">Nachname</label><input type="text" className="w-full p-3 border border-gray-300 rounded-xl" value={newCaseData.deceased.lastName} onChange={(e) => handleCaseDataChange('deceased', 'lastName', e.target.value)} /></div><div><label className="block text-xs font-medium text-gray-500 mb-1">Sterbedatum</label><input type="date" className="w-full p-3 border border-gray-300 rounded-xl" value={newCaseData.deceased.deathDate} onChange={(e) => handleCaseDataChange('deceased', 'deathDate', e.target.value)} /></div></div></section>
                <section><h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">3. Hauptansprechpartner</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-xs font-medium text-gray-500 mb-1">Vorname</label><input type="text" className="w-full p-3 border border-gray-300 rounded-xl" value={newCaseData.contact.firstName} onChange={(e) => handleCaseDataChange('contact', 'firstName', e.target.value)} /></div><div><label className="block text-xs font-medium text-gray-500 mb-1">Nachname</label><input type="text" className="w-full p-3 border border-gray-300 rounded-xl" value={newCaseData.contact.lastName} onChange={(e) => handleCaseDataChange('contact', 'lastName', e.target.value)} /></div><div><label className="block text-xs font-medium text-gray-500 mb-1">Telefon</label><input type="text" className="w-full p-3 border border-gray-300 rounded-xl" value={newCaseData.contact.phone} onChange={(e) => handleCaseDataChange('contact', 'phone', e.target.value)} /></div></div></section>
              </div>
            )}
            {createStep === 2 && (
              <div className="space-y-8">
                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex gap-3 border border-blue-100"><Info size={20} className="mt-0.5 shrink-0" /><div><h4 className="font-medium text-sm">Checklisten automatisch generiert</h4><p className="text-xs mt-1">Basierend auf: <strong>{newCaseData.wishes.burialType}</strong></p></div></div>
                <div><div className="flex justify-between items-center mb-4"><h3 className="text-lg font-medium text-gray-800">Checklisten</h3><button onClick={handleAddChecklist} className="text-sm text-[#4a554e] font-medium flex items-center gap-1"><Plus size={16}/> Neue Liste</button></div><div className="space-y-6">{newCaseData.checklists.map((list, listIndex) => (<div key={listIndex} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm"><div className="flex justify-between items-center mb-4 gap-4"><input type="text" className="font-bold text-gray-800 p-1 border-b border-transparent focus:border-[#4a554e] outline-none w-full" value={list.title} onChange={(e) => handleUpdateChecklistTitle(listIndex, e.target.value)} /><button onClick={() => handleRemoveChecklist(listIndex)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={16}/></button></div><div className="space-y-2">{list.items.map((item, itemIndex) => (<div key={itemIndex} className="flex items-center gap-2 group"><div className="w-4 h-4 rounded border border-gray-300 shrink-0 mt-0.5"></div><input type="text" className="flex-1 text-sm p-1.5 bg-gray-50 border rounded outline-none" value={item.text} onChange={(e) => handleUpdateChecklistItem(listIndex, itemIndex, e.target.value)} /><button onClick={() => handleRemoveChecklistItem(listIndex, itemIndex)} className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100"><X size={14}/></button></div>))}<button onClick={() => handleAddChecklistItem(listIndex)} className="text-xs text-gray-500 mt-3 flex items-center gap-1 hover:text-[#4a554e]"><Plus size={12}/> Aufgabe</button></div></div>))}</div></div>
              </div>
            )}
          </div>
          <div className="p-6 border-t border-gray-200 bg-white rounded-b-3xl flex justify-between sticky bottom-0 z-10">
            {createStep === 1 ? <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-500 px-4 py-2 hover:bg-gray-100 rounded-lg">Abbrechen</button> : <button onClick={() => setCreateStep(1)} className="flex items-center gap-2 text-gray-600 px-4 py-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={16}/> Zurück</button>}
            {createStep === 1 ? <button onClick={() => setCreateStep(2)} className="bg-[#4a554e] text-white px-6 py-3 rounded-xl hover:bg-[#38413b] flex items-center gap-2 font-medium">Weiter <ChevronRight size={18}/></button> : <button onClick={submitNewCase} className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 flex items-center gap-2 font-medium shadow-lg"><CheckCircle size={18}/> Fall anlegen</button>}
          </div>
        </div>
      </div>
    );
  };

  const renderCaseModal = () => {
    const currentCase = getActiveCase();
    if (!currentCase) return null;

    let extractedPrice = "Auf Anfrage";
    if (currentCase.wishes?.specialWishes) {
      const match = currentCase.wishes.specialWishes.match(/Kostenschätzung:\s*([0-9.,]+)\s*€/);
      if (match) extractedPrice = match[1] + " €";
    }

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
        <div className="bg-[#faf9f7] w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden relative animate-in fade-in zoom-in-95">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
            <div className="flex items-center gap-4">
              <div className="bg-[#4a554e] p-3 rounded-xl text-white"><FileText size={28} /></div>
              <div>
                <h2 className="text-2xl font-serif text-gray-800">{currentCase.name}</h2>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md font-medium border border-gray-200">{currentCase.status}</span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-bold flex items-center gap-1 border border-blue-200" title="Code für das Angehörigen-Portal"><Key size={12}/> PIN: {currentCase.familyPin || 'Keiner'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={triggerNativePrint} className="bg-white border border-[#4a554e] text-[#4a554e] px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#f8f6f3] transition flex items-center gap-2 shadow-sm"><Printer size={16} /> Drucken / Angebot als PDF</button>
              <button onClick={() => setActiveCaseId(null)} className="p-2.5 text-gray-400 hover:text-gray-800 bg-gray-100 rounded-full transition"><X size={20} /></button>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r border-gray-200">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-8"><h3 className="font-medium text-[#4a554e] mb-4 border-b pb-2 flex justify-between items-center">Informationen <span className="bg-[#faf9f7] text-gray-500 text-xs px-2 py-1 rounded border">{currentCase.wishes?.burialType || '-'}</span></h3><div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm"><div><span className="block text-gray-400 text-xs">Verstorben:</span><span className="font-medium">{(currentCase.deceased?.firstName || currentCase.deceased?.lastName) ? `${currentCase.deceased.firstName} ${currentCase.deceased.lastName}` : 'Keine Angabe'}</span></div><div><span className="block text-gray-400 text-xs">Ansprechpartner:</span><span className="font-medium">{(currentCase.contact?.firstName || currentCase.contact?.lastName) ? `${currentCase.contact.firstName} ${currentCase.contact.lastName}` : 'Keine Angabe'}</span></div></div>{currentCase.wishes?.specialWishes ? (<div className="mt-4 pt-4 border-t border-gray-50"><span className="block text-gray-400 text-xs mb-1">Besondere Wünsche:</span><p className="text-gray-700 text-sm italic">"{currentCase.wishes.specialWishes}"</p></div>) : null}</div>
              <h3 className="text-lg font-medium text-[#4a554e] mb-6 flex items-center gap-2"><CheckCircle size={20} /> Aufgaben</h3>
              {(currentCase.checklists || []).map((list, listIndex) => {
                const completedCount = list.items.filter(i => i.completed).length;
                const progress = list.items.length === 0 ? 0 : (completedCount / list.items.length) * 100;
                return (
                  <div key={listIndex} className="mb-8"><div className="flex justify-between items-end mb-2"><h4 className="font-medium text-gray-700">{list.title}</h4><span className="text-xs text-gray-500 font-medium">{Math.round(progress)}%</span></div><div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden"><div className="bg-[#4a554e] h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div></div><div className="space-y-2">{list.items.map((item, itemIndex) => (<div key={itemIndex} className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition ${item.completed ? 'bg-gray-100' : 'hover:bg-white border border-transparent hover:border-gray-200 shadow-sm'}`} onClick={() => toggleChecklistItem(listIndex, itemIndex, item.completed)}><div className={`mt-0.5 w-5 h-5 shrink-0 rounded border flex items-center justify-center transition-colors ${item.completed ? 'bg-green-500 border-green-500' : 'border-gray-400 bg-white'}`}>{item.completed ? <CheckCircle size={14} className="text-white" /> : null}</div><span className={`text-sm ${item.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item.text}</span></div>))}</div></div>
                );
              })}
            </div>
            <div className="w-full lg:w-1/2 flex flex-col h-full bg-[#f3f4f6]">
              <div className="flex-1 flex flex-col h-1/2 border-b border-gray-200">
                <div className="p-4 bg-white border-b border-gray-200"><h3 className="font-medium text-gray-800 flex items-center gap-2"><MessageSquare size={18} className="text-[#4a554e]"/> Interne Team-Notizen</h3></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">{(currentCase.notes || []).map(note => (<div key={note.id} className={`p-3 rounded-xl border border-gray-100 ${note.author === 'System' ? 'bg-blue-50/50' : 'bg-white shadow-sm'}`}><div className="flex justify-between mb-1"><span className="font-bold text-xs text-[#4a554e]">{note.author}</span><span className="text-[10px] text-gray-400">{new Date(note.createdAt).toLocaleDateString()}</span></div><p className="text-sm text-gray-700">{note.text}</p></div>))}</div>
                <div className="p-4 bg-white border-t border-gray-200"><form onSubmit={addCaseNote} className="flex gap-2"><input type="text" placeholder="Interne Notiz..." className="flex-1 p-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:border-[#4a554e]" value={newCaseNote} onChange={(e) => setNewCaseNote(e.target.value)} required /><button type="submit" className="bg-[#4a554e] text-white px-4 py-2 rounded-xl"><Send size={16} /></button></form></div>
              </div>
              <div className="flex-1 flex flex-col h-1/2 bg-[#faf9f7]">
                <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center"><h3 className="font-medium text-gray-800 flex items-center gap-2"><Heart size={18} className="text-red-400"/> Erinnerungen der Angehörigen</h3><span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Vom Family Portal</span></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {(currentCase.memories || []).length === 0 ? <p className="text-sm text-center text-gray-400 mt-8 italic">Die Familie hat noch keine Erinnerungen hochgeladen.</p> : (currentCase.memories || []).map(mem => (<div key={mem.id} className="p-4 rounded-xl bg-white shadow-sm border border-gray-100 relative"><p className="text-sm text-gray-700 font-serif italic mb-2">"{mem.text}"</p><span className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(mem.createdAt).toLocaleDateString()}</span></div>))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNativePrintView = () => {
    const currentCase = getActiveCase();
    if (!currentCase) return null;
    let extractedPrice = "Auf Anfrage";
    if (currentCase.wishes?.specialWishes) {
      const match = currentCase.wishes.specialWishes.match(/Kostenschätzung:\s*([0-9.,]+)\s*€/);
      if (match) extractedPrice = match[1] + " €";
    }
    return (
      <div className="hidden print:block absolute inset-0 bg-white z-[9999] text-black p-12">
        <div className="border-b-2 border-[#e1ded5] pb-6 mb-10 flex justify-between items-end">
          <div><h1 className="m-0 text-4xl font-serif text-[#4a554e]">minten & walter</h1><p className="m-0 text-sm tracking-widest uppercase text-[#7a857e]">bestattungen</p></div>
          <div className="text-right text-sm text-gray-600">Annaberger Straße 133<br/>53175 Bonn<br/>0228 620 58 15<br/>info@minten-walter.de</div>
        </div>
        <h2 className="font-serif text-3xl text-[#4a554e] mb-2">Unverbindliches Angebot</h2><p className="text-gray-500 mb-8">Datum: {new Date().toLocaleDateString('de-DE')}</p>
        <div className="bg-[#faf9f7] p-6 rounded-lg mb-10 border border-gray-200">
          <p className="mb-2 text-lg"><strong>Für:</strong> {(currentCase.name || '').replace('VORSORGE: ', '')}</p>
          <p className="mb-2 text-lg"><strong>Bestattungsart:</strong> {currentCase.wishes?.burialType || 'Wird noch besprochen'}</p>
          {currentCase.wishes?.specialWishes ? <p className="mb-2 text-lg"><strong>Details & Wünsche:</strong> {currentCase.wishes.specialWishes}</p> : null}
        </div>
        <h3 className="font-serif text-2xl text-[#4a554e] border-b border-gray-300 pb-2 mb-4">Kostenübersicht</h3>
        <div className="flex justify-between py-3 border-b border-gray-200 font-bold text-lg"><span>Leistung</span><span>Geschätzter Preis</span></div>
        <div className="flex justify-between py-3 border-b border-gray-200 text-lg"><span>Grundleistungen (Beratung, Überführung, Versorgung)</span><span>ab 1.450,00 €</span></div>
        <div className="flex justify-between py-3 border-b border-gray-200 text-lg"><span>Bestattungsleistungen & Ausstattung (Sarg/Urne, Feier)</span><span>Individuell gem. Wünschen</span></div>
        <div className="flex justify-between py-5 border-t-2 border-[#4a554e] mt-6 font-bold text-2xl text-[#4a554e]"><span>Voraussichtliche Gesamtsumme</span><span>~ {extractedPrice}</span></div>
        <p className="mt-16 text-sm text-gray-500 bg-gray-50 p-4 border-l-4 border-[#4a554e]"><strong>Bitte beachten Sie:</strong> Dies ist eine erste, unverbindliche Kostenschätzung basierend auf den bisherigen Angaben. Fremdkosten (wie z.B. Friedhofsgebühren, kommunale Ämter, externe Floristen) werden nach tatsächlichem Aufwand abgerechnet. Gerne besprechen wir alle Details in einem persönlichen Gespräch mit Ihnen.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative font-sans text-gray-800 selection:bg-[#4a554e] selection:text-white">
      <div className="print:hidden">
        {view === 'home' ? renderNavbar() : null}
        {view === 'home' ? renderHomeView() : null}
        {view === 'login' ? renderLoginView() : null}
        {view === 'familyLogin' ? renderFamilyLoginView() : null}
        {view === 'admin' ? renderAdminView() : null}
        {view === 'familyPortal' ? renderFamilyPortalView() : null}
        {renderVorsorgeConfigurator()}
        {view === 'admin' && activeCaseId ? renderCaseModal() : null}
        {renderCreateCaseModal()}
      </div>
      {view === 'admin' && activeCaseId ? renderNativePrintView() : null}
    </div>
  );
}