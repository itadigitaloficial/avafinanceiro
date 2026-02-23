import { useState, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ContaPagar } from "@/types/conta";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Download, FileText, Printer, Sparkles, Loader2, AlertTriangle, FileDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  const [pdfLoading, setPdfLoading] = useState(false);
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
    reportData.forEach((c) => { const s = c.status || "Sem status"; if (!map[s]) map[s] = { count: 0, total: 0 }; map[s].count++; map[s].total += c.valor || 0; });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [reportData]);

  const byCategoria = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    reportData.forEach((c) => { const cat = getCategoriaNome(c.categoria); if (!map[cat]) map[cat] = { count: 0, total: 0 }; map[cat].count++; map[cat].total += c.valor || 0; });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total).slice(0, 10);
  }, [reportData]);

  const byFornecedor = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    reportData.forEach((c) => { const f = getFornecedorNome(c); if (!map[f]) map[f] = { count: 0, total: 0 }; map[f].count++; map[f].total += c.valor || 0; });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total).slice(0, 10);
  }, [reportData]);

  const byFormaPagamento = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    reportData.forEach((c) => { const fp = getFormaPagamentoNome(c.forma_pagamento); if (!map[fp]) map[fp] = { count: 0, total: 0 }; map[fp].count++; map[fp].total += c.valor || 0; });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [reportData]);

  const byContaBancaria = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    reportData.forEach((c) => { const cb = getContaBancariaNome(c.conta_bancaria); if (!map[cb]) map[cb] = { count: 0, total: 0 }; map[cb].count++; map[cb].total += c.valor || 0; });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [reportData]);

  const buildAIContext = () => {
    const summary = {
      total_registros: reportData.length, valor_total: totalReport,
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
    setAiLoading(true); setAiError(""); setAiAnalysis("");
    try {
      const context = buildAIContext();
      const userMessage = aiPrompt.trim() || "Analise os dados financeiros de contas a pagar e gere um relatório inteligente com insights, tendências, alertas e recomendações.";
      const { data: fnData, error: fnError } = await supabase.functions.invoke("deepseek-proxy", {
        body: {
          messages: [
            { role: "system", content: `Você é um analista financeiro especialista em contas a pagar. Analise os dados fornecidos e gere um relatório profissional em português do Brasil com:\n1. Resumo Executivo\n2. Análise de Tendências\n3. Alertas e Riscos\n4. Recomendações\n5. Indicadores-Chave\n\nNão use formatação markdown. Seja objetivo e profissional. Os valores estão em Reais (BRL).` },
            { role: "user", content: `${userMessage}\n\nDados das contas a pagar:\n${context}` }
          ],
          temperature: 0.7, max_tokens: 2000,
        },
      });
      if (fnError) throw new Error(fnError.message || "Erro ao chamar a função de IA");
      setAiAnalysis(fnData?.choices?.[0]?.message?.content || "Nenhuma análise gerada.");
    } catch (err: any) {
      setAiError(err.message || "Erro ao gerar análise com IA");
    } finally {
      setAiLoading(false);
    }
  };

  const handlePDF = async () => {
    if (!reportRef.current) return;
    setPdfLoading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, useCORS: true, backgroundColor: "#ffffff",
        logging: false, windowWidth: 900,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      pdf.save(`relatorio-contas-pagar-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    } finally {
      setPdfLoading(false);
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
        .ai-section { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; margin-top: 16px; white-space: pre-wrap; line-height: 1.6; }
        @media print { body { padding: 20px; } }
      </style></head><body>${reportRef.current.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleCSV = () => {
    const headers = ["Documento", "Fornecedor", "Beneficiário", "Categoria", "Valor", "Vencimento", "Pagamento", "Status", "Forma Pagamento", "Conta Bancária"];
    const rows = reportData.map((c) => [
      c.numero_documento || "", getFornecedorNome(c), getBeneficiarioNome(c.beneficiario),
      getCategoriaNome(c.categoria), String(c.valor || 0), fmtDate(getVencimento(c)),
      fmtDate(getPagamento(c)), c.status || "", getFormaPagamentoNome(c.forma_pagamento), getContaBancariaNome(c.conta_bancaria),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `relatorio-contas-pagar-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const renderTable = (title: string, data: [string, { count: number; total: number }][]) => (
    <div>
      <h2 style={{ fontSize: "14px", fontWeight: 600, marginTop: "20px", marginBottom: "8px", borderBottom: "2px solid #e5e7eb", paddingBottom: "6px" }}>{title}</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
            <th style={{ textAlign: "left", padding: "6px 8px", fontSize: "10px", textTransform: "uppercase", color: "#6b7280", fontWeight: 500 }}>Nome</th>
            <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "10px", textTransform: "uppercase", color: "#6b7280", fontWeight: 500 }}>Qtd</th>
            <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "10px", textTransform: "uppercase", color: "#6b7280", fontWeight: 500 }}>Total</th>
            <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "10px", textTransform: "uppercase", color: "#6b7280", fontWeight: 500 }}>%</th>
          </tr>
        </thead>
        <tbody>
          {data.map(([name, d]) => (
            <tr key={name} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "6px 8px", fontWeight: 500 }}>{name}</td>
              <td style={{ padding: "6px 8px", textAlign: "right" }}>{d.count}</td>
              <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 500 }}>{fmt(d.total)}</td>
              <td style={{ padding: "6px 8px", textAlign: "right" }}>{totalReport ? ((d.total / totalReport) * 100).toFixed(1) : 0}%</td>
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
            <FilterField label="Status" value={reportStatus} onChange={setReportStatus}
              options={[{ value: "all", label: "Todos" }, { value: "pago", label: "Pago" }, { value: "pendente", label: "Pendente" }, { value: "vencido", label: "Vencido" }]} />
            <FilterField label="Categoria" value={reportCategoria} onChange={setReportCategoria}
              options={[{ value: "all", label: "Todas" }, ...uniqueCategorias.map(c => ({ value: c.id, label: c.nome }))]} />
            <FilterField label="Fornecedor" value={reportFornecedor} onChange={setReportFornecedor}
              options={[{ value: "all", label: "Todos" }, ...uniqueFornecedores.map(f => ({ value: f.id, label: f.nome }))]} />
            <FilterField label="Beneficiário" value={reportBeneficiario} onChange={setReportBeneficiario}
              options={[{ value: "all", label: "Todos" }, ...uniqueBeneficiarios.map(b => ({ value: b.id, label: b.nome }))]} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <FilterField label="Forma de Pagamento" value={reportFormaPagamento} onChange={setReportFormaPagamento}
              options={[{ value: "all", label: "Todas" }, ...uniqueFormasPagamento.map(fp => ({ value: fp.id, label: fp.nome }))]} />
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-background", !reportDateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />{reportDateFrom ? format(reportDateFrom, "dd/MM/yyyy") : "Selecionar"}
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
                    <CalendarIcon className="mr-2 h-4 w-4" />{reportDateTo ? format(reportDateTo, "dd/MM/yyyy") : "Selecionar"}
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
                <Button variant="outline" onClick={handlePDF} disabled={pdfLoading} className="gap-2">
                  {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                  {pdfLoading ? "Gerando..." : "Exportar PDF"}
                </Button>
                <Button variant="outline" onClick={handlePrint} className="gap-2">
                  <Printer className="h-4 w-4" /> Imprimir
                </Button>
                <Button variant="outline" onClick={handleCSV} className="gap-2">
                  <Download className="h-4 w-4" /> CSV
                </Button>
              </>
            )}
          </div>
        </div>

        {generated && (
          <div className="px-6 pb-6 space-y-6">
            {/* AI Analysis */}
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-border p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Análise Inteligente com IA
              </h3>
              <p className="text-xs text-muted-foreground">
                Digite uma pergunta ou gere uma análise automática dos dados filtrados.
              </p>
              <Textarea placeholder="Ex: Quais são os maiores riscos financeiros?" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} className="bg-background text-sm" rows={2} />
              <Button onClick={handleAIAnalysis} disabled={aiLoading} className="gap-2">
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {aiLoading ? "Analisando..." : "Gerar Análise com IA"}
              </Button>

              {aiError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-destructive">Erro na análise</p>
                    <p className="text-xs text-muted-foreground mt-1">{aiError}</p>
                  </div>
                </div>
              )}

              {aiAnalysis && (
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                    {aiAnalysis
                      .replace(/#{1,6}\s?/g, '')
                      .replace(/\*\*(.*?)\*\*/g, '$1')
                      .replace(/\*(.*?)\*/g, '$1')
                      .replace(/---+/g, '')
                      .replace(/- /g, '• ')
                      .replace(/\n{3,}/g, '\n\n')
                      .trim()}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Report content for PDF/Print - use inline styles for html2canvas compatibility */}
            <div ref={reportRef} style={{ background: "#ffffff", color: "#1a1a2e", fontFamily: "'Segoe UI', sans-serif", padding: "24px", borderRadius: "8px" }}>
              <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>Relatório de Contas a Pagar</h1>
              <p style={{ color: "#666", fontSize: "11px", marginBottom: "20px" }}>
                Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
                {reportDateFrom && ` • De ${format(reportDateFrom, "dd/MM/yyyy")}`}
                {reportDateTo && ` até ${format(reportDateTo, "dd/MM/yyyy")}`}
                {reportStatus !== "all" && ` • Status: ${reportStatus}`}
                {reportCategoria !== "all" && ` • Categoria: ${getCategoriaNome(reportCategoria)}`}
              </p>

              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
                {[
                  { label: "Total Registros", value: String(reportData.length) },
                  { label: "Valor Total", value: fmt(totalReport) },
                  { label: "Média por Conta", value: fmt(reportData.length ? totalReport / reportData.length : 0) },
                  { label: "Maior Valor", value: fmt(Math.max(...reportData.map(c => c.valor || 0), 0)) },
                ].map((item) => (
                  <div key={item.label} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px" }}>
                    <p style={{ fontSize: "9px", textTransform: "uppercase", color: "#9ca3af", letterSpacing: "0.5px", fontWeight: 500 }}>{item.label}</p>
                    <p style={{ fontSize: "18px", fontWeight: 700, marginTop: "4px" }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {renderTable("Resumo por Status", byStatus)}
              {renderTable("Top 10 Categorias", byCategoria)}
              {renderTable("Top 10 Fornecedores", byFornecedor)}
              {byFormaPagamento.length > 0 && renderTable("Por Forma de Pagamento", byFormaPagamento)}
              {byContaBancaria.length > 0 && renderTable("Por Conta Bancária", byContaBancaria)}

              {/* Detail listing */}
              <div style={{ marginTop: "24px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", borderBottom: "2px solid #e5e7eb", paddingBottom: "6px" }}>
                  Listagem Detalhada ({reportData.length} registros)
                </h2>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                      <th style={{ textAlign: "left", padding: "6px 4px", fontSize: "9px", textTransform: "uppercase", color: "#6b7280" }}>Documento</th>
                      <th style={{ textAlign: "left", padding: "6px 4px", fontSize: "9px", textTransform: "uppercase", color: "#6b7280" }}>Fornecedor</th>
                      <th style={{ textAlign: "left", padding: "6px 4px", fontSize: "9px", textTransform: "uppercase", color: "#6b7280" }}>Categoria</th>
                      <th style={{ textAlign: "right", padding: "6px 4px", fontSize: "9px", textTransform: "uppercase", color: "#6b7280" }}>Valor</th>
                      <th style={{ textAlign: "left", padding: "6px 4px", fontSize: "9px", textTransform: "uppercase", color: "#6b7280" }}>Vencimento</th>
                      <th style={{ textAlign: "left", padding: "6px 4px", fontSize: "9px", textTransform: "uppercase", color: "#6b7280" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.slice(0, 100).map((c, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "4px" }}>{c.numero_documento || "—"}</td>
                        <td style={{ padding: "4px", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getFornecedorNome(c)}</td>
                        <td style={{ padding: "4px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getCategoriaNome(c.categoria)}</td>
                        <td style={{ padding: "4px", textAlign: "right", fontWeight: 500 }}>{fmt(c.valor || 0)}</td>
                        <td style={{ padding: "4px" }}>{fmtDate(getVencimento(c))}</td>
                        <td style={{ padding: "4px" }}>{c.status || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "2px solid #e5e7eb", fontWeight: 700 }}>
                      <td colSpan={3} style={{ padding: "6px 4px" }}>TOTAL</td>
                      <td style={{ padding: "6px 4px", textAlign: "right" }}>{fmt(totalReport)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
                {reportData.length > 100 && (
                  <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "8px" }}>Exibindo os primeiros 100 registros. Exporte o CSV para ver todos.</p>
                )}
              </div>

              {aiAnalysis && (
                <div style={{ marginTop: "24px" }}>
                  <h2 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px", borderBottom: "2px solid #e5e7eb", paddingBottom: "6px" }}>Análise Inteligente (IA)</h2>
                  <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", whiteSpace: "pre-wrap", fontSize: "12px", lineHeight: 1.6 }}>
                    {aiAnalysis
                      .replace(/#{1,6}\s?/g, '')
                      .replace(/\*\*(.*?)\*\*/g, '$1')
                      .replace(/\*(.*?)\*/g, '$1')
                      .replace(/---+/g, '')
                      .replace(/- /g, '• ')
                      .replace(/\n{3,}/g, '\n\n')
                      .trim()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FilterField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
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
