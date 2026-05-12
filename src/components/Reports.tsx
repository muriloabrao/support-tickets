import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Clock, CheckCircle2, AlertTriangle, TrendingUp, Users, BarChart3, Star, Timer } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';

// ── Types ──
interface Ticket {
  id: string;
  status: string;
  system: string;
  department: string;
  userName: string;
  userEmail: string;
  assignedToName?: string;
  assignedToEmail?: string;
  createdAt?: any;
  assignedAt?: any;
  resolvedAt?: any;
  feedbackRating?: number;
}

// ── Helpers ──
function toDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return null;
}

function diffHours(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / 3600000;
}

function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}min`;
  if (h < 24) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

const COLORS = [
  'hsl(197 68% 30%)', 'hsl(142 71% 45%)', 'hsl(38 92% 50%)',
  'hsl(0 72% 51%)', 'hsl(262 52% 47%)', 'hsl(220 9% 46%)',
];

const STATUS_MAP: Record<string, string> = {
  'Open': 'Na Fila',
  'In Progress': 'Em Atendimento',
  'Closed': 'Concluído',
};

// ── KPI Card ──
function KpiCard({ icon: Icon, label, value, sub, accent }: {
  icon: any; label: string; value: string; sub?: string; accent?: string;
}) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-xl border"
         style={{ borderColor: 'hsl(220 13% 91%)', backgroundColor: 'hsl(0 0% 100%)' }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
           style={{ backgroundColor: accent || 'hsl(197 68% 30% / 0.08)', color: accent ? 'white' : 'hsl(197 68% 30%)' }}>
        <Icon className="w-5 h-5" strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-medium uppercase tracking-wider" style={{ color: 'hsl(220 9% 46%)' }}>{label}</p>
        <p className="text-2xl font-semibold tracking-tight mt-0.5" style={{ color: 'hsl(224 71% 4%)' }}>{value}</p>
        {sub && <p className="text-[12px] mt-0.5" style={{ color: 'hsl(220 9% 46%)' }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Section wrapper ──
function Section({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h3 className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'hsl(220 9% 46%)' }}>{title}</h3>
      {children}
    </div>
  );
}

// ── Chart container ──
function ChartBox({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-6 rounded-xl border ${className}`}
         style={{ borderColor: 'hsl(220 13% 91%)', backgroundColor: 'hsl(0 0% 100%)' }}>
      {children}
    </div>
  );
}

// ── Custom Tooltip ──
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-sm shadow-lg border"
         style={{ backgroundColor: 'hsl(224 71% 4%)', color: 'white', borderColor: 'hsl(220 13% 91% / 0.2)' }}>
      <p className="font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[12px] opacity-80">{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

// ══════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════
export default function Reports() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    const q = query(collection(db, 'ep-resolve'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Ticket)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  // ── Filter by period ──
  const filtered = useMemo(() => {
    if (period === 'all') return tickets;
    const now = Date.now();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = now - days * 86400000;
    return tickets.filter(t => {
      const d = toDate(t.createdAt);
      return d ? d.getTime() >= cutoff : false;
    });
  }, [tickets, period]);

  // ── KPI calculations ──
  const kpis = useMemo(() => {
    const closed = filtered.filter(t => t.status === 'Closed');
    const withFRT = filtered.filter(t => t.assignedAt && t.createdAt);
    const withTTR = closed.filter(t => t.resolvedAt && t.createdAt);
    const withHandle = closed.filter(t => t.resolvedAt && t.assignedAt);
    const withFeedback = filtered.filter(t => t.feedbackRating);

    const avgTTR = withTTR.length
      ? withTTR.reduce((s, t) => s + diffHours(toDate(t.createdAt)!, toDate(t.resolvedAt)!), 0) / withTTR.length
      : 0;
    const avgFRT = withFRT.length
      ? withFRT.reduce((s, t) => s + diffHours(toDate(t.createdAt)!, toDate(t.assignedAt)!), 0) / withFRT.length
      : 0;
    const avgHandle = withHandle.length
      ? withHandle.reduce((s, t) => s + diffHours(toDate(t.assignedAt)!, toDate(t.resolvedAt)!), 0) / withHandle.length
      : 0;
    const resolutionRate = filtered.length ? (closed.length / filtered.length) * 100 : 0;
    const avgCSAT = withFeedback.length
      ? withFeedback.reduce((s, t) => s + (t.feedbackRating || 0), 0) / withFeedback.length
      : 0;

    // SLA: resolved within 24h
    const slaThreshold = 24;
    const slaCompliant = withTTR.filter(t => diffHours(toDate(t.createdAt)!, toDate(t.resolvedAt)!) <= slaThreshold).length;
    const slaRate = withTTR.length ? (slaCompliant / withTTR.length) * 100 : 0;

    // Backlog aging
    const now = new Date();
    const openTickets = filtered.filter(t => t.status === 'Open' || t.status === 'In Progress');
    const aging = openTickets
      .map(t => {
        const created = toDate(t.createdAt);
        return { ...t, ageHours: created ? diffHours(created, now) : 0 };
      })
      .sort((a, b) => b.ageHours - a.ageHours)
      .slice(0, 5);

    return { total: filtered.length, closed: closed.length, avgTTR, avgFRT, avgHandle, resolutionRate, avgCSAT, feedbackCount: withFeedback.length, slaRate, slaTotal: withTTR.length, aging, openCount: openTickets.length };
  }, [filtered]);

  // ── Chart data ──
  const charts = useMemo(() => {
    // Volume by status
    const statusCounts: Record<string, number> = {};
    filtered.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });
    const byStatus = Object.entries(statusCounts).map(([k, v]) => ({ name: STATUS_MAP[k] || k, value: v }));

    // Volume by system
    const sysCounts: Record<string, number> = {};
    filtered.forEach(t => { if (t.system) sysCounts[t.system] = (sysCounts[t.system] || 0) + 1; });
    const bySystem = Object.entries(sysCounts).map(([k, v]) => ({ name: k, value: v })).sort((a, b) => b.value - a.value);

    // Volume by department
    const deptCounts: Record<string, number> = {};
    filtered.forEach(t => { if (t.department) deptCounts[t.department] = (deptCounts[t.department] || 0) + 1; });
    const byDept = Object.entries(deptCounts).map(([k, v]) => ({ name: k, value: v })).sort((a, b) => b.value - a.value);

    // By agent
    const agentCounts: Record<string, number> = {};
    filtered.forEach(t => { if (t.assignedToName) agentCounts[t.assignedToName] = (agentCounts[t.assignedToName] || 0) + 1; });
    const byAgent = Object.entries(agentCounts).map(([k, v]) => ({ name: k, value: v })).sort((a, b) => b.value - a.value);

    // Timeline (by day)
    const timeline: Record<string, number> = {};
    filtered.forEach(t => {
      const d = toDate(t.createdAt);
      if (d) {
        const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        timeline[key] = (timeline[key] || 0) + 1;
      }
    });
    const byDay = Object.entries(timeline).reverse().map(([k, v]) => ({ date: k, chamados: v }));

    return { byStatus, bySystem, byDept, byAgent, byDay };
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: 'hsl(197 68% 30% / 0.2)', borderTopColor: 'hsl(197 68% 30%)' }} />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'hsl(224 71% 4%)' }}>Relatórios</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(220 9% 46%)' }}>
            Métricas de SLA e desempenho do helpdesk.
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'hsl(220 14% 96%)' }}>
          {([['7d', '7 dias'], ['30d', '30 dias'], ['90d', '90 dias'], ['all', 'Tudo']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${period === val ? 'shadow-sm' : ''}`}
              style={{
                backgroundColor: period === val ? 'white' : 'transparent',
                color: period === val ? 'hsl(224 71% 4%)' : 'hsl(220 9% 46%)',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tier 1: KPI Cards ── */}
      <Section title="Indicadores Principais">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard icon={BarChart3} label="Total de Chamados" value={String(kpis.total)} sub={`${kpis.openCount} em aberto`} />
          <KpiCard icon={Clock} label="Tempo Médio de Resolução" value={kpis.avgTTR ? formatHours(kpis.avgTTR) : '—'} sub="Abertura até conclusão" />
          <KpiCard icon={Timer} label="Primeira Resposta" value={kpis.avgFRT ? formatHours(kpis.avgFRT) : '—'} sub="Tempo na fila" />
          <KpiCard icon={CheckCircle2} label="Taxa de Resolução" value={`${kpis.resolutionRate.toFixed(0)}%`} sub={`${kpis.closed} de ${kpis.total} concluídos`} />
        </div>
      </Section>

      {/* ── Tier 2: Charts Row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Volume por Status">
          <ChartBox>
            {charts.byStatus.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={charts.byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%"
                       innerRadius={55} outerRadius={85} strokeWidth={2} stroke="hsl(220 14% 96%)">
                    {charts.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center py-10 text-sm" style={{ color: 'hsl(220 9% 46%)' }}>Sem dados</p>}
            <div className="flex flex-wrap gap-4 mt-2 justify-center">
              {charts.byStatus.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2 text-[13px]">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span style={{ color: 'hsl(224 71% 4%)' }}>{s.name}</span>
                  <span className="font-semibold" style={{ color: 'hsl(220 9% 46%)' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </ChartBox>
        </Section>

        <Section title="Volume por Sistema">
          <ChartBox>
            {charts.bySystem.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={charts.bySystem} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 13, fill: 'hsl(220 9% 46%)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Chamados" fill="hsl(197 68% 30%)" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center py-10 text-sm" style={{ color: 'hsl(220 9% 46%)' }}>Sem dados</p>}
          </ChartBox>
        </Section>
      </div>

      {/* ── Timeline ── */}
      <Section title="Chamados ao Longo do Tempo">
        <ChartBox>
          {charts.byDay.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={charts.byDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(220 9% 46%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(220 9% 46%)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="chamados" name="Chamados" stroke="hsl(197 68% 30%)" fill="hsl(197 68% 30% / 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-center py-10 text-sm" style={{ color: 'hsl(220 9% 46%)' }}>Sem dados</p>}
        </ChartBox>
      </Section>

      {/* ── Tier 2 continued: Dept + Agent ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Volume por Departamento">
          <ChartBox>
            {charts.byDept.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.byDept} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 13, fill: 'hsl(220 9% 46%)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Chamados" fill="hsl(142 71% 45%)" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center py-10 text-sm" style={{ color: 'hsl(220 9% 46%)' }}>Sem dados</p>}
          </ChartBox>
        </Section>

        <Section title="Tickets por Atendente">
          <ChartBox>
            {charts.byAgent.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.byAgent} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 13, fill: 'hsl(220 9% 46%)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Tickets" fill="hsl(262 52% 47%)" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center py-10 text-sm" style={{ color: 'hsl(220 9% 46%)' }}>Nenhum ticket atribuído</p>}
          </ChartBox>
        </Section>
      </div>

      {/* ── Tier 3: SLA, Backlog, CSAT ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SLA Compliance */}
        <Section title="SLA (meta: 24h)">
          <ChartBox className="flex flex-col items-center justify-center py-8">
            <div className="relative w-28 h-28 mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(220 13% 91%)" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={kpis.slaRate >= 80 ? 'hsl(142 71% 45%)' : kpis.slaRate >= 50 ? 'hsl(38 92% 50%)' : 'hsl(0 72% 51%)'}
                  strokeWidth="8" strokeLinecap="round" strokeDasharray={`${kpis.slaRate * 2.64} 264`}
                  style={{ transition: 'stroke-dasharray 0.8s ease' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-semibold" style={{ color: 'hsl(224 71% 4%)' }}>{kpis.slaRate.toFixed(0)}%</span>
              </div>
            </div>
            <p className="text-[12px]" style={{ color: 'hsl(220 9% 46%)' }}>{kpis.slaTotal} tickets avaliados</p>
          </ChartBox>
        </Section>

        {/* Backlog Aging */}
        <Section title="Backlog Envelhecendo">
          <ChartBox>
            {kpis.aging.length ? (
              <div className="space-y-3">
                {kpis.aging.map(t => (
                  <div key={t.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium truncate" style={{ color: 'hsl(224 71% 4%)' }}>
                        {(t as any).title || (t as any).description?.substring(0, 30) + '...'}
                      </p>
                      <p className="text-[11px]" style={{ color: 'hsl(220 9% 46%)' }}>{(t as any).system}</p>
                    </div>
                    <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                      (t as any).ageHours > 72 ? 'bg-red-50 text-red-600' :
                      (t as any).ageHours > 24 ? 'bg-yellow-50 text-yellow-700' :
                      'bg-green-50 text-green-700'
                    }`}>
                      {formatHours((t as any).ageHours)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 className="w-8 h-8 mb-2" style={{ color: 'hsl(142 71% 45%)' }} strokeWidth={1.5} />
                <p className="text-[13px] font-medium" style={{ color: 'hsl(142 71% 45%)' }}>Fila limpa</p>
              </div>
            )}
          </ChartBox>
        </Section>

        {/* CSAT */}
        <Section title="Satisfação (CSAT)">
          <ChartBox className="flex flex-col items-center justify-center py-8">
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-7 h-7 ${s <= Math.round(kpis.avgCSAT) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} strokeWidth={1.5} />
              ))}
            </div>
            <p className="text-3xl font-semibold tracking-tight" style={{ color: 'hsl(224 71% 4%)' }}>
              {kpis.avgCSAT ? kpis.avgCSAT.toFixed(1) : '—'}
            </p>
            <p className="text-[12px] mt-1" style={{ color: 'hsl(220 9% 46%)' }}>
              {kpis.feedbackCount} {kpis.feedbackCount === 1 ? 'avaliação' : 'avaliações'}
            </p>
          </ChartBox>
        </Section>
      </div>

      {/* ── Extra KPIs row ── */}
      <Section title="Tempos Detalhados">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard icon={Timer} label="Tempo de Atendimento" value={kpis.avgHandle ? formatHours(kpis.avgHandle) : '—'} sub="Média após atribuição" />
          <KpiCard icon={AlertTriangle} label="Em Aberto" value={String(kpis.openCount)} sub="Tickets na fila ou em atendimento" />
          <KpiCard icon={TrendingUp} label="Concluídos" value={String(kpis.closed)} sub={`de ${kpis.total} no período`} />
        </div>
      </Section>
    </div>
  );
}
