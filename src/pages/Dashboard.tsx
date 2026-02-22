import { DashboardLayout } from "@/components/DashboardLayout";
import { KPICard } from "@/components/KPICard";
import { useContasPagar } from "@/hooks/useContasPagar";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useMemo } from "react";
import { motion } from "framer-motion";

const CHART_COLORS = ["hsl(215,65%,40%)", "hsl(160,45%,40%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)", "hsl(215,55%,55%)", "hsl(160,35%,55%)"];

const Dashboard = () => {
  const { data: contas, isLoading } = useContasPagar();

  const stats = useMemo(() => {
    if (!contas) return null;
    const total = contas.length;
    const totalValor = contas.reduce((s, c) => s + (c.valor || 0), 0);
    const pagas = contas.filter((c) => c.status?.toLowerCase() === "pago").length;
    const pendentes = contas.filter((c) => c.status?.toLowerCase() === "pendente" || c.status?.toLowerCase() === "aberto").length;
    const hoje = new Date();
    const vencidas = contas.filter((c) => {
      if (!c.vencimento) return false;
      const v = new Date(c.vencimento);
      return v < hoje && c.status?.toLowerCase() !== "pago";
    }).length;
    return { total, totalValor, pagas, pendentes, vencidas };
  }, [contas]);

  const chartByCategory = useMemo(() => {
    if (!contas) return [];
    const map: Record<string, number> = {};
    contas.forEach((c) => {
      const cat = c.categoria || "Outros";
      map[cat] = (map[cat] || 0) + (c.valor || 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
  }, [contas]);

  const chartByMonth = useMemo(() => {
    if (!contas) return [];
    const map: Record<string, number> = {};
    contas.forEach((c) => {
      const date = c.vencimento || c.data_pagamento;
      if (!date) return;
      const d = new Date(date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + (c.valor || 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, valor]) => ({
        month: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        valor: Math.round(valor * 100) / 100,
      }));
  }, [contas]);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
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
          <p className="text-sm text-muted-foreground">Visão geral das contas a pagar</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total de Contas" value={String(stats?.total || 0)} icon={FileText} color="hsl(215,65%,40%)" delay={0} />
          <KPICard title="Valor Total" value={fmt(stats?.totalValor || 0)} icon={DollarSign} color="hsl(160,45%,40%)" delay={0.1} />
          <KPICard title="Pagas" value={String(stats?.pagas || 0)} subtitle={`${stats?.pendentes || 0} pendentes`} icon={CheckCircle} color="hsl(160,45%,40%)" delay={0.2} />
          <KPICard title="Vencidas" value={String(stats?.vencidas || 0)} icon={AlertTriangle} color="hsl(0,72%,51%)" delay={0.3} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Pagamentos por Mês</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(38,20%,88%)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(215,15%,50%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(215,15%,50%)" />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(38,20%,88%)", fontSize: 12 }} />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]} fill="hsl(215,65%,35%)" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Distribuição por Categoria</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={chartByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3}>
                  {chartByCategory.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(38,20%,88%)", fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
