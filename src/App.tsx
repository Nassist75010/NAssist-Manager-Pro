import { useEffect, useState } from 'react';
import { Camera, LayoutDashboard, Luggage, Settings, ShieldAlert } from 'lucide-react';
import ScannerPanel from './components/ScannerPanel';
import type { OcrResult } from './types/scan';

type View = 'dashboard' | 'scanner' | 'history';
type ScanRecord = { id:number; prestationNumber:string|null; confidence:number; status:string; agentName:string; createdAt:string };

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [lastResult, setLastResult] = useState<OcrResult | null>(null);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [historyError, setHistoryError] = useState('');

  async function refreshHistory() {
    try {
      if (!window.nassist) return;
      setHistory(await window.nassist.scans.list(100));
      setHistoryError('');
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : 'Historique indisponible.');
    }
  }

  useEffect(() => { if (view === 'history') void refreshHistory(); }, [view]);

  async function handleResult(result: OcrResult) {
    setLastResult(result);
    if (!window.nassist) return;
    const status = result.prestationNumber ? 'READ' : 'OCR_ERROR';
    await window.nassist.scans.save({
      prestationNumber: result.prestationNumber,
      confidence: result.confidence,
      rawText: result.rawText,
      status
    });
  }

  const stats = [
    { label: 'Scans enregistrés', value: String(history.length) },
    { label: 'Dernier numéro', value: lastResult?.prestationNumber ?? '—' },
    { label: 'Dépassements bloqués', value: '0' },
    { label: 'Erreurs OCR', value: String(history.filter((item) => item.status === 'OCR_ERROR').length) }
  ];

  const title = view === 'scanner' ? 'Scanner OCR' : view === 'history' ? 'Historique des scans' : 'Tableau de bord';

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">N</div><div><strong>N'Assist</strong><span>Manager Pro</span></div></div>
      <nav>
        <button className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}><LayoutDashboard size={19}/>Tableau de bord</button>
        <button className={`nav-item ${view === 'scanner' ? 'active' : ''}`} onClick={() => setView('scanner')}><Camera size={19}/>Scanner ServiceBag</button>
        <button className={`nav-item ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}><Luggage size={19}/>Historique</button>
        <button className="nav-item"><ShieldAlert size={19}/>Alertes</button>
        <button className="nav-item"><Settings size={19}/>Paramètres</button>
      </nav>
      <div className="signature">Créé par Sofiane Hamoum</div>
    </aside>

    <main className="content">
      <header><div><p className="eyebrow">CONCIERGERIE • SERVICEBAG</p><h1>{title}</h1></div><span className="status"><i/>Système prêt</span></header>

      {view === 'dashboard' && <>
        <section className="stats-grid">{stats.map((stat) => <article className="stat-card" key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></article>)}</section>
        <section className="workspace"><article className="scanner-card"><div className="scanner-icon"><Camera size={38}/></div><h2>Scanner un ticket ServiceBag</h2><p>Lecture OCR et enregistrement local sécurisé dans SQLite.</p><button className="primary" onClick={() => setView('scanner')}>Démarrer le scanner</button></article><article className="security-card"><h2>Contrôle de sécurité</h2><ul><li><span>1</span>Lecture OCR du ticket</li><li><span>2</span>Enregistrement de la trace</li><li><span>3</span>Analyse du dépassement</li><li><span>4</span>Validation humaine</li></ul><div className="warning"><ShieldAlert size={20}/>Aucun paiement ne sera validé automatiquement.</div></article></section>
      </>}

      {view === 'scanner' && <section className="scanner-layout"><ScannerPanel onResult={(result) => void handleResult(result)} /><article className="result-card"><h2>Résultat du dernier scan</h2>{lastResult ? <><dl><div><dt>Numéro détecté</dt><dd>{lastResult.prestationNumber ?? 'Non détecté'}</dd></div><div><dt>Confiance OCR</dt><dd>{lastResult.confidence} %</dd></div></dl><pre>{lastResult.rawText || 'Aucun texte reconnu'}</pre></> : <p>Aucun ticket analysé.</p>}<div className="warning"><ShieldAlert size={20}/>La validation finale reste sous contrôle de l’agent.</div></article></section>}

      {view === 'history' && <section className="history-card"><div className="history-head"><h2>100 derniers scans</h2><button className="primary" onClick={() => void refreshHistory()}>Actualiser</button></div>{historyError && <p className="error-message">{historyError}</p>}<div className="history-table"><div className="history-row history-labels"><span>Date</span><span>Prestation</span><span>Confiance</span><span>Statut</span></div>{history.map((item) => <div className="history-row" key={item.id}><span>{new Date(item.createdAt).toLocaleString('fr-FR')}</span><strong>{item.prestationNumber ?? 'Non détecté'}</strong><span>{item.confidence} %</span><span className={`badge ${item.status.toLowerCase()}`}>{item.status}</span></div>)}{history.length === 0 && <p>Aucun scan enregistré.</p>}</div></section>}
    </main>
  </div>;
}