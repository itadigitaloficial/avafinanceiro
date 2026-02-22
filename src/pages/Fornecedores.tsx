import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useFornecedores } from "@/hooks/useFornecedores";
import { Fornecedor } from "@/types/conta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Building2, Mail, Phone, MapPin, Hash, Calendar, User } from "lucide-react";
import { motion } from "framer-motion";

const ITEMS_PER_PAGE = 15;

const fmtDate = (d?: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
};

const Fornecedores = () => {
  const { data: fornecedores, isLoading, error } = useFornecedores();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Fornecedor | null>(null);

  const filtered = useMemo(() => {
    if (!fornecedores) return [];
    let list = [...fornecedores].sort((a, b) => {
      const da = a["Created Date"] || "";
      const db = b["Created Date"] || "";
      return db.localeCompare(da);
    });
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.nome_razao_social?.toLowerCase().includes(q) ||
          f.nome_fantasia?.toLowerCase().includes(q) ||
          f.nome?.toLowerCase().includes(q) ||
          f.cnpj?.toLowerCase().includes(q) ||
          f.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [fornecedores, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const endereco = (f: Fornecedor) =>
    [f.endereco, f.endereco_numero, f.endereco_bairro, f.cidade, f.endereco_uf].filter(Boolean).join(", ");

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <p className="text-destructive font-medium">Erro ao carregar fornecedores</p>
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
          <h1 className="text-2xl font-bold text-foreground">Fornecedores</h1>
          <p className="text-sm text-muted-foreground">Cadastro de fornecedores da empresa</p>
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
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      Nenhum fornecedor encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((f, i) => (
                    <TableRow
                      key={f._id || i}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setSelected(f)}
                    >
                      <TableCell className="font-medium text-sm">{f.nome_razao_social || f.nome || "—"}</TableCell>
                      <TableCell className="text-sm">{f.nome_fantasia || "—"}</TableCell>
                      <TableCell className="text-sm font-mono">{f.cnpj || "—"}</TableCell>
                      <TableCell className="text-sm">{[f.cidade, f.endereco_uf].filter(Boolean).join("/") || "—"}</TableCell>
                      <TableCell className="text-sm">{f.telefone || "—"}</TableCell>
                      <TableCell className="text-sm">{f.email || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </motion.div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{filtered.length} fornecedor(es)</p>
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

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-accent" />
              Detalhes do Fornecedor
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
                <InfoRow icon={Hash} label="CNPJ" value={selected.cnpj} />
                <InfoRow icon={Hash} label="ID" value={selected.ID} />
                <InfoRow icon={Mail} label="E-mail" value={selected.email} />
                <InfoRow icon={Phone} label="Telefone" value={selected.telefone} />
                <InfoRow icon={User} label="Contato" value={selected.contato_nome} />
                <InfoRow icon={Phone} label="Tel. Contato" value={selected.contato_telefone} />
                <InfoRow icon={MapPin} label="Endereço" value={endereco(selected)} />
                <InfoRow icon={Hash} label="CEP" value={selected.endereco_cep} />
                <InfoRow icon={Building2} label="Natureza Jurídica" value={selected.natureza_juridica} />
                <InfoRow icon={Hash} label="Capital Social" value={selected.capital_social} />
                <InfoRow icon={User} label="Cadastrado por" value={selected.cadastrado_por} />
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

export default Fornecedores;
