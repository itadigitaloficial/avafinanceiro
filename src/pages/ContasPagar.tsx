import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useContasPagar } from "@/hooks/useContasPagar";
import { ContaPagar } from "@/types/conta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText, ExternalLink, X } from "lucide-react";
import { motion } from "framer-motion";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d?: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
};

function statusBadge(status?: string) {
  const s = status?.toLowerCase() || "";
  if (s === "pago") return <Badge className="bg-accent text-accent-foreground">Pago</Badge>;
  if (s === "vencido") return <Badge variant="destructive">Vencido</Badge>;
  if (s === "pendente" || s === "aberto") return <Badge className="bg-[hsl(38,92%,50%)] text-foreground">Pendente</Badge>;
  return <Badge variant="outline">{status || "—"}</Badge>;
}

const ContasPagar = () => {
  const { data: contas, isLoading, error } = useContasPagar();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<ContaPagar | null>(null);

  const filtered = useMemo(() => {
    if (!contas) return [];
    let list = [...contas];

    // Mark overdue
    const hoje = new Date();
    list = list.map((c) => {
      if (c.vencimento && new Date(c.vencimento) < hoje && c.status?.toLowerCase() !== "pago") {
        return { ...c, status: "Vencido" };
      }
      return c;
    });

    if (statusFilter !== "all") {
      list = list.filter((c) => c.status?.toLowerCase() === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.fornecedor?.toLowerCase().includes(q) ||
          c.numero_documento?.toLowerCase().includes(q) ||
          c.categoria?.toLowerCase().includes(q) ||
          c.empresa?.toLowerCase().includes(q) ||
          c.descricao?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [contas, search, statusFilter]);

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <p className="text-destructive font-medium">Erro ao carregar dados</p>
            <p className="text-sm text-muted-foreground">Verifique a conexão com a API</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contas a Pagar</h1>
          <p className="text-sm text-muted-foreground">Gerencie todas as contas e pagamentos</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por fornecedor, documento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="aberto">Aberto</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Documento</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Nenhuma conta encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((conta, i) => (
                    <TableRow
                      key={conta.uniq_id || conta.id || i}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setSelected(conta)}
                    >
                      <TableCell className="font-medium text-sm">{conta.numero_documento || "—"}</TableCell>
                      <TableCell className="text-sm">{conta.fornecedor || conta.fornecedor_id || "—"}</TableCell>
                      <TableCell className="text-sm">{conta.categoria || "—"}</TableCell>
                      <TableCell className="text-right font-semibold text-sm">{fmt(conta.valor || 0)}</TableCell>
                      <TableCell className="text-sm">{fmtDate(conta.vencimento)}</TableCell>
                      <TableCell>{statusBadge(conta.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>
        )}

        <p className="text-xs text-muted-foreground">
          {filtered.length} registro(s) encontrado(s)
        </p>
      </div>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Detalhes da Conta
            </DialogTitle>
            <DialogDescription>Informações completas do documento</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Detail label="Documento" value={selected.numero_documento} />
                <Detail label="Status" value={selected.status} badge />
                <Detail label="Fornecedor" value={selected.fornecedor || selected.fornecedor_id} />
                <Detail label="Categoria" value={selected.categoria} />
                <Detail label="Empresa" value={selected.empresa} />
                <Detail label="Valor" value={fmt(selected.valor || 0)} highlight />
                <Detail label="Vencimento" value={fmtDate(selected.vencimento)} />
                <Detail label="Pagamento" value={fmtDate(selected.data_pagamento)} />
              </div>
              {selected.descricao && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm text-foreground">{selected.descricao}</p>
                </div>
              )}
              {selected.observacao && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Observação</p>
                  <p className="text-sm text-foreground">{selected.observacao}</p>
                </div>
              )}
              {selected.arquivo && (
                <Button variant="outline" size="sm" asChild>
                  <a href={selected.arquivo} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-2" /> Ver Arquivo Anexo
                  </a>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

function Detail({ label, value, badge, highlight }: { label: string; value?: string; badge?: boolean; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
      {badge ? statusBadge(value) : (
        <p className={`text-sm ${highlight ? "font-bold text-foreground" : "text-foreground"}`}>{value || "—"}</p>
      )}
    </div>
  );
}

export default ContasPagar;
