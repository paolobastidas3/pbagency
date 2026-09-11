import { useEffect, useState } from 'react';
import { fetchPendingSelection, selectPage } from '../lib/api';

export default function PageSelectModal({ token, onDone, onCancel }) {
  const [pending, setPending] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPendingSelection(token)
      .then(setPending)
      .catch((err) => setError(err.message));
  }, [token]);

  async function handleSelect(pageId) {
    setSaving(true);
    try {
      await selectPage(token, pageId);
      onDone();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>Elige la página de Facebook</h3>
        <p className="panel-sub">Administras más de una página. Selecciona cuál corresponde a este cliente.</p>
        {error && <p className="empty-state">{error}</p>}
        {!error && !pending && <p className="empty-state">Cargando páginas…</p>}
        {pending && (
          <ul className="page-select-list">
            {pending.pages.map((page) => (
              <li key={page.id}>
                <button className="page-select-item" onClick={() => handleSelect(page.id)} disabled={saving}>
                  <strong>{page.name}</strong>
                  <span>{page.igUsername ? `Instagram: @${page.igUsername}` : 'Sin Instagram vinculado'}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button className="link-button" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
