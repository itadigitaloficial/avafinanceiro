import { useState, useMemo, useRef } from "react";
import { ContaPagar } from "@/types/conta";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Download, FileText, Printer, Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contas: ContaPagar[];
  fornecedorMap: Record<string, string>;
  categoriaMap: Record<string, string>;
  beneficiarioMap?: Record<string, string>;
  contaBancariaMap?: Record<string, string>;
  formaPagamentoMap?: Record<string, string>;
  getFornecedorNome: (conta: ContaPagar) => string;
  getCategoriaNome: (id?: string) => string;
  getBeneficiarioNome?: (id?: string) => string;
  getContaBancariaNome?: (id?: string) => string;
  getFormaPagamentoNome?: (id?: string) => string;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (d?: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
};

const getVencimento = (c: ContaPagar) => c.vencimento || c.venciamento;
const getPagamento = (c: ContaPagar) => c.data_pagamento || c.data_do_pagamento;

export function ReportDialog({
  open, onOpenChange, contas, fornecedorMap, categoriaMap,
  beneficiarioMap = {}, contaBancariaMap = {}, formaPagamentoMap = {},
  getFornecedorNome, getCategoriaNome,
  getBeneficiarioNome = (id) => (id ? beneficiarioMap[id] || id : "—"),
  getContaBancariaNome = (id) => (id ? contaBancariaMap[id] || id : "—"),
  getFormaPagamentoNome = (id) => (id ? formaPagamentoMap[id] || id : "—"),
}: ReportDialogProps) {
  const [reportStatus, setReportStatus] = useState("all");
  const [reportCategoria, setReportCategoria] = useState("all");
  const [reportFornecedor, setReportFornecedor] = useState("all");
  const [reportBeneficiario, setReportBeneficiario] = useState("all");
  const [reportFormaPagamento, setReportFormaPagamento] = useState("all");
  const [reportDateFrom, setReportDateFrom] = useState<Date | undefined>();
  const [reportDateTo, setReportDateTo] = useState<Date | undefined>();
  const [generated, setGenerated] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const reportRef = useRef<HTMLDivElement>(null);

  const uniqueCategorias = useMemo(() => {
    const ids = new Set<string>();
    contas.forEach((c) => { if (c.categoria) ids.add(c.categoria); });
    return Array.from(ids).map((id) => ({ id, nome: categoriaMap[id] || id })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [contas, categoriaMap]);

  const uniqueFornecedores = useMemo(() => {
    const ids = new Set<string>();
    contas.forEach((c) => { const id = c.fornecedor || c.fornecedor_id; if (id) ids.add(id); });
    return Array.from(ids).map((id) => ({ id, nome: fornecedorMap[id] || id })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [contas, fornecedorMap]);

  const uniqueBeneficiarios = useMemo(() => {
    const ids = new Set<string>();
    contas.forEach((c) => { if (c.beneficiario) ids.add(c.beneficiario); });
    return Array.from(ids).map((id) => ({ id, nome: beneficiarioMap[id] || id })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [contas, beneficiarioMap]);

  const uniqueFormasPagamento = useMemo(() => {
    const ids = new Set<string>();
    contas.forEach((c) => { if (c.forma_pagamento) ids.add(c.forma_pagamento); });
    return Array.from(ids).map((id) => ({ id, nome: formaPagamentoMap[id] || id })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [contas, formaPagamentoMap]);

  const reportData = useMemo(() => {
    let list = [...contas];
    if (reportStatus !== "all") list = list.filter((c) => c.status?.toLowerCase() === reportStatus);
    if (reportCategoria !== "all") list = list.filter((c) => c.categoria === reportCategoria);
    if (reportFornecedor !== "all") list = list.filter((c) => (c.fornecedor || c.fornecedor_id) === reportFornecedor);
    if (reportBeneficiario !== "all") list = list.filter((c) => c.beneficiario === reportBeneficiario);
    if (reportFormaPagamento !== "all") list = list.filter((c) => c.forma_pagamento === reportFormaPagamento);
    if (reportDateFrom) list = list.filter((c) => { const d = getVencimento(c) || getPagamento(c); return d && new Date(d) >= reportDateFrom; });
    if (reportDateTo) list = list.filter((c) => { const d = getVencimento(c) || getPagamento(c); return d && new Date(d) <= reportDateTo; });
    return list;
  }, [contas, reportStatus, reportCategoria, reportFornecedor, reportBeneficiario, reportFormaPagamento, reportDateFrom, reportDateTo]);

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

  const byFormaPagamento = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    reportData.forEach((c) => {
      const fp = getFormaPagamentoNome(c.forma_pagamento);
      if (!map[fp]) map[fp] = { count: 0, total: 0 };
      map[fp].count++;
      map[fp].total += c.valor || 0;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [reportData]);

  const byContaBancaria = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    reportData.forEach((c) => {
      const cb = getContaBancariaNome(c.conta_bancaria);
      if (!map[cb]) map[cb] = { count: 0, total: 0 };
      map[cb].count++;
      map[cb].total += c.valor || 0;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [reportData]);

  const buildAIContext = () => {
    const summary = {
      total_registros: reportData.length,
      valor_total: totalReport,
      media: reportData.length ? totalReport / reportData.length : 0,
      maior_valor: Math.max(...reportData.map(c => c.valor || 0), 0),
      por_status: byStatus.map(([s, d]) => ({ status: s, qtd: d.count, total: d.total })),
      top_categorias: byCategoria.map(([c, d]) => ({ categoria: c, qtd: d.count, total: d.total })),
      top_fornecedores: byFornecedor.map(([f, d]) => ({ fornecedor: f, qtd: d.count, total: d.total })),
      por_forma_pagamento: byFormaPagamento.map(([fp, d]) => ({ forma: fp, qtd: d.count, total: d.total })),
      por_conta_bancaria: byContaBancaria.map(([cb, d]) => ({ conta: cb, qtd: d.count, total: d.total })),
      filtros_aplicados: {
        status: reportStatus !== "all" ? reportStatus : "todos",
        categoria: reportCategoria !== "all" ? getCategoriaNome(reportCategoria) : "todas",
        periodo_inicio: reportDateFrom ? format(reportDateFrom, "dd/MM/yyyy") : null,
        periodo_fim: reportDateTo ? format(reportDateTo, "dd/MM/yyyy") : null,
      },
    };
    return JSON.stringify(summary, null, 2);
  };

  const handleAIAnalysis = async () => {
    setAiLoading(true);
    setAiError("");
    setAiAnalysis("");
    try {
      const context = buildAIContext();
      const userMessage = aiPrompt.trim() || "Analise os dados financeiros de contas a pagar e gere um relatório inteligente com insights, tendências, alertas e recomendações.";

      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(window as any).__DEEPSEEK_API_KEY || ""}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `Você é um analista financeiro especialista em contas a pagar. Analise os dados fornecidos e gere um relatório profissional em português do Brasil com:
1. **Resumo Executivo**: Visão geral da situação financeira
2. **Análise de Tendências**: Padrões identificados nos pagamentos
3. **Alertas e Riscos**: Contas vencidas, concentração de fornecedores, etc.
4. **Recomendações**: Ações sugeridas para otimização
5. **Indicadores-Chave**: Métricas importantes

Use formatação markdown. Seja objetivo e profissional. Os valores estão em Reais (BRL).`
            },
            {
              role: "user",
              content: `${userMessage}\n\nDados das contas a pagar:\n${context}`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro na API (${response.status}): ${errText}`);
      }

      const data = await response.json();
      setAiAnalysis(data.choices?.[0]?.message?.content || "Nenhuma análise gerada.");
    } catch (err: any) {
      setAiError(err.message || "Erro ao gerar análise com IA");
    } finally {
      setAiLoading(false);
    }
  };

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
        .ai-analysis { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-top: 16px; white-space: pre-wrap; line-height: 1.6; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${reportRef.current.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleCSV = () => {
    const headers = ["Documento", "Fornecedor", "Beneficiário", "Categoria", "Valor", "Vencimento", "Pagamento", "Status", "Forma Pagamento", "Conta Bancária"];
    const rows = reportData.map((c) => [
      c.numero_documento || "",
      getFornecedorNome(c),
      getBeneficiarioNome(c.beneficiario),
      getCategoriaNome(c.categoria),
      String(c.valor || 0),
      fmtDate(getVencimento(c)),
      fmtDate(getPagamento(c)),
      c.status || "",
      getFormaPagamentoNome(c.forma_pagamento),
      getContaBancariaNome(c.conta_bancaria),
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

  const renderTable = (title: string, data: [string, { count: number; total: number }][]) => (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">{title}</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 text-xs text-muted-foreground font-medium uppercase">Nome</th>
            <th className="text-right py-2 text-xs text-muted-foreground font-medium uppercase">Qtd</th>
            <th className="text-right py-2 text-xs text-muted-foreground font-medium uppercase">Total</th>
            <th className="text-right py-2 text-xs text-muted-foreground font-medium uppercase">%</th>
          </tr>
        </thead>
        <tbody>
          {data.map(([name, d]) => (
            <tr key={name} className="border-b border-border/50">
              <td className="py-2 font-medium max-w-[200px] truncate">{name}</td>
              <td className="py-2 text-right tabular-nums">{d.count}</td>
              <td className="py-2 text-right tabular-nums font-medium">{fmt(d.total)}</td>
              <td className="py-2 text-right tabular-nums">{totalReport ? ((d.total / totalReport) * 100).toFixed(1) : 0}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <div className="px-6 pt-6 pb-4 border-b border-border sticky top-0 bg-card z-10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Gerar Relatório
            </DialogTitle>
            <DialogDescription>Configure os filtros e gere um relatório detalhado — com análise por IA</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
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
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Categoria</label>
              <Select value={reportCategoria} onValueChange={setReportCategoria}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueCategorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Fornecedor</label>
              <Select value={reportFornecedor} onValueChange={setReportFornecedor}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueFornecedores.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Beneficiário</label>
              <Select value={reportBeneficiario} onValueChange={setReportBeneficiario}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueBeneficiarios.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Forma de Pagamento</label>
              <Select value={reportFormaPagamento} onValueChange={setReportFormaPagamento}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueFormasPagamento.map((fp) => <SelectItem key={fp.id} value={fp.id}>{fp.nome}</SelectItem>)}
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

          <div className="flex flex-wrap items-center gap-2 mt-4">
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
          <div className="px-6 pb-6 space-y-6">
            {/* AI Analysis Section */}
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-border p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Análise Inteligente com IA (DeepSeek)
              </h3>
              <p className="text-xs text-muted-foreground">
                Digite uma pergunta ou instrução personalizada, ou clique para gerar uma análise automática dos dados filtrados.
              </p>
              <Textarea
                placeholder="Ex: Quais são os maiores riscos financeiros? / Faça uma análise de concentração por fornecedor / Sugira otimizações de fluxo de caixa..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="bg-background text-sm"
                rows={2}
              />
              <Button
                onClick={handleAIAnalysis}
                disabled={aiLoading}
                className="gap-2"
                variant="default"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {aiLoading ? "Analisando..." : "Gerar Análise com IA"}
              </Button>

              {aiError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-destructive">Erro na análise</p>
                    <p className="text-xs text-muted-foreground mt-1">{aiError}</p>
                    <p className="text-xs text-muted-foreground mt-1">Certifique-se de configurar a API Key do DeepSeek no código.</p>
                  </div>
                </div>
              )}

              {aiAnalysis && (
                <div className="ai-analysis bg-card border border-border rounded-lg p-4 prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed" dangerouslySetInnerHTML={{
                    __html: aiAnalysis
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>')
                      .replace(/#{3}\s?(.*?)(<br\/>)/g, '<h3 class="text-sm font-bold mt-3 mb-1">$1</h3>')
                      .replace(/#{2}\s?(.*?)(<br\/>)/g, '<h2 class="text-base font-bold mt-4 mb-1">$1</h2>')
                      .replace(/#{1}\s?(.*?)(<br\/>)/g, '<h1 class="text-lg font-bold mt-4 mb-2">$1</h1>')
                  }} />
                </div>
              )}
            </div>

            <Separator />

            <div ref={reportRef}>
              {/* Report header */}
              <div>
                <h1 className="text-lg font-bold text-foreground">Relatório de Contas a Pagar</h1>
                <p className="subtitle text-xs text-muted-foreground">
                  Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
                  {reportDateFrom && ` • De ${format(reportDateFrom, "dd/MM/yyyy")}`}
                  {reportDateTo && ` até ${format(reportDateTo, "dd/MM/yyyy")}`}
                  {reportStatus !== "all" && ` • Status: ${reportStatus}`}
                  {reportCategoria !== "all" && ` • Categoria: ${getCategoriaNome(reportCategoria)}`}
                </p>
              </div>

              {/* Summary */}
              <div className="summary-grid grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
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

              {/* Tables */}
              <div className="space-y-6 mt-6">
                {renderTable("Resumo por Status", byStatus)}
                {renderTable("Top 10 Categorias", byCategoria)}
                {renderTable("Top 10 Fornecedores", byFornecedor)}
                {byFormaPagamento.length > 0 && renderTable("Por Forma de Pagamento", byFormaPagamento)}
                {byContaBancaria.length > 0 && renderTable("Por Conta Bancária", byContaBancaria)}
              </div>

              {/* Detail listing */}
              <div className="mt-6">
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
                          <td className="py-1.5 tabular-nums">{fmtDate(getVencimento(c))}</td>
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

              {/* AI analysis for print */}
              {aiAnalysis && (
                <div className="mt-6">
                  <h2 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">Análise Inteligente (IA)</h2>
                  <div className="ai-analysis bg-muted/30 rounded-lg p-4 text-sm whitespace-pre-wrap">{aiAnalysis}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
