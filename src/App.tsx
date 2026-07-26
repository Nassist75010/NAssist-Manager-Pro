import { useState } from 'react';
import { Camera, LayoutDashboard, Luggage, Settings, ShieldAlert } from 'lucide-react';
import ScannerPanel from './components/ScannerPanel';
import type { OcrResult } from './types/scan';

const stats = [
  { label: 'Scans aujourd’hui', value: '0' },
  { label: 'Clôtures sécurisées', value: '0' },
  { label: 'Dépassements bloqués', value: '0' },
  { label: 'Erreurs OCR', value: '0' }
];

export default function App() {
  const [view, setView] = useState<'dashboard' | 'scanner'>('dashboard');
  const [lastResult, setLastResult] = useState<OcrResult | null>(null);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">N</div><div><strong>N'Assist</strong><span>Manager Pro</span></div></div>
        <nav>
          <button className={`nav-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}><LayoutDashboard size={19}/>Tableau de bord</button>
          <button className={`nav-item ${view === 'scanner' ? 'active' : ''}`} onClick={() => setView('scanner')}><Camera size={19}/>Scanner ServiceBag</button>
          <button className="nav-item"><Luggage size={19}/>Historique</button>
          <button className="nav-item"><ShieldAlert size={19}/>Alertes</button>
          <button className="nav-item"><Settings size={19}/>Paramètres</button>
        </nav>
        <div className="signature">Créé par Sofiane Hamoum</div>
      </aside>

      <main className="content">
        <header>
          <div><p className="eyebrow">CONCIERGERIE • SERVICEBAG</p><h1>{view === 'scanner' ? 'Scanner OCR' : 'Tableau de bord'}</h1></div>
          <span className="status"><i/>Système prêt</span>
        </header>

        {view === 'dashboard' ? (
          <>
            <section className="stats-grid">{stats.map((stat) => <article className="stat-card" key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></article>)}</section>
            <section className="workspace">
              <article className="scanner-card">
                <div className="scanner-icon"><Camera size={38}/></div><h2>Scanner un ticket ServiceBag</h2>
                <p>La caméra lit le numéro de prestation. Toute clôture restera bloquée si un dépassement ou un paiement est détecté.</p>
                <button className="primary" onClick={() => setView('scanner')}>Démarrer le scanner</button>
              </article>
              <article className="security-card"><h2>Contrôle de sécurité</h2><ul><li><span>1</span>Lecture OCR du ticket</li><li><span>2</span>Recherche de la prestation</li><li><span>3</span>Analyse du dépassement</li><li><span>4</span>Validation ou blocage</li></ul><div className="warning"><ShieldAlert size={20}/>Aucun paiement ne sera validé automatiquement.</div></article>
            </section>
          </>
        ) : (
          <section className="scanner-layout">
            <ScannerPanel onResult={setLastResult} />
            <article className="result-card">
              <h2>Résultat du dernier scan</h2>
              {lastResult ? <><dl><div><dt>Numéro détecté</dt><dd>{lastResult.prestationNumber ?? 'Non détecté'}</dd></div><div><dt>Confiance OCR</dt><dd>{lastResult.confidence} %</dd></div></dl><pre>{lastResult.rawText || 'Aucun texte reconnu'}</pre></> : <p>Aucun ticket analysé pour le moment.</p>}
              <div className="warning"><ShieldAlert size={20}/>Cette version lit le ticket uniquement. Elle ne clôture aucune prestation.</div>
            </article>
          </section>
        )}
      </main>
    </div>
  );
}
