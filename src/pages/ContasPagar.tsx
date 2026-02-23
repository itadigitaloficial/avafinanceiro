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
import { useIsMobile } from "@/hooks/use-mobile";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Search, FileText, ExternalLink, CalendarIcon, Filter, X, Download,
  DollarSign, Clock, Building2, Tag, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Landmark, CreditCard, Users, AlertCircle, CheckCircle2, CircleDot, Paperclip,
  TrendingDown, TrendingUp, Receipt, Eye
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

function statusConfig(status?: string) {
  const s = status?.toLowerCase() || "";
  if (s === "pago") return { label: "Pago", icon: CheckCircle2, className: "bg-accent/15 text-accent border-accent/30", dot: "bg-accent" };
  if (s === "vencido") return { label: "Vencido", icon: AlertCircle, className: "bg-destructive/15 text-destructive border-destructive/30", dot: "bg-destructive" };
  if (s === "pendente" || s === "aberto") return { label: "Pendente", icon: Clock, className: "bg-warning/15 text-warning border-warning/30", dot: "bg-warning" };
  return { label: status || "—", icon: CircleDot, className: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" };
}

function StatusBadge({ status, size = "sm" }: { status?: string; size?: "sm" | "md" }) {
  const cfg = statusConfig(status);
  const Icon = cfg.icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border font-medium",
      size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[11px]",
      cfg.className
    )}>
      <Icon className={size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"} />
      {cfg.label}
    </span>
  );
}

const ContasPagar = () => {
  const { data: contas, isLoading, error } = useContasPagar();
  const { data: fornecedores } = useFornecedores();
  const { data: categorias } = useCategorias();
  const { data: beneficiarios } = useBeneficiarios();
  const { data: contasBancarias } = useContasBancarias();
  const { data: formasPagamento } = useFormasPagamento();
  const isMobile = useIsMobile();
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
    contas.forEach((c) => { const id = c.fornecedor || c.fornecedor_id; if (id) ids.add(id); });
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
      list = list.filter((c) => { const d = getVencimento(c) || getPagamento(c); return d && new Date(d) >= dateFrom; });
    }
    if (dateTo) {
      list = list.filter((c) => { const d = getVencimento(c) || getPagamento(c); return d && new Date(d) <= dateTo; });
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
  const totalPagas = useMemo(() => filtered.filter(c => c.status?.toLowerCase() === "pago").length, [filtered]);
  const totalVencidas = useMemo(() => filtered.filter(c => c.status?.toLowerCase() === "vencido").length, [filtered]);
  const totalPendentes = useMemo(() => filtered.filter(c => c.status?.toLowerCase() === "pendente" || c.status?.toLowerCase() === "aberto").length, [filtered]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const resetPage = () => setPage(1);
  const handleSearch = (v: string) => { setSearch(v); resetPage(); };
  const activeFilters = [statusFilter !== "all", categoriaFilter !== "all", fornecedorFilter !== "all", beneficiarioFilter !== "all", formaPagamentoFilter !== "all", !!dateFrom, !!dateTo].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("all"); setCategoriaFilter("all"); setFornecedorFilter("all");
    setBeneficiarioFilter("all"); setFormaPagamentoFilter("all");
    setDateFrom(undefined); setDateTo(undefined); setSearch(""); resetPage();
  };

  const hasAttachments = (c: ContaPagar) => !!(c.arquivo || c.comprovante || c.doc || c.anexos_complementares);

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-destructive font-medium">Erro ao carregar dados</p>
            <p className="text-sm text-muted-foreground">Verifique a conexão com a API</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 hidden sm:flex">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Contas a Pagar</h1>
              <p className="text-xs md:text-sm text-muted-foreground">Gerencie todas as contas e pagamentos</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowReport(true)} className="gap-2 self-start sm:self-auto">
            <Download className="h-4 w-4" /> Relatório
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
            className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-primary/10"><FileText className="h-3.5 w-3.5 text-primary" /></div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Registros</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-info/10"><DollarSign className="h-3.5 w-3.5 text-info" /></div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total</p>
            </div>
            <p className="text-lg md:text-2xl font-bold text-foreground">{fmt(totalValorFiltered)}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-accent/10"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /></div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Pagas</p>
            </div>
            <p className="text-2xl font-bold text-accent">{totalPagas}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-destructive/10"><AlertCircle className="h-3.5 w-3.5 text-destructive" /></div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Vencidas</p>
            </div>
            <p className="text-2xl font-bold text-destructive">{totalVencidas}</p>
          </motion.div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar fornecedor, documento, categoria..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-10 bg-card border-border" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
              <Filter className="h-4 w-4" /> Filtros
              {activeFilters > 0 && (
                <span className="bg-primary-foreground text-primary rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold">{activeFilters}</span>
              )}
            </Button>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground"><X className="h-3 w-3" /> Limpar</Button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="bg-card rounded-xl border border-border p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <FilterSelect label="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); resetPage(); }}
                    options={[{ value: "all", label: "Todos" }, { value: "pago", label: "Pago" }, { value: "pendente", label: "Pendente" }, { value: "aberto", label: "Aberto" }, { value: "vencido", label: "Vencido" }]} />
                  <FilterSelect label="Categoria" value={categoriaFilter} onChange={(v) => { setCategoriaFilter(v); resetPage(); }}
                    options={[{ value: "all", label: "Todas" }, ...uniqueCategorias.map(c => ({ value: c.id, label: c.nome }))]} />
                  <FilterSelect label="Fornecedor" value={fornecedorFilter} onChange={(v) => { setFornecedorFilter(v); resetPage(); }}
                    options={[{ value: "all", label: "Todos" }, ...uniqueFornecedores.map(f => ({ value: f.id, label: f.nome }))]} />
                  <FilterSelect label="Beneficiário" value={beneficiarioFilter} onChange={(v) => { setBeneficiarioFilter(v); resetPage(); }}
                    options={[{ value: "all", label: "Todos" }, ...uniqueBeneficiarios.map(b => ({ value: b.id, label: b.nome }))]} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FilterSelect label="Forma de Pagamento" value={formaPagamentoFilter} onChange={(v) => { setFormaPagamentoFilter(v); resetPage(); }}
                    options={[{ value: "all", label: "Todas" }, ...uniqueFormasPagamento.map(fp => ({ value: fp.id, label: fp.nome }))]} />
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Data Início</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-background", !dateFrom && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />{dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Selecionar"}
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
                          <CalendarIcon className="mr-2 h-4 w-4" />{dateTo ? format(dateTo, "dd/MM/yyyy") : "Selecionar"}
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

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : isMobile ? (
          /* Mobile Card View */
          <div className="space-y-3">
            {paged.length === 0 ? (
              <EmptyState />
            ) : (
              paged.map((conta, i) => (
                <motion.div
                  key={conta._id || conta.uniq_id || conta.id || i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(conta)}
                  className="bg-card rounded-xl border border-border p-4 active:scale-[0.98] transition-transform cursor-pointer hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{getFornecedorNome(conta)}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conta.numero_documento ? `#${conta.numero_documento}` : "Sem documento"}
                        {conta.categoria && ` • ${getCategoriaNome(conta.categoria)}`}
                      </p>
                    </div>
                    <StatusBadge status={conta.status} />
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        <span>Venc: {fmtDate(getVencimento(conta))}</span>
                      </div>
                      {hasAttachments(conta) && (
                        <div className="flex items-center gap-1.5 text-xs text-info">
                          <Paperclip className="h-3 w-3" />
                          <span>Anexos</span>
                        </div>
                      )}
                    </div>
                    <p className="text-lg font-bold text-foreground">{fmt(conta.valor || 0)}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          /* Desktop Table View */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold text-xs">Documento</TableHead>
                  <TableHead className="font-semibold text-xs">Fornecedor</TableHead>
                  <TableHead className="font-semibold text-xs">Categoria</TableHead>
                  <TableHead className="text-right font-semibold text-xs">Valor</TableHead>
                  <TableHead className="font-semibold text-xs">Vencimento</TableHead>
                  <TableHead className="font-semibold text-xs">Status</TableHead>
                  <TableHead className="font-semibold text-xs w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <EmptyState />
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((conta, i) => (
                    <TableRow
                      key={conta._id || conta.uniq_id || conta.id || i}
                      className="cursor-pointer hover:bg-muted/30 transition-colors group"
                      onClick={() => setSelected(conta)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-muted/50 group-hover:bg-primary/10 transition-colors">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <span className="font-medium text-sm">{conta.numero_documento || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{getFornecedorNome(conta)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 text-xs text-muted-foreground">
                          <Tag className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{getCategoriaNome(conta.categoria)}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-sm tabular-nums">{fmt(conta.valor || 0)}</TableCell>
                      <TableCell className="text-sm tabular-nums">{fmtDate(getVencimento(conta))}</TableCell>
                      <TableCell><StatusBadge status={conta.status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {hasAttachments(conta) && (
                            <Tooltip>
                              <TooltipTrigger><Paperclip className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                              <TooltipContent>Tem anexos</TooltipContent>
                            </Tooltip>
                          )}
                          <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </TableCell>
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
            {filtered.length > 0 ? `${((page - 1) * ITEMS_PER_PAGE) + 1}–${Math.min(page * ITEMS_PER_PAGE, filtered.length)} de ${filtered.length}` : "0 registros"}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(1)} disabled={page === 1}><ChevronsLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <Button key={p} variant={p === page ? "default" : "outline"} size="icon" className="h-8 w-8 text-xs" onClick={() => setPage(p)}>{p}</Button>
                );
              })}
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(totalPages)} disabled={page === totalPages}><ChevronsRight className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-br from-primary/8 via-accent/5 to-transparent px-6 pt-6 pb-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-lg">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span>Detalhes da Conta</span>
                  <p className="text-xs font-normal text-muted-foreground mt-0.5">Doc: {selected?.numero_documento || "—"}</p>
                </div>
              </DialogTitle>
              <DialogDescription className="sr-only">Detalhes da conta a pagar</DialogDescription>
            </DialogHeader>
            {selected && (
              <div className="flex items-center gap-3 mt-4">
                <StatusBadge status={selected.status} size="md" />
                <span className="text-2xl font-bold text-foreground">{fmt(selected.valor || 0)}</span>
              </div>
            )}
          </div>
          {selected && (
            <div className="px-6 pb-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
                <DetailSection icon={Building2} title="Informações Gerais">
                  <DetailRow label="Documento" value={selected.numero_documento} />
                  <DetailRow label="Fornecedor" value={getFornecedorNome(selected)} />
                  <DetailRow label="Beneficiário" value={getBeneficiarioNome(selected.beneficiario)} />
                  <DetailRow label="Empresa" value={selected.empresa} />
                </DetailSection>
                <DetailSection icon={Clock} title="Datas">
                  <DetailRow label="Vencimento" value={fmtDate(getVencimento(selected))} />
                  <DetailRow label="Pagamento" value={fmtDate(getPagamento(selected))} />
                  <DetailRow label="Emissão" value={fmtDate(selected.data_da_emissao)} />
                </DetailSection>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DetailSection icon={Tag} title="Classificação">
                  <DetailRow label="Categoria" value={getCategoriaNome(selected.categoria)} />
                </DetailSection>
                <DetailSection icon={DollarSign} title="Financeiro">
                  <DetailRow label="Valor" value={fmt(selected.valor || 0)} highlight />
                  <DetailRow label="Status" value={selected.status} />
                  <DetailRow label="Conta Bancária" value={getContaBancariaNome(selected.conta_bancaria)} />
                  <DetailRow label="Forma Pagamento" value={getFormaPagamentoNome(selected.forma_pagamento)} />
                </DetailSection>
              </div>

              {(selected.valor_com_desconto || selected.valor_total_abastecimento) && (
                <>
                  <Separator />
                  <DetailSection icon={TrendingDown} title="Valores Adicionais">
                    {selected.valor_com_desconto != null && <DetailRow label="Valor com Desconto" value={fmt(selected.valor_com_desconto)} highlight />}
                    {selected.valor_total_abastecimento != null && <DetailRow label="Total Abastecimento" value={fmt(selected.valor_total_abastecimento)} highlight />}
                  </DetailSection>
                </>
              )}

              {selected.ocorrencia && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> Ocorrência</p>
                    <p className="text-sm text-foreground bg-destructive/5 border border-destructive/10 rounded-lg p-3">{selected.ocorrencia}</p>
                  </div>
                </>
              )}

              {(selected.descricao || selected.observacao || selected.notas) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    {selected.descricao && <TextBlock label="Descrição" value={selected.descricao} />}
                    {selected.observacao && <TextBlock label="Observação" value={selected.observacao} />}
                    {selected.notas && <TextBlock label="Notas" value={selected.notas} />}
                  </div>
                </>
              )}

              {hasAttachments(selected) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" /> Anexos</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.arquivo && <AttachmentButton href={selected.arquivo} label="Arquivo" />}
                      {selected.comprovante && <AttachmentButton href={selected.comprovante} label="Comprovante" />}
                      {selected.doc && <AttachmentButton href={selected.doc} label="Documento" />}
                      {selected.anexos_complementares && <AttachmentButton href={selected.anexos_complementares} label="Anexos Complementares" />}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <ReportDialog
        open={showReport} onOpenChange={setShowReport}
        contas={filtered} fornecedorMap={fornecedorMap} categoriaMap={categoriaMap}
        beneficiarioMap={beneficiarioMap} contaBancariaMap={contaBancariaMap} formaPagamentoMap={formaPagamentoMap}
        getFornecedorNome={getFornecedorNome} getCategoriaNome={getCategoriaNome}
        getBeneficiarioNome={getBeneficiarioNome} getContaBancariaNome={getContaBancariaNome} getFormaPagamentoNome={getFormaPagamentoNome}
      />
    </DashboardLayout>
  );
};

/* Sub-components */
function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
        <FileText className="h-7 w-7 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">Nenhuma conta encontrada</p>
      <p className="text-xs text-muted-foreground/70 mt-1">Tente ajustar os filtros</p>
    </div>
  );
}

function DetailSection({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" /> {title}
      </h4>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm text-right truncate max-w-[60%]", highlight ? "font-bold text-foreground" : "text-foreground")}>{value || "—"}</span>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3 leading-relaxed">{value}</p>
    </div>
  );
}

function AttachmentButton({ href, label }: { href: string; label: string }) {
  const url = href.startsWith("//") ? `https:${href}` : href;
  return (
    <Button variant="outline" size="sm" asChild className="gap-2 text-xs">
      <a href={url} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="h-3 w-3" /> {label}
      </a>
    </Button>
  );
}

export default ContasPagar;
