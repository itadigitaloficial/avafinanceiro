import { useState, useMemo, useRef } from "react";
import { ContaPagar } from "@/types/conta";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Download, FileText, Printer } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contas: ContaPagar[];
  fornecedorMap: Record<string, string>;
  categoriaMap: Record<string, string>;
  getFornecedorNome: (conta: ContaPagar) => string;
  getCategoriaNome: (id?: string) => string;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d?: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
};

export function ReportDialog({ open, onOpenChange, contas, fornecedorMap, categoriaMap, getFornecedorNome, getCategoriaNome }: ReportDialogProps) {
  const [reportStatus, setReportStatus] = useState("all");
  const [reportDateFrom, setReportDateFrom] = useState<Date | undefined>();
  const [reportDateTo, setReportDateTo] = useState<Date | undefined>();
  const [generated, setGenerated] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const reportData = useMemo(() => {
    let list = [...contas];
    if (reportStatus !== "all") list = list.filter((c) => c.status?.toLowerCase() === reportStatus);
    if (reportDateFrom) list = list.filter((c) => { const d = c.vencimento || c.data_pagamento; return d && new Date(d) >= reportDateFrom; });
    if (reportDateTo) list = list.filter((c) => { const d = c.vencimento || c.data_pagamento; return d && new Date(d) <= reportDateTo; });
    return list;
  }, [contas, reportStatus, reportDateFrom, reportDateTo]);

  const totalReport = useMemo(() => reportData.reduce((s, c) => s + (c.valor || 0), 0), [reportData]);

  const byStatus = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    reportData.forEach((c) => {
      const s = c.status || "Sem status";
      if (!map[s]) map[s] = { count: 0, total: 0 };
      map[s].count++;
      map[s].total += c.valor || 0;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [reportData]);

  const byCategoria = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    reportData.forEach((c) => {
      const cat = getCategoriaNome(c.categoria);
      if (!map[cat]) map[cat] = { count: 0, total: 0 };
      map[cat].count++;
      map[cat].total += c.valor || 0;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total).slice(0, 10);
  }, [reportData]);

  const byFornecedor = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    reportData.forEach((c) => {
      const f = getFornecedorNome(c);
      if (!map[f]) map[f] = { count: 0, total: 0 };
      map[f].count++;
      map[f].total += c.valor || 0;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total).slice(0, 10);
  }, [reportData]);

  const handlePrint = () => {
    if (!reportRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Relatório Contas a Pagar</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a2e; font-size: 12px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        h2 { font-size: 14px; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #e0e0e0; padding-bottom: 4px; }
        .subtitle { color: #666; font-size: 11px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #f5f5f5; padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #ddd; }
        td { padding: 5px 8px; border-bottom: 1px solid #eee; }
        .right { text-align: right; }
        .bold { font-weight: 700; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .summary-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px; }
        .summary-label { font-size: 9px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
        .summary-value { font-size: 18px; font-weight: 700; margin-top: 4px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${reportRef.current.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleCSV = () => {
    const headers = ["Documento", "Fornecedor", "Categoria", "Valor", "Vencimento", "Pagamento", "Status"];
    const rows = reportData.map((c) => [
      c.numero_documento || "",
      getFornecedorNome(c),
      getCategoriaNome(c.categoria),
      String(c.valor || 0),
      fmtDate(c.vencimento),
      fmtDate(c.data_pagamento),
      c.status || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-contas-pagar-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-card z-10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Gerar Relatório
            </DialogTitle>
            <DialogDescription>Configure os filtros e gere um relatório detalhado</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Status</label>
              <Select value={reportStatus} onValueChange={setReportStatus}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-background", !reportDateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reportDateFrom ? format(reportDateFrom, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={reportDateFrom} onSelect={setReportDateFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-background", !reportDateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reportDateTo ? format(reportDateTo, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={reportDateTo} onSelect={setReportDateTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button onClick={() => setGenerated(true)} className="gap-2">
              <FileText className="h-4 w-4" /> Gerar Relatório
            </Button>
            {generated && (
              <>
                <Button variant="outline" onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
                <Button variant="outline" onClick={handleCSV} className="gap-2">
                  <Download className="h-4 w-4" /> Exportar CSV
                </Button>
              </>
            )}
          </div>
        </div>

        {generated && (
          <div ref={reportRef} className="px-6 pb-6 space-y-6">
            {/* Report header */}
            <div>
              <h1 className="text-lg font-bold text-foreground">Relatório de Contas a Pagar</h1>
              <p className="subtitle text-xs text-muted-foreground">
                Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
                {reportDateFrom && ` • De ${format(reportDateFrom, "dd/MM/yyyy")}`}
                {reportDateTo && ` até ${format(reportDateTo, "dd/MM/yyyy")}`}
                {reportStatus !== "all" && ` • Status: ${reportStatus}`}
              </p>
            </div>

            {/* Summary */}
            <div className="summary-grid grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="summary-card bg-muted/50 rounded-xl p-4 border border-border">
                <p className="summary-label text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total Registros</p>
                <p className="summary-value text-xl font-bold text-foreground mt-1">{reportData.length}</p>
              </div>
              <div className="summary-card bg-muted/50 rounded-xl p-4 border border-border">
                <p className="summary-label text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Valor Total</p>
                <p className="summary-value text-xl font-bold text-foreground mt-1">{fmt(totalReport)}</p>
              </div>
              <div className="summary-card bg-muted/50 rounded-xl p-4 border border-border">
                <p className="summary-label text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Média por Conta</p>
                <p className="summary-value text-xl font-bold text-foreground mt-1">{fmt(reportData.length ? totalReport / reportData.length : 0)}</p>
              </div>
              <div className="summary-card bg-muted/50 rounded-xl p-4 border border-border">
                <p className="summary-label text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Maior Valor</p>
                <p className="summary-value text-xl font-bold text-foreground mt-1">{fmt(Math.max(...reportData.map(c => c.valor || 0), 0))}</p>
              </div>
            </div>

            {/* By status */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">Resumo por Status</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium uppercase">Status</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium uppercase">Qtd</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium uppercase">Total</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium uppercase">%</th>
                  </tr>
                </thead>
                <tbody>
                  {byStatus.map(([status, data]) => (
                    <tr key={status} className="border-b border-border/50">
                      <td className="py-2 font-medium">{status}</td>
                      <td className="py-2 text-right tabular-nums">{data.count}</td>
                      <td className="py-2 text-right tabular-nums font-medium">{fmt(data.total)}</td>
                      <td className="py-2 text-right tabular-nums">{totalReport ? ((data.total / totalReport) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top categories */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">Top 10 Categorias</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium uppercase">Categoria</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium uppercase">Qtd</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium uppercase">Total</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium uppercase">%</th>
                  </tr>
                </thead>
                <tbody>
                  {byCategoria.map(([cat, data]) => (
                    <tr key={cat} className="border-b border-border/50">
                      <td className="py-2 font-medium max-w-[200px] truncate">{cat}</td>
                      <td className="py-2 text-right tabular-nums">{data.count}</td>
                      <td className="py-2 text-right tabular-nums font-medium">{fmt(data.total)}</td>
                      <td className="py-2 text-right tabular-nums">{totalReport ? ((data.total / totalReport) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top fornecedores */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">Top 10 Fornecedores</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-xs text-muted-foreground font-medium uppercase">Fornecedor</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium uppercase">Qtd</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium uppercase">Total</th>
                    <th className="text-right py-2 text-xs text-muted-foreground font-medium uppercase">%</th>
                  </tr>
                </thead>
                <tbody>
                  {byFornecedor.map(([forn, data]) => (
                    <tr key={forn} className="border-b border-border/50">
                      <td className="py-2 font-medium max-w-[200px] truncate">{forn}</td>
                      <td className="py-2 text-right tabular-nums">{data.count}</td>
                      <td className="py-2 text-right tabular-nums font-medium">{fmt(data.total)}</td>
                      <td className="py-2 text-right tabular-nums">{totalReport ? ((data.total / totalReport) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Detail listing */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">Listagem Detalhada ({reportData.length} registros)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium uppercase text-muted-foreground">Documento</th>
                      <th className="text-left py-2 font-medium uppercase text-muted-foreground">Fornecedor</th>
                      <th className="text-left py-2 font-medium uppercase text-muted-foreground">Categoria</th>
                      <th className="text-right py-2 font-medium uppercase text-muted-foreground">Valor</th>
                      <th className="text-left py-2 font-medium uppercase text-muted-foreground">Vencimento</th>
                      <th className="text-left py-2 font-medium uppercase text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.slice(0, 100).map((c, i) => (
                      <tr key={i} className="border-b border-border/30">
                        <td className="py-1.5">{c.numero_documento || "—"}</td>
                        <td className="py-1.5 max-w-[150px] truncate">{getFornecedorNome(c)}</td>
                        <td className="py-1.5 max-w-[120px] truncate">{getCategoriaNome(c.categoria)}</td>
                        <td className="py-1.5 text-right tabular-nums font-medium">{fmt(c.valor || 0)}</td>
                        <td className="py-1.5 tabular-nums">{fmtDate(c.vencimento)}</td>
                        <td className="py-1.5">{c.status || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border font-bold">
                      <td colSpan={3} className="py-2">TOTAL</td>
                      <td className="py-2 text-right tabular-nums">{fmt(totalReport)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
                {reportData.length > 100 && (
                  <p className="text-xs text-muted-foreground mt-2">Exibindo os primeiros 100 registros. Exporte o CSV para ver todos.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
