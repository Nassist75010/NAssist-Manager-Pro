import { useEffect, useState } from 'react';
import { Camera, ClipboardCheck, LayoutDashboard, Luggage, Settings, ShieldAlert } from 'lucide-react';
import ScannerPanel from './components/ScannerPanel';
import { analyzeServiceBag } from './services/analyzeServiceBag';
import type { OcrResult } from './types/scan';
import type { ServiceBagAnalysis } from './types/servicebag';

type View = 'dashboard' | 'scanner' | 'history' | 'analysis';
type ScanRecord = { id:number; prestationNumber:string|null; confidence:number; status:string; agentName:string; createdAt:string };

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [lastResult, setLastResult] = useState<OcrResult | null>(null);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [serviceBagText, setServiceBagText] = useState('');
  const [serviceBagUrl, setServiceBagUrl] = useState('');
  const [browserMessage, setBrowserMessage] = useState('');
  const [analysis, setAnalysis] = useState<ServiceBagAnalysis | null>(null);

  async function refreshHistory() {
    try {
      if (!window.nassist) return;
      setHistory(await window.nassist.scans.list(100));
      setHistoryError('');
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : 'Historique indisponible.');
    }
  }

  useEffect(() => { if (view === 'history' || view === 'dashboard') void refreshHistory(); }, [view]);

  async function handleResult(result: OcrResult) {
    setLastResult(result);
    if (!window.nassist) return;
    await window.nassist.scans.save({
      prestationNumber: result.prestationNumber,
      confidence: result.confidence,
      rawText: result.rawText,
      status: result.prestationNumber ? 'READ' : 'OCR_ERROR'
    });
  }

  async function openServiceBag() {
    try {
      if (!window.nassist) throw new Error('Passerelle Electron indisponible.');
      await window.nassist.serviceBag.open(serviceBagUrl);
      setBrowserMessage('Fenêtre ouverte en lecture contrôlée. Connectez-vous manuellement puis revenez ici.');
    } catch (error) {
      setBrowserMessage(error instanceof Error ? error.message : 'Impossible d’ouvrir la page.');
    }
  }

  async function importVisibleText() {
    try {
      if (!window.nassist) throw new Error('Passerelle Electron indisponible.');
      const snapshot = await window.nassist.serviceBag.extractVisibleText();
      setServiceBagText(snapshot.text);
      setBrowserMessage(`Texte importé depuis « ${snapshot.title || snapshot.url} ».`);
    } catch (error) {
      setBrowserMessage(error instanceof Error ? error.message : 'Lecture de la page impossible.');
    }
  }

  async function runAnalysis() {
    const result = analyzeServiceBag(serviceBagText);
    setAnalysis(result);
    if (window.nassist) {
      await window.nassist.scans.save({
        prestationNumber: lastResult?.prestationNumber ?? null,
        confidence: lastResult?.confidence ?? 0,
        rawText: serviceBagText,
        status: result.decision
      });
      await refreshHistory();
    }
  }

  const stats = [
    { label: 'Scans enregistrés', value: String(history.length) },
    { label: 'Dernier numéro', value: lastResult?.prestationNumber ?? '—' },
    { label: 'Dépassements bloqués', value: String(history.filter((item) => item.status === 'BLOCKED').length) },
    { label: 'Erreurs OCR', value: String(history.filter((item) => item.status === 'OCR_ERROR').length) }
  ];

  const titles: Record<View, string> = { dashboard: 'Tableau de bord', scanner: 'Scanner OCR', history: 'Historique des scans', analysis: 'Analyse ServiceBag' };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">N</div><div><strong>N'Assist</strong><span>Manager Pro</span></div></div>
      <nav>
        <button className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}><LayoutDashboard size={19}/>Tableau de bord</button>
        <button className={`nav-item ${view === 'scanner' ? 'active' : ''}`} onClick={() => setView('scanner')}><Camera size={19}/>Scanner ServiceBag</button>
        <button className={`nav-item ${view === 'analysis' ? 'active' : ''}`} onClick={() => setView('analysis')}><ClipboardCheck size={19}/>Analyse sécurisée</button>
        <button className={`nav-item ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}><Luggage size={19}/>Historique</button>
        <button className="nav-item"><ShieldAlert size={19}/>Alertes</button>
        <button className="nav-item"><Settings size={19}/>Paramètres</button>
      </nav>
      <div className="signature">Créé par Sofiane Hamoum</div>
    </aside>

    <main className="content">
      <header><div><p className="eyebrow">CONCIERGERIE • SERVICEBAG</p><h1>{titles[view]}</h1></div><span className="status"><i/>Système prêt</span></header>

      {view === 'dashboard' && <>
        <section className="stats-grid">{stats.map((stat) => <article className="stat-card" key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></article>)}</section>
        <section className="workspace"><article className="scanner-card"><div className="scanner-icon"><Camera size={38}/></div><h2>Scanner un ticket ServiceBag</h2><p>Lecture OCR et enregistrement local sécurisé dans SQLite.</p><button className="primary" onClick={() => setView('scanner')}>Démarrer le scanner</button></article><article className="security-card"><h2>Contrôle de sécurité</h2><ul><li><span>1</span>Lecture OCR du ticket</li><li><span>2</span>Lecture contrôlée ServiceBag</li><li><span>3</span>Blocage si paiement ou dépassement</li><li><span>4</span>Validation humaine</li></ul><div className="warning"><ShieldAlert size={20}/>Aucun paiement ne sera validé automatiquement.</div></article></section>
      </>}

      {view === 'scanner' && <section className="scanner-layout"><ScannerPanel onResult={(result) => void handleResult(result)} /><article className="result-card"><h2>Résultat du dernier scan</h2>{lastResult ? <><dl><div><dt>Numéro détecté</dt><dd>{lastResult.prestationNumber ?? 'Non détecté'}</dd></div><div><dt>Confiance OCR</dt><dd>{lastResult.confidence} %</dd></div></dl><pre>{lastResult.rawText || 'Aucun texte reconnu'}</pre></> : <p>Aucun ticket analysé.</p>}<div className="warning"><ShieldAlert size={20}/>La validation finale reste sous contrôle de l’agent.</div></article></section>}

      {view === 'analysis' && <section className="analysis-layout">
        <article className="analysis-card">
          <h2>Passerelle navigateur en lecture seule</h2>
          <p>Indiquez l’adresse autorisée de ServiceBag. La connexion reste manuelle et aucun bouton n’est actionné.</p>
          <div className="url-row"><input value={serviceBagUrl} onChange={(event) => setServiceBagUrl(event.target.value)} placeholder="https://adresse-servicebag-autorisée"/><button className="primary" onClick={() => void openServiceBag()}>Ouvrir</button><button className="secondary" onClick={() => void importVisibleText()}>Importer le texte visible</button></div>
          {browserMessage && <p className="browser-message">{browserMessage}</p>}
          <textarea value={serviceBagText} onChange={(event) => setServiceBagText(event.target.value)} placeholder="Le texte visible de la prestation apparaîtra ici."/>
          <button className="primary" onClick={() => void runAnalysis()}>Analyser et enregistrer la décision</button>
        </article>
        <article className={`decision-card ${analysis?.decision.toLowerCase() ?? ''}`}><h2>Décision de sécurité</h2>{analysis ? <><strong className="decision-title">{analysis.decision === 'AUTHORIZED' ? 'Validation envisageable' : analysis.decision === 'BLOCKED' ? 'Clôture bloquée' : 'Vérification nécessaire'}</strong><ul>{analysis.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul><div className="warning"><ShieldAlert size={20}/>Aucun clic, aucune clôture et aucun paiement automatiques.</div></> : <p>Ouvrez une page autorisée, importez son texte visible puis lancez l’analyse.</p>}</article>
      </section>}

      {view === 'history' && <section className="history-card"><div className="history-head"><h2>100 derniers scans et décisions</h2><button className="primary" onClick={() => void refreshHistory()}>Actualiser</button></div>{historyError && <p className="error-message">{historyError}</p>}<div className="history-table"><div className="history-row history-labels"><span>Date</span><span>Prestation</span><span>Confiance</span><span>Statut</span></div>{history.map((item) => <div className="history-row" key={item.id}><span>{new Date(item.createdAt).toLocaleString('fr-FR')}</span><strong>{item.prestationNumber ?? 'Non détecté'}</strong><span>{item.confidence} %</span><span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span></div>)}{history.length === 0 && <p>Aucun enregistrement.</p>}</div></section>}
    </main>
  </div>;
}