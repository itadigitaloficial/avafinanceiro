import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useContasPagar } from "@/hooks/useContasPagar";
import { useFornecedores } from "@/hooks/useFornecedores";
import { useCategorias } from "@/hooks/useCategorias";
import { useBeneficiarios } from "@/hooks/useBeneficiarios";
import { useContasBancarias } from "@/hooks/useContasBancarias";
import { useFormasPagamento } from "@/hooks/useFormasPagamento";
import { ContaPagar } from "@/types/conta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Search, FileText, ExternalLink, CalendarIcon, Filter, X, Download,
  DollarSign, Clock, Building2, Tag, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Landmark, CreditCard, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReportDialog } from "@/components/contas/ReportDialog";

const ITEMS_PER_PAGE = 15;

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d?: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
};

const getVencimento = (c: ContaPagar) => c.vencimento || c.venciamento;
const getPagamento = (c: ContaPagar) => c.data_pagamento || c.data_do_pagamento;

function statusBadge(status?: string, size: "sm" | "md" = "sm") {
  const s = status?.toLowerCase() || "";
  const base = size === "md" ? "px-3 py-1 text-xs" : "";
  if (s === "pago") return <Badge className={cn("bg-accent text-accent-foreground", base)}>Pago</Badge>;
  if (s === "vencido") return <Badge variant="destructive" className={base}>Vencido</Badge>;
  if (s === "pendente" || s === "aberto") return <Badge className={cn("bg-[hsl(38,92%,50%)] text-foreground", base)}>Pendente</Badge>;
  return <Badge variant="outline" className={base}>{status || "—"}</Badge>;
}

const ContasPagar = () => {
  const { data: contas, isLoading, error } = useContasPagar();
  const { data: fornecedores } = useFornecedores();
  const { data: categorias } = useCategorias();
  const { data: beneficiarios } = useBeneficiarios();
  const { data: contasBancarias } = useContasBancarias();
  const { data: formasPagamento } = useFormasPagamento();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoriaFilter, setCategoriaFilter] = useState("all");
  const [fornecedorFilter, setFornecedorFilter] = useState("all");
  const [beneficiarioFilter, setBeneficiarioFilter] = useState("all");
  const [formaPagamentoFilter, setFormaPagamentoFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selected, setSelected] = useState<ContaPagar | null>(null);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const fornecedorMap = useMemo(() => {
    const map: Record<string, string> = {};
    fornecedores?.forEach((f) => {
      if (f._id) map[f._id] = f.nome_razao_social || f.nome_fantasia || f.nome || f._id;
    });
    return map;
  }, [fornecedores]);

  const categoriaMap = useMemo(() => {
    const map: Record<string, string> = {};
    categorias?.forEach((c) => {
      if (c._id) map[c._id] = c.categoria || c._id;
    });
    return map;
  }, [categorias]);

  const beneficiarioMap = useMemo(() => {
    const map: Record<string, string> = {};
    beneficiarios?.forEach((b) => {
      if (b._id) map[b._id] = b.nome_razao_social || b.nome_fantasia || b.nome || b._id;
    });
    return map;
  }, [beneficiarios]);

  const contaBancariaMap = useMemo(() => {
    const map: Record<string, string> = {};
    contasBancarias?.forEach((cb) => {
      if (cb._id) map[cb._id] = cb.nome || cb.banco || cb._id;
    });
    return map;
  }, [contasBancarias]);

  const formaPagamentoMap = useMemo(() => {
    const map: Record<string, string> = {};
    formasPagamento?.forEach((fp) => {
      if (fp._id) map[fp._id] = fp.forma_pagamento || fp.nome || fp._id;
    });
    return map;
  }, [formasPagamento]);

  const getCategoriaNome = (id?: string) => {
    if (!id) return "—";
    return categoriaMap[id] || id;
  };

  const getFornecedorNome = (conta: ContaPagar) => {
    if (conta.fornecedor_id && fornecedorMap[conta.fornecedor_id]) return fornecedorMap[conta.fornecedor_id];
    if (conta.fornecedor && fornecedorMap[conta.fornecedor]) return fornecedorMap[conta.fornecedor];
    return conta.fornecedor || conta.fornecedor_id || "—";
  };

  const getBeneficiarioNome = (id?: string) => {
    if (!id) return "—";
    return beneficiarioMap[id] || id;
  };

  const getContaBancariaNome = (id?: string) => {
    if (!id) return "—";
    return contaBancariaMap[id] || id;
  };

  const getFormaPagamentoNome = (id?: string) => {
    if (!id) return "—";
    return formaPagamentoMap[id] || id;
  };

  const uniqueFornecedores = useMemo(() => {
    if (!contas) return [];
    const ids = new Set<string>();
    contas.forEach((c) => {
      const id = c.fornecedor || c.fornecedor_id;
      if (id) ids.add(id);
    });
    return Array.from(ids).map((id) => ({ id, nome: fornecedorMap[id] || id })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [contas, fornecedorMap]);

  const uniqueCategorias = useMemo(() => {
    if (!contas) return [];
    const ids = new Set<string>();
    contas.forEach((c) => { if (c.categoria) ids.add(c.categoria); });
    return Array.from(ids).map((id) => ({ id, nome: categoriaMap[id] || id })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [contas, categoriaMap]);

  const uniqueBeneficiarios = useMemo(() => {
    if (!contas) return [];
    const ids = new Set<string>();
    contas.forEach((c) => { if (c.beneficiario) ids.add(c.beneficiario); });
    return Array.from(ids).map((id) => ({ id, nome: beneficiarioMap[id] || id })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [contas, beneficiarioMap]);

  const uniqueFormasPagamento = useMemo(() => {
    if (!contas) return [];
    const ids = new Set<string>();
    contas.forEach((c) => { if (c.forma_pagamento) ids.add(c.forma_pagamento); });
    return Array.from(ids).map((id) => ({ id, nome: formaPagamentoMap[id] || id })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [contas, formaPagamentoMap]);

  const filtered = useMemo(() => {
    if (!contas) return [];
    let list = [...contas];

    list.sort((a, b) => {
      const da = a["Created Date"] || getVencimento(a) || "";
      const db = b["Created Date"] || getVencimento(b) || "";
      return db.localeCompare(da);
    });

    const hoje = new Date();
    list = list.map((c) => {
      const venc = getVencimento(c);
      if (venc && new Date(venc) < hoje && c.status?.toLowerCase() !== "pago") {
        return { ...c, status: "Vencido" };
      }
      return c;
    });

    if (statusFilter !== "all") list = list.filter((c) => c.status?.toLowerCase() === statusFilter);
    if (categoriaFilter !== "all") list = list.filter((c) => c.categoria === categoriaFilter);
    if (fornecedorFilter !== "all") list = list.filter((c) => (c.fornecedor || c.fornecedor_id) === fornecedorFilter);
    if (beneficiarioFilter !== "all") list = list.filter((c) => c.beneficiario === beneficiarioFilter);
    if (formaPagamentoFilter !== "all") list = list.filter((c) => c.forma_pagamento === formaPagamentoFilter);

    if (dateFrom) {
      list = list.filter((c) => {
        const d = getVencimento(c) || getPagamento(c);
        return d && new Date(d) >= dateFrom;
      });
    }
    if (dateTo) {
      list = list.filter((c) => {
        const d = getVencimento(c) || getPagamento(c);
        return d && new Date(d) <= dateTo;
      });
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          getFornecedorNome(c).toLowerCase().includes(q) ||
          c.fornecedor?.toLowerCase().includes(q) ||
          c.numero_documento?.toLowerCase().includes(q) ||
          getCategoriaNome(c.categoria).toLowerCase().includes(q) ||
          c.empresa?.toLowerCase().includes(q) ||
          c.descricao?.toLowerCase().includes(q) ||
          getBeneficiarioNome(c.beneficiario).toLowerCase().includes(q)
      );
    }
    return list;
  }, [contas, search, statusFilter, categoriaFilter, fornecedorFilter, beneficiarioFilter, formaPagamentoFilter, dateFrom, dateTo, fornecedorMap, categoriaMap, beneficiarioMap, formaPagamentoMap]);

  const totalValorFiltered = useMemo(() => filtered.reduce((s, c) => s + (c.valor || 0), 0), [filtered]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const resetPage = () => setPage(1);
  const handleSearch = (v: string) => { setSearch(v); resetPage(); };
  const activeFilters = [statusFilter !== "all", categoriaFilter !== "all", fornecedorFilter !== "all", beneficiarioFilter !== "all", formaPagamentoFilter !== "all", !!dateFrom, !!dateTo].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("all");
    setCategoriaFilter("all");
    setFornecedorFilter("all");
    setBeneficiarioFilter("all");
    setFormaPagamentoFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearch("");
    resetPage();
  };

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
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Contas a Pagar</h1>
            <p className="text-sm text-muted-foreground">Gerencie todas as contas e pagamentos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowReport(true)} className="gap-2">
              <Download className="h-4 w-4" /> Gerar Relatório
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Registros</p>
            <p className="text-xl font-bold text-foreground mt-1">{filtered.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total</p>
            <p className="text-xl font-bold text-foreground mt-1">{fmt(totalValorFiltered)}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Pagas</p>
            <p className="text-xl font-bold text-accent mt-1">{filtered.filter(c => c.status?.toLowerCase() === "pago").length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Vencidas</p>
            <p className="text-xl font-bold text-destructive mt-1">{filtered.filter(c => c.status?.toLowerCase() === "vencido").length}</p>
          </div>
        </div>

        {/* Search + Filter toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por fornecedor, documento, categoria..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-card"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {activeFilters > 0 && (
                <span className="bg-primary-foreground text-primary rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold">
                  {activeFilters}
                </span>
              )}
            </Button>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                <X className="h-3 w-3" /> Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Advanced filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Status</label>
                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="aberto">Aberto</SelectItem>
                        <SelectItem value="vencido">Vencido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Categoria</label>
                    <Select value={categoriaFilter} onValueChange={(v) => { setCategoriaFilter(v); resetPage(); }}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {uniqueCategorias.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Fornecedor</label>
                    <Select value={fornecedorFilter} onValueChange={(v) => { setFornecedorFilter(v); resetPage(); }}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {uniqueFornecedores.map((f) => (
                          <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Beneficiário</label>
                    <Select value={beneficiarioFilter} onValueChange={(v) => { setBeneficiarioFilter(v); resetPage(); }}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {uniqueBeneficiarios.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Forma de Pagamento</label>
                    <Select value={formaPagamentoFilter} onValueChange={(v) => { setFormaPagamentoFilter(v); resetPage(); }}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {uniqueFormasPagamento.map((fp) => (
                          <SelectItem key={fp.id} value={fp.id}>{fp.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Data Início</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-background", !dateFrom && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={dateFrom} onSelect={(d) => { setDateFrom(d); resetPage(); }} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Data Fim</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-background", !dateTo && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "dd/MM/yyyy") : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={dateTo} onSelect={(d) => { setDateTo(d); resetPage(); }} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Documento</TableHead>
                  <TableHead className="font-semibold">Fornecedor</TableHead>
                  <TableHead className="font-semibold">Beneficiário</TableHead>
                  <TableHead className="font-semibold">Categoria</TableHead>
                  <TableHead className="text-right font-semibold">Valor</TableHead>
                  <TableHead className="font-semibold">Vencimento</TableHead>
                  <TableHead className="font-semibold">Pagamento</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      Nenhuma conta encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((conta, i) => (
                    <TableRow
                      key={conta._id || conta.uniq_id || conta.id || i}
                      className="cursor-pointer hover:bg-muted/30 transition-colors group"
                      onClick={() => setSelected(conta)}
                    >
                      <TableCell className="font-medium text-sm">{conta.numero_documento || "—"}</TableCell>
                      <TableCell className="text-sm max-w-[180px] truncate">{getFornecedorNome(conta)}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{getBeneficiarioNome(conta.beneficiario)}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{getCategoriaNome(conta.categoria)}</TableCell>
                      <TableCell className="text-right font-semibold text-sm tabular-nums">{fmt(conta.valor || 0)}</TableCell>
                      <TableCell className="text-sm tabular-nums">{fmtDate(getVencimento(conta))}</TableCell>
                      <TableCell className="text-sm tabular-nums">{fmtDate(getPagamento(conta))}</TableCell>
                      <TableCell>{statusBadge(conta.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Mostrando {filtered.length > 0 ? ((page - 1) * ITEMS_PER_PAGE) + 1 : 0}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(1)} disabled={page === 1}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 text-xs"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                );
              })}
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-6 pt-6 pb-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                Detalhes da Conta
              </DialogTitle>
              <DialogDescription>Documento {selected?.numero_documento || "—"}</DialogDescription>
            </DialogHeader>
            {selected && (
              <div className="flex items-center gap-3 mt-3">
                {statusBadge(selected.status, "md")}
                <span className="text-2xl font-bold text-foreground">{fmt(selected.valor || 0)}</span>
              </div>
            )}
          </div>
          {selected && (
            <div className="px-6 pb-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" /> Informações Gerais
                  </h4>
                  <div className="space-y-3">
                    <DetailRow label="Documento" value={selected.numero_documento} />
                    <DetailRow label="Fornecedor" value={getFornecedorNome(selected)} />
                    <DetailRow label="Beneficiário" value={getBeneficiarioNome(selected.beneficiario)} />
                    <DetailRow label="Empresa" value={selected.empresa} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" /> Datas
                  </h4>
                  <div className="space-y-3">
                    <DetailRow label="Vencimento" value={fmtDate(getVencimento(selected))} />
                    <DetailRow label="Pagamento" value={fmtDate(getPagamento(selected))} />
                    <DetailRow label="Emissão" value={fmtDate(selected.data_da_emissao)} />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5" /> Classificação
                  </h4>
                  <div className="space-y-3">
                    <DetailRow label="Categoria" value={getCategoriaNome(selected.categoria)} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5" /> Financeiro
                  </h4>
                  <div className="space-y-3">
                    <DetailRow label="Valor" value={fmt(selected.valor || 0)} highlight />
                    <DetailRow label="Status" value={selected.status} />
                    <DetailRow label="Conta Bancária" value={getContaBancariaNome(selected.conta_bancaria)} />
                    <DetailRow label="Forma de Pagamento" value={getFormaPagamentoNome(selected.forma_pagamento)} />
                  </div>
                </div>
              </div>

              {(selected.descricao || selected.observacao) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    {selected.descricao && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Descrição</p>
                        <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">{selected.descricao}</p>
                      </div>
                    )}
                    {selected.observacao && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Observação</p>
                        <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">{selected.observacao}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {selected.arquivo && (
                <Button variant="outline" size="sm" asChild className="gap-2">
                  <a href={selected.arquivo.startsWith("//") ? `https:${selected.arquivo}` : selected.arquivo} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> Ver Arquivo Anexo
                  </a>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <ReportDialog
        open={showReport}
        onOpenChange={setShowReport}
        contas={filtered}
        fornecedorMap={fornecedorMap}
        categoriaMap={categoriaMap}
        beneficiarioMap={beneficiarioMap}
        contaBancariaMap={contaBancariaMap}
        formaPagamentoMap={formaPagamentoMap}
        getFornecedorNome={getFornecedorNome}
        getCategoriaNome={getCategoriaNome}
        getBeneficiarioNome={getBeneficiarioNome}
        getContaBancariaNome={getContaBancariaNome}
        getFormaPagamentoNome={getFormaPagamentoNome}
      />
    </DashboardLayout>
  );
};

function DetailRow({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm text-right", highlight ? "font-bold text-foreground" : "text-foreground")}>{value || "—"}</span>
    </div>
  );
}

export default ContasPagar;
