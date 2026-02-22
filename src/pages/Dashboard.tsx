import { DashboardLayout } from "@/components/DashboardLayout";
import { KPICard } from "@/components/KPICard";
import { useContasPagar } from "@/hooks/useContasPagar";
import { useFornecedores } from "@/hooks/useFornecedores";
import { useCategorias } from "@/hooks/useCategorias";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, FileText, CheckCircle, AlertTriangle, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";
import { useMemo } from "react";
import { motion } from "framer-motion";

const CHART_COLORS = [
  "hsl(215,65%,40%)", "hsl(160,45%,40%)", "hsl(38,92%,50%)",
  "hsl(0,72%,51%)", "hsl(215,55%,55%)", "hsl(160,35%,55%)",
  "hsl(280,50%,50%)", "hsl(30,80%,50%)",
];

const Dashboard = () => {
  const { data: contas, isLoading } = useContasPagar();
  const { data: fornecedores } = useFornecedores();
  const { data: categorias } = useCategorias();

  const fornecedorMap = useMemo(() => {
    const map: Record<string, string> = {};
    fornecedores?.forEach((f) => { if (f._id) map[f._id] = f.nome_razao_social || f.nome_fantasia || f.nome || f._id; });
    return map;
  }, [fornecedores]);

  const categoriaMap = useMemo(() => {
    const map: Record<string, string> = {};
    categorias?.forEach((c) => { if (c._id) map[c._id] = c.categoria || c._id; });
    return map;
  }, [categorias]);

  const stats = useMemo(() => {
    if (!contas) return null;
    const total = contas.length;
    const totalValor = contas.reduce((s, c) => s + (c.valor || 0), 0);
    const pagas = contas.filter((c) => c.status?.toLowerCase() === "pago");
    const pagasValor = pagas.reduce((s, c) => s + (c.valor || 0), 0);
    const pendentes = contas.filter((c) => {
      const s = c.status?.toLowerCase();
      return s === "pendente" || s === "aberto" || !s;
    });
    const pendentesValor = pendentes.reduce((s, c) => s + (c.valor || 0), 0);
    const hoje = new Date();
    const vencidas = contas.filter((c) => {
      if (!c.vencimento) return false;
      return new Date(c.vencimento) < hoje && c.status?.toLowerCase() !== "pago";
    });
    const vencidasValor = vencidas.reduce((s, c) => s + (c.valor || 0), 0);
    return { total, totalValor, pagas: pagas.length, pagasValor, pendentes: pendentes.length, pendentesValor, vencidas: vencidas.length, vencidasValor };
  }, [contas]);

  const chartByCategory = useMemo(() => {
    if (!contas) return [];
    const map: Record<string, number> = {};
    contas.forEach((c) => {
      const cat = categoriaMap[c.categoria || ""] || c.categoria || "Outros";
      map[cat] = (map[cat] || 0) + (c.valor || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + "…" : name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [contas, categoriaMap]);

  const chartByMonth = useMemo(() => {
    if (!contas) return [];
    const map: Record<string, { pago: number; pendente: number }> = {};
    contas.forEach((c) => {
      const date = c.vencimento || c.data_pagamento;
      if (!date) return;
      const d = new Date(date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { pago: 0, pendente: 0 };
      if (c.status?.toLowerCase() === "pago") map[key].pago += c.valor || 0;
      else map[key].pendente += c.valor || 0;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        pago: Math.round(data.pago * 100) / 100,
        pendente: Math.round(data.pendente * 100) / 100,
        total: Math.round((data.pago + data.pendente) * 100) / 100,
      }));
  }, [contas]);

  const topFornecedores = useMemo(() => {
    if (!contas) return [];
    const map: Record<string, number> = {};
    contas.forEach((c) => {
      const id = c.fornecedor || c.fornecedor_id || "";
      const nome = fornecedorMap[id] || id;
      if (nome) map[nome] = (map[nome] || 0) + (c.valor || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({
      name: name.length > 25 ? name.slice(0, 25) + "…" : name,
      value: Math.round(value * 100) / 100,
    }));
  }, [contas, fornecedorMap]);

  const recentContas = useMemo(() => {
    if (!contas) return [];
    return [...contas]
      .sort((a, b) => {
        const da = (a as any)["Created Date"] || "";
        const db = (b as any)["Created Date"] || "";
        return db.localeCompare(da);
      })
      .slice(0, 5);
  }, [contas]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtShort = (v: number) => {
    if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}K`;
    return fmt(v);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral financeira — Contas a Pagar</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total de Contas"
            value={String(stats?.total || 0)}
            subtitle={fmtShort(stats?.totalValor || 0)}
            icon={FileText}
            color="hsl(215,65%,40%)"
            delay={0}
          />
          <KPICard
            title="Pagas"
            value={String(stats?.pagas || 0)}
            subtitle={fmtShort(stats?.pagasValor || 0)}
            icon={CheckCircle}
            color="hsl(160,45%,40%)"
            delay={0.1}
            trend="up"
          />
          <KPICard
            title="Pendentes"
            value={String(stats?.pendentes || 0)}
            subtitle={fmtShort(stats?.pendentesValor || 0)}
            icon={Clock}
            color="hsl(38,92%,50%)"
            delay={0.2}
          />
          <KPICard
            title="Vencidas"
            value={String(stats?.vencidas || 0)}
            subtitle={fmtShort(stats?.vencidasValor || 0)}
            icon={AlertTriangle}
            color="hsl(0,72%,51%)"
            delay={0.3}
            trend={stats?.vencidas ? "down" : undefined}
          />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Evolução Mensal</h3>
              <div className="flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(160,45%,40%)" }} /> Pago</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "hsl(38,92%,50%)" }} /> Pendente</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartByMonth} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(38,20%,88%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(215,15%,50%)" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(215,15%,50%)" axisLine={false} tickLine={false} tickFormatter={(v) => fmtShort(v)} />
                <Tooltip
                  formatter={(v: number, name: string) => [fmt(v), name === "pago" ? "Pago" : "Pendente"]}
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(38,20%,88%)", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                />
                <Bar dataKey="pago" radius={[4, 4, 0, 0]} fill="hsl(160,45%,40%)" stackId="a" />
                <Bar dataKey="pendente" radius={[4, 4, 0, 0]} fill="hsl(38,92%,50%)" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Por Categoria</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={chartByCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {chartByCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(38,20%,88%)", fontSize: 11, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Row 2: Top fornecedores + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Top 5 Fornecedores</h3>
            <div className="space-y-3">
              {topFornecedores.map((f, i) => {
                const max = topFornecedores[0]?.value || 1;
                const pct = (f.value / max) * 100;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground font-medium truncate max-w-[60%]">{f.name}</span>
                      <span className="text-muted-foreground tabular-nums text-xs">{fmt(f.value)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.6 + i * 0.1, duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Últimas Contas Cadastradas</h3>
            <div className="space-y-3">
              {recentContas.map((c, i) => {
                const fornNome = (() => {
                  const id = c.fornecedor || c.fornecedor_id || "";
                  return fornecedorMap[id] || id || "—";
                })();
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{fornNome}</p>
                      <p className="text-[10px] text-muted-foreground">{c.numero_documento || "—"} • {categoriaMap[c.categoria || ""] || "—"}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-sm font-bold text-foreground tabular-nums">{fmt(c.valor || 0)}</p>
                      <p className="text-[10px] text-muted-foreground">{c.status || "—"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
