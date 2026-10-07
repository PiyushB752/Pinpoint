"use client";

interface QueryHistoryItem {
  id: string;
  query: string;
  createdAt: string;
}

interface QueryHistoryProps {
  queries: QueryHistoryItem[];
  onSelect: (
    item: QueryHistoryItem,
  ) => void;
}

export default function QueryHistory({
  queries,
  onSelect,
}: QueryHistoryProps) {
  return (
    <aside className="history-panel">
      <div className="panel-header">
        <div>
          <span className="panel-label">
            Recent
          </span>

          <h2>Query history</h2>
        </div>
      </div>

      {queries.length === 0 ? (
        <div className="history-empty">
          <p>Your recent queries will appear here.</p>
        </div>
      ) : (
        <div className="history-list">
          {queries.map((item) => (
            <button
              key={item.id}
              type="button"
              className="history-item"
              onClick={() => onSelect(item)}
            >
              <span className="history-query">
                {item.query}
              </span>

              <span className="history-time">
                {formatHistoryTime(
                  item.createdAt,
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}

function formatHistoryTime(
  value: string,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
    },
  );
}