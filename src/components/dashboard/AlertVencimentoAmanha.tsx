import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { ContaPagar } from "@/types/conta";

interface Props {
  contas: ContaPagar[];
  fornecedorMap: Record<string, string>;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function AlertVencimentoAmanha({ contas, fornecedorMap }: Props) {
  const contasAmanha = useMemo(() => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().slice(0, 10);

    return contas.filter((c) => {
      const venc = c.vencimento || c.venciamento;
      if (!venc) return false;
      const vencStr = new Date(venc).toISOString().slice(0, 10);
      return vencStr === amanhaStr && c.status?.toLowerCase() !== "pago";
    });
  }, [contas]);

  if (contasAmanha.length === 0) return null;

  const total = contasAmanha.reduce((s, c) => s + (c.valor || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-destructive/10 p-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-destructive">
            {contasAmanha.length} conta{contasAmanha.length > 1 ? "s" : ""} vence
            {contasAmanha.length > 1 ? "m" : ""} amanhã — {fmt(total)}
          </h3>
          <div className="mt-2 space-y-1.5">
            {contasAmanha.slice(0, 5).map((c, i) => {
              const id = c.fornecedor || c.fornecedor_id || "";
              const nome = fornecedorMap[id] || id || "—";
              return (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-foreground truncate max-w-[60%]">
                    {nome} {c.numero_documento ? `• ${c.numero_documento}` : ""}
                  </span>
                  <span className="text-destructive font-semibold tabular-nums">
                    {fmt(c.valor || 0)}
                  </span>
                </div>
              );
            })}
            {contasAmanha.length > 5 && (
              <p className="text-[10px] text-muted-foreground">
                e mais {contasAmanha.length - 5} conta(s)…
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
