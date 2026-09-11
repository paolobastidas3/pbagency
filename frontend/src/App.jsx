import { useEffect, useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import FilterBar from './components/FilterBar';
import StatTile from './components/StatTile';
import ReachChart from './components/ReachChart';
import EngagementRateChart from './components/EngagementRateChart';
import ContentTypeChart from './components/ContentTypeChart';
import PlatformComparison from './components/PlatformComparison';
import TopPostsTable from './components/TopPostsTable';
import InsightsPanel from './components/InsightsPanel';
import ConnectionPanel from './components/ConnectionPanel';
import PageSelectModal from './components/PageSelectModal';
import {
  fetchClients,
  fetchSummary,
  fetchTimeSeries,
  fetchContentTypes,
  fetchTopPosts,
  fetchInsights,
  fetchConnectionStatus,
  disconnectClient,
} from './lib/api';
import { formatNumber, formatPercent } from './lib/format';

const CONNECT_ERROR_MESSAGES = {
  denied: 'Cancelaste la autorización en Meta, así que no se conectó ninguna cuenta.',
  invalid_request: 'La solicitud de conexión no era válida. Intenta de nuevo desde el dashboard.',
  no_pages: 'Tu cuenta de Meta no administra ninguna Página de Facebook. Crea una Página y vincúlala a tu cuenta de Instagram profesional antes de conectar.',
  meta_error: 'Meta devolvió un error al intercambiar el token. Revisa la consola del backend para más detalle.',
};

function readUrlState() {
  const params = new URLSearchParams(window.location.search);
  return {
    connected: params.get('connected'),
    connectError: params.get('connect_error'),
    select: params.get('select'),
    client: params.get('client'),
  };
}

function clearUrlState() {
  window.history.replaceState({}, '', window.location.pathname);
}

export default function App() {
  const [clients, setClients] = useState([]);
  const [selectedId, setSelectedId] = useState(() => readUrlState().client || null);
  const [platform, setPlatform] = useState('all');
  const [days, setDays] = useState('30');

  const [summary, setSummary] = useState(null);
  const [timeSeries, setTimeSeries] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [topPosts, setTopPosts] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [connectionStatus, setConnectionStatus] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [banner, setBanner] = useState(null);
  const [pendingSelectToken, setPendingSelectToken] = useState(() => readUrlState().select || null);

  useEffect(() => {
    const urlState = readUrlState();
    if (urlState.connected) setBanner({ type: 'success', text: 'Cuenta conectada correctamente. Ya se están mostrando datos en vivo.' });
    if (urlState.connectError) {
      setBanner({ type: 'error', text: CONNECT_ERROR_MESSAGES[urlState.connectError] || 'Ocurrió un error al conectar la cuenta.' });
    }
    if (urlState.connected || urlState.connectError || urlState.select) clearUrlState();
  }, []);

  useEffect(() => {
    fetchClients()
      .then((data) => {
        setClients(data);
        setSelectedId((current) => current || (data.length ? data[0].id : null));
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const filters = { platform, days };
    setLoading(true);
    setError(null);

    Promise.all([
      fetchSummary(selectedId, filters),
      fetchTimeSeries(selectedId, filters),
      fetchContentTypes(selectedId, filters),
      fetchTopPosts(selectedId, filters, 6),
      fetchInsights(selectedId, filters),
    ])
      .then(([s, ts, ct, tp, ins]) => {
        setSummary(s);
        setTimeSeries(ts);
        setContentTypes(ct);
        setTopPosts(tp);
        setInsights(ins);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedId, platform, days]);

  useEffect(() => {
    if (!selectedId) return;
    fetchConnectionStatus(selectedId)
      .then(setConnectionStatus)
      .catch(() => setConnectionStatus(null));
  }, [selectedId, banner]);

  async function handleDisconnect() {
    if (!selectedId) return;
    setDisconnecting(true);
    try {
      await disconnectClient(selectedId);
      setBanner({ type: 'success', text: 'Cuenta desconectada. Volviendo a datos de ejemplo.' });
      const status = await fetchConnectionStatus(selectedId);
      setConnectionStatus(status);
    } catch (err) {
      setBanner({ type: 'error', text: err.message });
    } finally {
      setDisconnecting(false);
    }
  }

  function handleSelectDone() {
    setPendingSelectToken(null);
    setBanner({ type: 'success', text: 'Cuenta conectada correctamente. Ya se están mostrando datos en vivo.' });
  }

  const selectedClient = clients.find((c) => c.id === selectedId);

  return (
    <div className="app">
      <Sidebar clients={clients} selectedId={selectedId} onSelect={setSelectedId} />
      <main className="main">
        {banner && (
          <div className={`banner banner--${banner.type}`}>
            {banner.text}
          </div>
        )}

        <div className="main-header">
          <div>
            <h2>{selectedClient ? selectedClient.name : 'Cargando…'}</h2>
            <p className="subtitle">
              Rendimiento de contenido en Instagram y Facebook
              {selectedClient ? ` · ${selectedClient.industry}` : ''}
              {summary?.source === 'mock' ? ' · datos de ejemplo' : ''}
              {summary?.source === 'live' ? ' · datos en vivo' : ''}
            </p>
          </div>
          <FilterBar platform={platform} onPlatformChange={setPlatform} days={days} onDaysChange={setDays} />
          {selectedId && (
            <ConnectionPanel
              clientId={selectedId}
              status={connectionStatus}
              onDisconnect={handleDisconnect}
              disconnecting={disconnecting}
            />
          )}
        </div>

        {error && <p className="empty-state">Ocurrió un error cargando los datos: {error}</p>}

        {!error && summary && (
          <>
            <div className="stat-grid">
              <StatTile label="Publicaciones" value={summary.totalPosts} />
              <StatTile label="Alcance total" value={formatNumber(summary.totalReach)} />
              <StatTile label="Impresiones" value={formatNumber(summary.totalImpressions)} />
              <StatTile label="Interacciones totales" value={formatNumber(summary.totalEngagements)} />
              <StatTile label="Engagement promedio" value={formatPercent(summary.avgEngagementRate)} />
            </div>

            <div className="panel-grid">
              <div className="panel">
                <h3>Alcance en el tiempo</h3>
                <p className="panel-sub">Suma diaria de alcance de todas las publicaciones</p>
                <ReachChart data={timeSeries} />
              </div>
              <div className="panel">
                <h3>Tasa de engagement en el tiempo</h3>
                <p className="panel-sub">Promedio diario de interacciones / alcance</p>
                <EngagementRateChart data={timeSeries} />
              </div>
            </div>

            <div className="panel-grid">
              <div className="panel">
                <h3>Rendimiento por formato</h3>
                <p className="panel-sub">Engagement promedio por tipo de contenido</p>
                <ContentTypeChart data={contentTypes} />
              </div>
              <div className="panel">
                <h3>Instagram vs. Facebook</h3>
                <p className="panel-sub">Comparación directa de ambas plataformas</p>
                <PlatformComparison byPlatform={summary.byPlatform} />
              </div>
            </div>

            <div className="panel-grid">
              <div className="panel">
                <h3>Mejores publicaciones</h3>
                <p className="panel-sub">Ordenadas por tasa de engagement</p>
                <TopPostsTable posts={topPosts} />
              </div>
              <div className="panel">
                <h3>Qué adaptar y mejorar</h3>
                <p className="panel-sub">Recomendaciones generadas a partir de los datos</p>
                <InsightsPanel insights={insights} />
              </div>
            </div>
          </>
        )}

        {!error && loading && !summary && <p className="empty-state">Cargando métricas…</p>}
      </main>

      {pendingSelectToken && (
        <PageSelectModal
          token={pendingSelectToken}
          onDone={handleSelectDone}
          onCancel={() => setPendingSelectToken(null)}
        />
      )}
    </div>
  );
}
