import { CONTENT_TYPE_LABELS, PLATFORM_LABELS, formatDate, formatNumber, formatPercent } from '../lib/format';

export default function TopPostsTable({ posts }) {
  if (!posts.length) return <p className="empty-state">Sin publicaciones en este rango.</p>;

  return (
    <table className="top-posts">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Plataforma</th>
          <th>Formato</th>
          <th>Alcance</th>
          <th>Engagement</th>
        </tr>
      </thead>
      <tbody>
        {posts.map((post) => (
          <tr key={post.id}>
            <td>{formatDate(post.date)}</td>
            <td>
              <span className="badge">{PLATFORM_LABELS[post.platform]}</span>
            </td>
            <td>{CONTENT_TYPE_LABELS[post.type]}</td>
            <td>{formatNumber(post.reach)}</td>
            <td className="strong">{formatPercent(post.engagementRate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
