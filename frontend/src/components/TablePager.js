import React, { useState } from 'react';
import { Button } from 'react-bootstrap';

// Paginação no navegador: as listas já chegam completas da API.
export const usePagination = (items, pageSize = 15) => {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  // Se a lista encolher (filtro, exclusão), não fica presa numa página vazia.
  const current = Math.min(page, pageCount - 1);
  return {
    page: current,
    pageCount,
    pageSize,
    total: items.length,
    pageItems: items.slice(current * pageSize, (current + 1) * pageSize),
    setPage,
  };
};

const TablePager = ({ page, pageCount, pageSize, total, setPage }) => {
  if (pageCount <= 1) return null;
  const first = page * pageSize + 1;
  const last = Math.min(total, (page + 1) * pageSize);
  return (
    <div className="table-pager">
      <span>{first}–{last} de {total}</span>
      <div>
        <Button size="sm" variant="outline-dark" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Página anterior">‹ Anterior</Button>
        <span className="table-pager-page">{page + 1}/{pageCount}</span>
        <Button size="sm" variant="outline-dark" disabled={page >= pageCount - 1} onClick={() => setPage(page + 1)} aria-label="Próxima página">Próxima ›</Button>
      </div>
    </div>
  );
};

export default TablePager;
