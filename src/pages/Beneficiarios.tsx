import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useBeneficiarios } from "@/hooks/useBeneficiarios";
import { Beneficiario } from "@/types/conta";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Mail, Phone, Hash, Calendar, Landmark } from "lucide-react";
import { motion } from "framer-motion";

const ITEMS_PER_PAGE = 15;

const fmtDate = (d?: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
};

const Beneficiarios = () => {
  const { data: beneficiarios, isLoading, error } = useBeneficiarios();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Beneficiario | null>(null);

  const filtered = useMemo(() => {
    if (!beneficiarios) return [];
    let list = [...beneficiarios].sort((a, b) => {
      const da = a["Created Date"] || "";
      const db = b["Created Date"] || "";
      return db.localeCompare(da);
    });
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.nome_razao_social?.toLowerCase().includes(q) ||
          b.nome_fantasia?.toLowerCase().includes(q) ||
          b.nome?.toLowerCase().includes(q) ||
          b.cnpj?.toLowerCase().includes(q) ||
          b.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [beneficiarios, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <p className="text-destructive font-medium">Erro ao carregar beneficiários</p>
            <p className="text-sm text-muted-foreground">O endpoint de beneficiários pode não estar ativo no momento</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Beneficiários</h1>
          <p className="text-sm text-muted-foreground">Cadastro de beneficiários da empresa</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ, e-mail..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 bg-card"
            />
          </div>
        </div>

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
                  <TableHead>Razão Social</TableHead>
                  <TableHead>Nome Fantasia</TableHead>
                  <TableHead>CNPJ/Documento</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>PIX</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Nenhum beneficiário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((b, i) => (
                    <TableRow
                      key={b._id || i}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setSelected(b)}
                    >
                      <TableCell className="font-medium text-sm">{b.nome_razao_social || b.nome || "—"}</TableCell>
                      <TableCell className="text-sm">{b.nome_fantasia || "—"}</TableCell>
                      <TableCell className="text-sm font-mono">{b.cnpj || b.documento || "—"}</TableCell>
                      <TableCell className="text-sm">{b.telefone || "—"}</TableCell>
                      <TableCell className="text-sm">{b.email || "—"}</TableCell>
                      <TableCell className="text-sm">{b.pix || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{filtered.length} beneficiário(s)</p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 transition-colors"
              >
                Anterior
              </button>
              <span className="text-xs text-muted-foreground">
                {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 transition-colors"
              >
                Próximo
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Detalhes do Beneficiário
            </DialogTitle>
            <DialogDescription>Informações completas do cadastro</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="pb-2 border-b border-border">
                <p className="text-lg font-semibold text-foreground">{selected.nome_razao_social || selected.nome}</p>
                {selected.nome_fantasia && (
                  <p className="text-sm text-muted-foreground">{selected.nome_fantasia}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoRow icon={Hash} label="CNPJ/Doc" value={selected.cnpj || selected.documento} />
                <InfoRow icon={Mail} label="E-mail" value={selected.email} />
                <InfoRow icon={Phone} label="Telefone" value={selected.telefone} />
                <InfoRow icon={Landmark} label="Banco" value={selected.banco} />
                <InfoRow icon={Hash} label="Agência" value={selected.agencia} />
                <InfoRow icon={Hash} label="Conta" value={selected.conta} />
                <InfoRow icon={Hash} label="Tipo Conta" value={selected.tipo_conta} />
                <InfoRow icon={Hash} label="PIX" value={selected.pix} />
                <InfoRow icon={Calendar} label="Cadastro" value={fmtDate(selected["Created Date"])} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) {
  if (!value || value.trim() === "") return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default Beneficiarios;
