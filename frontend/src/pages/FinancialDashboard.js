import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, Spinner, Table } from 'react-bootstrap';
import RevenueChart, { monthLabel } from '../components/RevenueChart';
import { formatPrice } from '../components/ServiceCard';
import ShopSelect from '../components/ShopSelect';
import { fetchFinancialReport, fetchManagedShops } from '../services/api';
import { getCurrentUser } from '../services/authService';

// Paleta validada para daltonismo (protan/deutan/tritan) sobre fundo claro.
const COLORS = { house: '#1e8a5a', barber: '#e9a23b' };
const PAGE_SIZE = 6;
const CHART_MONTHS = 12;

const percent = (value) => `${Math.round(value * 100)}%`;
// Com barbearias de comissões diferentes não há uma taxa única para exibir.
const withRate = (label, rate) => (rate === null ? label : `${label} (${percent(rate)})`);

const Delta = ({ current, previous, goodWhenUp = true }) => {
  if (!previous) return <span className="kpi-delta is-neutral">sem base no mês anterior</span>;
  const change = (current - previous) / previous;
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
  const tone = direction === 'flat' || goodWhenUp === null ? 'is-neutral' : (direction === 'up') === goodWhenUp ? 'is-good' : 'is-bad';
  return (
    <span className={`kpi-delta ${tone}`}>
      {direction === 'up' ? '▲' : direction === 'down' ? '▼' : '■'} {percent(Math.abs(change))} vs mês anterior
    </span>
  );
};

const Kpi = ({ label, value, hint, current, previous, goodWhenUp, swatch }) => (
  <div className="kpi">
    <span className="kpi-label">{swatch && <i style={{ background: swatch }} />}{label}</span>
    <strong className="kpi-value">{value}</strong>
    {hint && <span className="kpi-hint">{hint}</span>}
    <Delta current={current} previous={previous} goodWhenUp={goodWhenUp} />
  </div>
);

const Pager = ({ page, pageCount, onChange, compact = false }) => {
  if (pageCount <= 1) return null;
  return (
    <div className={`pager${compact ? ' is-compact' : ''}`}>
      <Button size="sm" variant="outline-dark" disabled={page === 0} onClick={() => onChange(page - 1)} aria-label="Meses mais recentes">‹{compact ? '' : ' Mais recentes'}</Button>
      <span>{compact ? `${page + 1}/${pageCount}` : `Página ${page + 1} de ${pageCount}`}</span>
      <Button size="sm" variant="outline-dark" disabled={page >= pageCount - 1} onClick={() => onChange(page + 1)} aria-label="Meses anteriores">{compact ? '' : 'Anteriores '}›</Button>
    </div>
  );
};

const FinancialDashboard = () => {
  const user = getCurrentUser();
  const isBarber = user?.role === 'barber';
  const isAdmin = user?.role === 'admin';
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState(null);
  const [report, setReport] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin) fetchManagedShops().then(setShops).catch(() => setShops([]));
  }, [isAdmin]);

  useEffect(() => {
    setReport(null);
    fetchFinancialReport(shopId ? { barbershopId: shopId } : undefined)
      .then(data => {
        setSelectedMonth('');
        setPage(0);
        setReport(data);
      })
      .catch(() => setError('Não foi possível carregar o relatório financeiro.'));
  }, [shopId]);

  if (error) return <main className="container finance-page"><Alert variant="danger" className="mt-5">{error}</Alert></main>;
  if (!report) return <main className="container finance-page"><div className="finance-loading"><Spinner animation="border" size="sm" /> Carregando relatório…</div></main>;

  const rate = report.commissionRate;
  const history = [...report.months].reverse();
  const pageCount = Math.ceil(history.length / PAGE_SIZE);
  const pageMonths = history.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  // Sem escolha do usuário, mostra o mês mais recente da página.
  const selected = selectedMonth || pageMonths[0].month;
  const index = report.months.findIndex(month => month.month === selected);
  const current = report.months[index];
  const previous = report.months[index - 1] || null;

  // O gráfico mostra os 12 meses que terminam no mais recente da página atual.
  const chartEnd = report.months.findIndex(month => month.month === pageMonths[0].month);
  const chartData = report.months.slice(Math.max(0, chartEnd - CHART_MONTHS + 1), chartEnd + 1);

  const changePage = (nextPage) => {
    setPage(nextPage);
    setSelectedMonth(history[nextPage * PAGE_SIZE].month);
  };
  const selectMonth = (month) => {
    setSelectedMonth(month);
    setPage(Math.floor(history.findIndex(item => item.month === month) / PAGE_SIZE));
  };

  const series = isBarber
    ? [{ key: 'barberShare', label: withRate('Sua comissão', rate), color: COLORS.barber }, { key: 'houseShare', label: withRate('Parte da casa', rate === null ? null : 1 - rate), color: COLORS.house }]
    : [{ key: 'houseShare', label: withRate('Parte da casa', rate === null ? null : 1 - rate), color: COLORS.house }, { key: 'barberShare', label: withRate('Repasse aos barbeiros', rate), color: COLORS.barber }];
  const showShopColumn = isAdmin && !shopId && shops.length > 1;
  const splitNote = rate === null
    ? 'A divisão entre barbeiro e casa segue a comissão configurada em cada barbearia.'
    : `Divisão de cada serviço: ${percent(rate)} para o barbeiro e ${percent(1 - rate)} para a casa.`;

  return (
    <main className="container finance-page">
      <header className="page-heading finance-heading">
        <div>
          <span className="eyebrow">{isBarber ? 'PAINEL DO PROFISSIONAL' : 'FINANCEIRO'}</span>
          <h1>{isBarber ? 'Meus ganhos' : 'Rendimento da barbearia'}</h1>
          <p>{isBarber ? 'Seu faturamento e sua comissão, atendimento por atendimento.' : 'Faturamento, repasses e lucro da casa mês a mês.'}</p>
        </div>
        <div className="finance-filters">
          {isAdmin && <ShopSelect shops={shops} value={shopId} onChange={setShopId} allowAll />}
          <Form.Group className="finance-month">
            <Form.Label>Mês de referência</Form.Label>
            <div className="month-picker">
              <Form.Select value={selected} onChange={event => selectMonth(event.target.value)}>
                {pageMonths.map(month => <option key={month.month} value={month.month}>{monthLabel(month.month, true)}</option>)}
              </Form.Select>
              <Pager page={page} pageCount={pageCount} onChange={changePage} compact />
            </div>
          </Form.Group>
        </div>
      </header>

      <section className="kpi-grid" aria-label="Indicadores do mês">
        <Kpi label={isBarber ? 'Faturamento gerado' : 'Faturamento bruto'} value={formatPrice(current.revenue)} hint={`Ticket médio ${formatPrice(current.averageTicket)}`} current={current.revenue} previous={previous?.revenue} />
        {isBarber ? (
          <>
            <Kpi label="Sua comissão" swatch={COLORS.barber} value={formatPrice(current.barberShare)} hint={`${percent(rate)} de cada atendimento`} current={current.barberShare} previous={previous?.barberShare} />
            <Kpi label="Parte da casa" swatch={COLORS.house} value={formatPrice(current.houseShare)} hint={`${percent(1 - rate)} fica com a barbearia`} current={current.houseShare} previous={previous?.houseShare} goodWhenUp={null} />
          </>
        ) : (
          <>
            <Kpi label="Repasse aos barbeiros" swatch={COLORS.barber} value={formatPrice(current.barberShare)} hint={rate === null ? 'Custo de comissão' : `Custo de comissão · ${percent(rate)} por serviço`} current={current.barberShare} previous={previous?.barberShare} goodWhenUp={null} />
            <Kpi label="Lucro da casa" swatch={COLORS.house} value={formatPrice(current.houseShare)} hint={rate === null ? 'Após as comissões' : `${percent(1 - rate)} de cada atendimento`} current={current.houseShare} previous={previous?.houseShare} />
          </>
        )}
        <Kpi label="Atendimentos concluídos" value={current.completed} hint={current.openCount ? `${current.openCount} em aberto · ${formatPrice(current.openRevenue)} previstos` : 'Nenhum em aberto'} current={current.completed} previous={previous?.completed} />
      </section>

      <section className="finance-card">
        <div className="section-heading">
          <div><span className="eyebrow">ÚLTIMOS {chartData.length} MESES</span><h2>{isBarber ? 'Seu faturamento por mês' : 'Faturamento por mês'}</h2></div>
          <span className="section-count">Clique em um mês para ver os detalhes</span>
        </div>
        <RevenueChart data={chartData} series={series} selected={selected} onSelect={selectMonth} />
        <p className="finance-note">Considera apenas atendimentos com status <strong>Concluído</strong>. {splitNote}</p>
      </section>

      <div className={`finance-columns${isBarber ? ' is-single' : ''}`}>
        {!isBarber && (
          <section className="finance-card">
            <div className="section-heading"><div><span className="eyebrow">{monthLabel(selected, true).toUpperCase()}</span><h2>Por barbeiro</h2></div></div>
            <div className="table-wrap">
              <Table responsive hover className="data-table">
                <thead><tr><th>Barbeiro</th><th className="num">Atend.</th><th className="num">Faturamento</th><th className="num">Comissão</th><th className="num">Casa</th></tr></thead>
                <tbody>
                  {current.barbers.map(barber => (
                    <tr key={barber.id}>
                      <td><strong>{barber.name}</strong>{(showShopColumn || barber.openCount > 0) && <small>{[showShopColumn && barber.shopName, barber.openCount > 0 && `${barber.openCount} em aberto`].filter(Boolean).join(' · ')}</small>}</td>
                      <td className="num">{barber.completed}</td>
                      <td className="num">{formatPrice(barber.revenue)}</td>
                      <td className="num">{formatPrice(barber.barberShare)}</td>
                      <td className="num">{formatPrice(barber.houseShare)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {!current.barbers.length && <p className="table-empty">Nenhum atendimento neste mês.</p>}
            </div>
          </section>
        )}

        <section className="finance-card">
          <div className="section-heading"><div><span className="eyebrow">{monthLabel(selected, true).toUpperCase()}</span><h2>Por serviço</h2></div></div>
          <div className="table-wrap">
            <Table responsive hover className="data-table">
              <thead><tr><th>Serviço</th><th className="num">Qtd.</th><th className="num">Faturamento</th><th className="num">Participação</th></tr></thead>
              <tbody>
                {current.services.map(service => (
                  <tr key={service.name}>
                    <td><strong>{service.name}</strong></td>
                    <td className="num">{service.count}</td>
                    <td className="num">{formatPrice(service.revenue)}</td>
                    <td className="num">{current.revenue ? percent(service.revenue / current.revenue) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {!current.services.length && <p className="table-empty">Nenhum serviço concluído neste mês.</p>}
          </div>
        </section>
      </div>

      <section className="finance-card">
        <div className="section-heading"><div><span className="eyebrow">HISTÓRICO</span><h2>Resumo mensal</h2></div><span className="section-count">{history.length} meses</span></div>
        <div className="table-wrap">
          <Table responsive hover className="data-table is-clickable">
            <thead><tr><th>Mês</th><th className="num">Atendimentos</th><th className="num">Faturamento</th><th className="num">{isBarber ? 'Sua comissão' : 'Repasse'}</th><th className="num">Casa</th><th className="num">Ticket médio</th></tr></thead>
            <tbody>
              {pageMonths.map(month => (
                <tr key={month.month} className={month.month === selected ? 'is-selected' : ''} onClick={() => selectMonth(month.month)}>
                  <td><strong>{monthLabel(month.month, true)}</strong></td>
                  <td className="num">{month.completed}</td>
                  <td className="num">{formatPrice(month.revenue)}</td>
                  <td className="num">{formatPrice(month.barberShare)}</td>
                  <td className="num">{formatPrice(month.houseShare)}</td>
                  <td className="num">{formatPrice(month.averageTicket)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        <Pager page={page} pageCount={pageCount} onChange={changePage} />
      </section>
    </main>
  );
};

export default FinancialDashboard;
