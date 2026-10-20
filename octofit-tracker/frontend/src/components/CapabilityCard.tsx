import { useEffect, useState, type ReactNode } from 'react';

type Props<T> = {
  title: string;
  description: string;
  loadData: () => Promise<Record<string, T[]>>;
  dataKey: string;
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T>({
  title,
  description,
  loadData,
  dataKey,
  emptyMessage,
  renderItem,
}: Props<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadData()
      .then((response) => {
        const result = response[dataKey];
        if (!Array.isArray(result)) throw new Error(`Invalid response for ${title}`);
        if (active) setItems(result);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Unknown error');
      });

    return () => {
      active = false;
    };
  }, [dataKey, loadData, title]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {items === null && error === null && <p role="status">Loading {title.toLowerCase()}...</p>}
        {error !== null && <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>}
        {items !== null && items.length === 0 && <p>{emptyMessage}</p>}
        {items !== null && items.length > 0 && (
          <ul className="list-group">
            {items.map((item, index) => (
              <li className="list-group-item" key={index}>{renderItem(item)}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
