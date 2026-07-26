import { useEffect, useMemo, useState } from 'react';
import { Camera, ClipboardCheck, LayoutDashboard, LogOut, Luggage, Search, ShieldAlert, UserRound } from 'lucide-react';
import ScannerPanel from './components/ScannerPanel';
import { analyzeServiceBag } from './services/analyzeServiceBag';
import type { OcrResult } from './types/scan';
import type { ServiceBagAnalysis } from './types/servicebag';

type View = 'dashboard' | 'scanner' | 'history' | 'analysis';
type ScanRecord = { id:number; prestationNumber:string|null; confidence:number; status:string; agentName:string; createdAt:string };
type AgentSession = { name:string; matricule:string };

const SESSION_KEY = 'nassist-agent-session';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [agent, setAgent] = useState<AgentSession | null>(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as AgentSession | null; } catch { return null; }
  });
  const [loginName, setLoginName] = useState('');
  const [loginMatricule, setLoginMatricule] = useState('');
  const [lastResult, setLastResult] = useState<OcrResult | null>(null);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [serviceBagText, setServiceBagText] = useState('');
  const [serviceBagUrl, setServiceBagUrl] = useState('');
  const [browserMessage, setBrowserMessage] = useState('');
  const [analysis, setAnalysis] = useState<ServiceBagAnalysis | null>(null);

  async function refreshHistory() {
    try {
      if (!window.nassist) return;
      setHistory(await window.nassist.scans.list(500));
      setHistoryError('');
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : 'Historique indisponible.');
    }
  }

  useEffect(() => { if (agent && (view === 'history' || view === 'dashboard')) void refreshHistory(); }, [view, agent]);

  function login() {
    const name = loginName.trim();
    const matricule = loginMatricule.trim().toUpperCase();
    if (!name || !matricule) return;
    const session = { name, matricule };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setAgent(session);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setAgent(null);
    setLoginName('');
    setLoginMatricule('');
  }

  const agentLabel = agent ? `${agent.name} (${agent.matricule})` : 'Agent non renseigné';

  async function handleResult(result: OcrResult) {
    setLastResult(result);
    if (!window.nassist) return;
    await window.nassist.scans.save({ prestationNumber: result.prestationNumber, confidence: result.confidence, rawText: result.rawText, status: result.prestationNumber ? 'READ' : 'OCR_ERROR', agentName: agentLabel });
  }

  async function openServiceBag() {
    try {
      if (!window.nassist) throw new Error('Passerelle Electron indisponible.');
      await window.nassist.serviceBag.open(serviceBagUrl);
      setBrowserMessage('Fenêtre ouverte en lecture contrôlée. Connectez-vous manuellement puis revenez ici.');
    } catch (error) { setBrowserMessage(error instanceof Error ? error.message : 'Impossible d’ouvrir la page.'); }
  }

  async function importVisibleText() {
    try {
      if (!window.nassist) throw new Error('Passerelle Electron indisponible.');
      const snapshot = await window.nassist.serviceBag.extractVisibleText();
      setServiceBagText(snapshot.text);
      setBrowserMessage(`Texte importé depuis « ${snapshot.title || snapshot.url} ».`);
    } catch (error) { setBrowserMessage(error instanceof Error ? error.message : 'Lecture de la page impossible.'); }
  }

  async function runAnalysis() {
    const result = analyzeServiceBag(serviceBagText);
    setAnalysis(result);
    if (window.nassist) {
      await window.nassist.scans.save({ prestationNumber: lastResult?.prestationNumber ?? null, confidence: lastResult?.confidence ?? 0, rawText: serviceBagText, status: result.decision, agentName: agentLabel });
      await refreshHistory();
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = history.filter((item) => item.createdAt.slice(0, 10) === today);
  const myTodayRecords = todayRecords.filter((item) => item.agentName === agentLabel);
  const stats = [
    { label: 'Mes opérations aujourd’hui', value: String(myTodayRecords.length) },
    { label: 'Autorisées', value: String(myTodayRecords.filter((item) => item.status === 'AUTHORIZED').length) },
    { label: 'Blocages évités', value: String(myTodayRecords.filter((item) => item.status === 'BLOCKED').length) },
    { label: 'Erreurs OCR', value: String(myTodayRecords.filter((item) => item.status === 'OCR_ERROR').length) }
  ];

  const agents = useMemo(() => [...new Set(history.map((item) => item.agentName))].sort(), [history]);
  const filteredHistory = useMemo(() => history.filter((item) => {
    const text = `${item.prestationNumber ?? ''} ${item.agentName} ${item.status}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (statusFilter === 'ALL' || item.status === statusFilter) && (agentFilter === 'ALL' || item.agentName === agentFilter);
  }), [history, query, statusFilter, agentFilter]);

  if (!agent) return <main className="login-screen"><section className="login-card"><div className="brand login-brand"><div className="brand-mark">N</div><div><strong>N'Assist</strong><span>Manager Pro</span></div></div><UserRound size={42}/><h1>Connexion agent</h1><p>Chaque scan et chaque décision seront associés à votre session locale.</p><input value={loginName} onChange={(event) => setLoginName(event.target.value)} placeholder="Nom et prénom"/><input value={loginMatricule} onChange={(event) => setLoginMatricule(event.target.value)} placeholder="Matricule" onKeyDown={(event) => { if (event.key === 'Enter') login(); }}/><button className="primary" disabled={!loginName.trim() || !loginMatricule.trim()} onClick={login}>Ouvrir ma session</button><small>Aucun mot de passe ServiceBag n’est enregistré.</small></section></main>;

  const titles: Record<View, string> = { dashboard: 'Tableau de bord agent', scanner: 'Scanner OCR', history: 'Historique des opérations', analysis: 'Analyse ServiceBag' };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">N</div><div><strong>N'Assist</strong><span>Manager Pro</span></div></div>
      <div className="agent-chip"><UserRound size={18}/><div><strong>{agent.name}</strong><span>{agent.matricule}</span></div></div>
      <nav>
        <button className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}><LayoutDashboard size={19}/>Tableau de bord</button>
        <button className={`nav-item ${view === 'scanner' ? 'active' : ''}`} onClick={() => setView('scanner')}><Camera size={19}/>Scanner ServiceBag</button>
        <button className={`nav-item ${view === 'analysis' ? 'active' : ''}`} onClick={() => setView('analysis')}><ClipboardCheck size={19}/>Analyse sécurisée</button>
        <button className={`nav-item ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}><Luggage size={19}/>Historique</button>
      </nav>
      <button className="nav-item logout" onClick={logout}><LogOut size={18}/>Fermer la session</button>
      <div className="signature">Créé par Sofiane Hamoum</div>
    </aside>

    <main className="content">
      <header><div><p className="eyebrow">CONCIERGERIE • SERVICEBAG</p><h1>{titles[view]}</h1></div><span className="status"><i/>Session active</span></header>

      {view === 'dashboard' && <><section className="stats-grid">{stats.map((stat) => <article className="stat-card" key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></article>)}</section><section className="workspace"><article className="scanner-card"><div className="scanner-icon"><Camera size={38}/></div><h2>Bonjour {agent.name}</h2><p>Scannez un ticket ServiceBag. L’opération sera automatiquement signée avec votre matricule {agent.matricule}.</p><button className="primary" onClick={() => setView('scanner')}>Démarrer le scanner</button></article><article className="security-card"><h2>Contrôle de sécurité</h2><ul><li><span>1</span>Lecture OCR du ticket</li><li><span>2</span>Lecture contrôlée ServiceBag</li><li><span>3</span>Blocage si paiement ou dépassement</li><li><span>4</span>Traçabilité par agent</li></ul><div className="warning"><ShieldAlert size={20}/>Aucun paiement ne sera validé automatiquement.</div></article></section></>}

      {view === 'scanner' && <section className="scanner-layout"><ScannerPanel onResult={(result) => void handleResult(result)} /><article className="result-card"><h2>Résultat du dernier scan</h2>{lastResult ? <><dl><div><dt>Numéro détecté</dt><dd>{lastResult.prestationNumber ?? 'Non détecté'}</dd></div><div><dt>Confiance OCR</dt><dd>{lastResult.confidence} %</dd></div><div><dt>Agent</dt><dd>{agentLabel}</dd></div></dl><pre>{lastResult.rawText || 'Aucun texte reconnu'}</pre></> : <p>Aucun ticket analysé.</p>}<div className="warning"><ShieldAlert size={20}/>La validation finale reste sous contrôle de l’agent.</div></article></section>}

      {view === 'analysis' && <section className="analysis-layout"><article className="analysis-card"><h2>Passerelle navigateur en lecture seule</h2><p>Indiquez l’adresse autorisée de ServiceBag. La connexion reste manuelle et aucun bouton n’est actionné.</p><div className="url-row"><input value={serviceBagUrl} onChange={(event) => setServiceBagUrl(event.target.value)} placeholder="https://adresse-servicebag-autorisée"/><button className="primary" onClick={() => void openServiceBag()}>Ouvrir</button><button className="secondary" onClick={() => void importVisibleText()}>Importer le texte visible</button></div>{browserMessage && <p className="browser-message">{browserMessage}</p>}<textarea value={serviceBagText} onChange={(event) => setServiceBagText(event.target.value)} placeholder="Le texte visible de la prestation apparaîtra ici."/><button className="primary" onClick={() => void runAnalysis()}>Analyser et enregistrer</button></article><article className={`decision-card ${analysis?.decision.toLowerCase() ?? ''}`}><h2>Décision de sécurité</h2>{analysis ? <><strong className="decision-title">{analysis.decision === 'AUTHORIZED' ? 'Validation envisageable' : analysis.decision === 'BLOCKED' ? 'Clôture bloquée' : 'Vérification nécessaire'}</strong><ul>{analysis.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul><div className="warning"><ShieldAlert size={20}/>Décision enregistrée au nom de {agentLabel}.</div></> : <p>Ouvrez une page autorisée, importez son texte visible puis lancez l’analyse.</p>}</article></section>}

      {view === 'history' && <section className="history-card"><div className="history-head"><h2>{filteredHistory.length} opération(s)</h2><button className="primary" onClick={() => void refreshHistory()}>Actualiser</button></div><div className="filters"><label><Search size={17}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Prestation, agent ou statut"/></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">Tous les statuts</option><option value="READ">OCR lu</option><option value="AUTHORIZED">Autorisé</option><option value="BLOCKED">Bloqué</option><option value="REVIEW_REQUIRED">À vérifier</option><option value="OCR_ERROR">Erreur OCR</option></select><select value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)}><option value="ALL">Tous les agents</option>{agents.map((name) => <option key={name} value={name}>{name}</option>)}</select></div>{historyError && <p className="error-message">{historyError}</p>}<div className="history-table"><div className="history-row history-labels"><span>Date</span><span>Prestation</span><span>Agent</span><span>Confiance</span><span>Statut</span></div>{filteredHistory.map((item) => <div className="history-row" key={item.id}><span>{new Date(item.createdAt).toLocaleString('fr-FR')}</span><strong>{item.prestationNumber ?? 'Non détecté'}</strong><span>{item.agentName}</span><span>{item.confidence} %</span><span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span></div>)}{filteredHistory.length === 0 && <p>Aucun enregistrement correspondant.</p>}</div></section>}
    </main>
  </div>;
}