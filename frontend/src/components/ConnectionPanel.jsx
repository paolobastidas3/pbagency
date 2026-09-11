import { getConnectUrl } from '../lib/api';

export default function ConnectionPanel({ clientId, status, onDisconnect, disconnecting }) {
  if (!status) return null;

  if (!status.metaConfigured) {
    return (
      <div className="connection-panel connection-panel--muted">
        <span className="badge">Meta no configurado</span>
        <span className="connection-hint">Agrega META_APP_ID y META_APP_SECRET en backend/.env para poder conectar cuentas reales.</span>
      </div>
    );
  }

  if (status.connected) {
    return (
      <div className="connection-panel connection-panel--connected">
        <span className="badge badge--good">● Conectado</span>
        <span className="connection-hint">
          {status.pageName}
          {status.igUsername ? ` · @${status.igUsername}` : ''}
        </span>
        <button className="link-button" onClick={onDisconnect} disabled={disconnecting}>
          {disconnecting ? 'Desconectando…' : 'Desconectar'}
        </button>
      </div>
    );
  }

  return (
    <div className="connection-panel">
      <a className="connect-button" href={getConnectUrl(clientId)}>
        Conectar con Meta
      </a>
      <span className="connection-hint">Vincula la Página de Facebook y la cuenta de Instagram de este cliente.</span>
    </div>
  );
}
