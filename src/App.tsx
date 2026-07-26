import { Camera, LayoutDashboard, Luggage, Settings, ShieldAlert } from 'lucide-react';

const stats = [
  { label: 'Scans aujourd’hui', value: '0' },
  { label: 'Clôtures sécurisées', value: '0' },
  { label: 'Dépassements bloqués', value: '0' },
  { label: 'Erreurs OCR', value: '0' }
];

export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">N</div>
          <div><strong>N'Assist</strong><span>Manager Pro</span></div>
        </div>
        <nav>
          <button className="nav-item active"><LayoutDashboard size={19}/>Tableau de bord</button>
          <button className="nav-item"><Camera size={19}/>Scanner ServiceBag</button>
          <button className="nav-item"><Luggage size={19}/>Historique</button>
          <button className="nav-item"><ShieldAlert size={19}/>Alertes</button>
          <button className="nav-item"><Settings size={19}/>Paramètres</button>
        </nav>
        <div className="signature">Créé par Sofiane Hamoum</div>
      </aside>

      <main className="content">
        <header>
          <div><p className="eyebrow">CONCIERGERIE • SERVICEBAG</p><h1>Tableau de bord</h1></div>
          <span className="status"><i/>Système prêt</span>
        </header>

        <section className="stats-grid">
          {stats.map((stat) => <article className="stat-card" key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></article>)}
        </section>

        <section className="workspace">
          <article className="scanner-card">
            <div className="scanner-icon"><Camera size={38}/></div>
            <h2>Scanner un ticket ServiceBag</h2>
            <p>La caméra lira automatiquement le numéro de prestation. Toute clôture sera bloquée si un dépassement ou un paiement est détecté.</p>
            <button className="primary">Démarrer le scanner</button>
          </article>

          <article className="security-card">
            <h2>Contrôle de sécurité</h2>
            <ul>
              <li><span>1</span>Lecture OCR du ticket</li>
              <li><span>2</span>Recherche de la prestation</li>
              <li><span>3</span>Analyse du dépassement</li>
              <li><span>4</span>Validation ou blocage</li>
            </ul>
            <div className="warning"><ShieldAlert size={20}/>Aucun paiement ne sera validé automatiquement.</div>
          </article>
        </section>
      </main>
    </div>
  );
}
