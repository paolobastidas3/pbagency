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
import { fetchClients, fetchSummary, fetchTimeSeries, fetchContentTypes, fetchTopPosts, fetchInsights } from './lib/api';
import { formatNumber, formatPercent } from './lib/format';

export default function App() {
  const [clients, setClients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [platform, setPlatform] = useState('all');
  const [days, setDays] = useState('30');

  const [summary, setSummary] = useState(null);
  const [timeSeries, setTimeSeries] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [topPosts, setTopPosts] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClients()
      .then((data) => {
        setClients(data);
        if (data.length) setSelectedId(data[0].id);
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

  const selectedClient = clients.find((c) => c.id === selectedId);

  return (
    <div className="app">
      <Sidebar clients={clients} selectedId={selectedId} onSelect={setSelectedId} />
      <main className="main">
        <div className="main-header">
          <div>
            <h2>{selectedClient ? selectedClient.name : 'Cargando…'}</h2>
            <p className="subtitle">
              Rendimiento de contenido en Instagram y Facebook
              {selectedClient ? ` · ${selectedClient.industry}` : ''}
            </p>
          </div>
          <FilterBar platform={platform} onPlatformChange={setPlatform} days={days} onDaysChange={setDays} />
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
    </div>
  );
}
