function initials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Sidebar({ clients, selectedId, onSelect }) {
  return (
    <aside className="sidebar">
      <h1>PB Agency</h1>
      <p className="tagline">Dashboard de contenido · IG &amp; FB</p>
      <ul className="client-list">
        {clients.map((client) => (
          <li key={client.id}>
            <button
              className={`client-item${client.id === selectedId ? ' active' : ''}`}
              onClick={() => onSelect(client.id)}
            >
              <span className="client-avatar" style={{ background: client.avatarColor }}>
                {initials(client.name)}
              </span>
              <span>
                <div className="client-name">{client.name}</div>
                <div className="client-industry">{client.industry}</div>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
