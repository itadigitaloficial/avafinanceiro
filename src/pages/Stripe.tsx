import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, Users, Package, Link2, FileText, Settings, Key,
  Plus, ExternalLink, Mail, Phone, Search, RefreshCw, Copy, Check,
  DollarSign, ArrowRight, Eye, EyeOff, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useStripeKeys, useSaveStripeKeys, useStripeCustomers, useStripeProducts,
  useStripeInvoices, useStripePaymentLinks, useStripeAction
} from "@/hooks/useStripe";

export default function StripePage() {
  const { user } = useAuth();
  const { data: keysData, isLoading: keysLoading, empresaId, hasKeys } = useStripeKeys();

  if (keysLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasKeys) {
    return (
      <DashboardLayout>
        <StripeSetup empresaId={empresaId} userName={user?.nome || ""} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <StripeDashboard empresaId={empresaId!} userName={user?.nome || ""} />
    </DashboardLayout>
  );
}

function StripeSetup({ empresaId, userName }: { empresaId?: string; userName: string }) {
  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const saveMutation = useSaveStripeKeys();

  const handleSave = () => {
    if (!empresaId) return toast({ title: "Empresa não encontrada", variant: "destructive" });
    if (!publishableKey || !secretKey) return toast({ title: "Preencha ambas as chaves", variant: "destructive" });
    saveMutation.mutate({
      empresaId, publishableKey, secretKey, createdBy: userName,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto mt-12">
      <Card className="border-0 shadow-xl bg-card">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#635bff] to-[#7c3aed] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Conectar ao Stripe</CardTitle>
          <CardDescription>
            Configure suas chaves de API do Stripe para começar a gerenciar pagamentos.
            Todos os usuários da sua empresa terão acesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="pk">Chave Publicável (pk_...)</Label>
            <Input id="pk" placeholder="pk_live_..." value={publishableKey} onChange={(e) => setPublishableKey(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sk">Chave Secreta (sk_...)</Label>
            <div className="relative">
              <Input
                id="sk" type={showSecret ? "text" : "password"} placeholder="sk_live_..."
                value={secretKey} onChange={(e) => setSecretKey(e.target.value)}
              />
              <button type="button" onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button className="w-full" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
            Salvar e Conectar
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Encontre suas chaves em{" "}
            <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener"
              className="text-primary underline">dashboard.stripe.com/apikeys</a>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StripeDashboard({ empresaId, userName }: { empresaId: string; userName: string }) {
  const [activeTab, setActiveTab] = useState("customers");
  const customers = useStripeCustomers(empresaId);
  const products = useStripeProducts(empresaId);
  const invoices = useStripeInvoices(empresaId);
  const paymentLinks = useStripePaymentLinks(empresaId);
  const stripeAction = useStripeAction(empresaId);

  const stats = [
    { label: "Clientes", value: customers.data?.data?.length || 0, icon: Users, color: "text-blue-500" },
    { label: "Produtos", value: products.data?.data?.length || 0, icon: Package, color: "text-green-500" },
    { label: "Cobranças", value: invoices.data?.data?.length || 0, icon: FileText, color: "text-amber-500" },
    { label: "Links", value: paymentLinks.data?.data?.length || 0, icon: Link2, color: "text-purple-500" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stripe</h1>
          <p className="text-sm text-muted-foreground">Gerencie pagamentos, clientes e produtos</p>
        </div>
        <Badge variant="outline" className="gap-1.5 py-1.5 px-3 border-green-500/30 text-green-600 dark:text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Conectado
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-0 shadow-sm bg-card">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="customers" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Clientes</TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5"><Package className="h-3.5 w-3.5" /> Produtos</TabsTrigger>
          <TabsTrigger value="links" className="gap-1.5"><Link2 className="h-3.5 w-3.5" /> Links</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Cobranças</TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <CustomersTab data={customers.data?.data || []} isLoading={customers.isLoading} stripeAction={stripeAction} />
        </TabsContent>
        <TabsContent value="products">
          <ProductsTab data={products.data?.data || []} isLoading={products.isLoading} stripeAction={stripeAction} />
        </TabsContent>
        <TabsContent value="links">
          <PaymentLinksTab data={paymentLinks.data?.data || []} isLoading={paymentLinks.isLoading} products={products.data?.data || []} stripeAction={stripeAction} />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesTab data={invoices.data?.data || []} isLoading={invoices.isLoading} customers={customers.data?.data || []} stripeAction={stripeAction} />
        </TabsContent>
      </Tabs>

      {/* Settings */}
      <Card className="border-0 shadow-sm bg-card">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Configurações do Stripe</p>
              <p className="text-xs text-muted-foreground">Atualizar chaves de API</p>
            </div>
          </div>
          <UpdateKeysDialog empresaId={empresaId} userName={userName} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Customers Tab ---
function CustomersTab({ data, isLoading, stripeAction }: { data: any[]; isLoading: boolean; stripeAction: Function }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.name) return toast({ title: "Nome é obrigatório", variant: "destructive" });
    setLoading(true);
    try {
      await stripeAction("create_customer", form);
      toast({ title: "Cliente criado com sucesso!" });
      setOpen(false);
      setForm({ name: "", email: "", phone: "" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Clientes</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Criar Cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum cliente encontrado</p>
        ) : (
          <div className="space-y-2">
            {data.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {(c.name || c.email || "?")[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name || "Sem nome"}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                    {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">{c.id.slice(-8)}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Products Tab ---
function ProductsTab({ data, isLoading, stripeAction }: { data: any[]; isLoading: boolean; stripeAction: Function }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "" });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.name) return toast({ title: "Nome é obrigatório", variant: "destructive" });
    setLoading(true);
    try {
      await stripeAction("create_product", {
        name: form.name,
        description: form.description,
        price: form.price ? parseFloat(form.price) : undefined,
      });
      toast({ title: "Produto criado com sucesso!" });
      setOpen(false);
      setForm({ name: "", description: "", price: "" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Produtos</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Produto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Produto</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Criar Produto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum produto encontrado</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.map((p: any) => (
              <div key={p.id} className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Ativo" : "Inativo"}</Badge>
                </div>
                {p.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{p.description}</p>}
                {p.default_price && (
                  <p className="text-lg font-bold text-foreground">
                    {(p.default_price.unit_amount / 100).toLocaleString("pt-BR", { style: "currency", currency: p.default_price.currency?.toUpperCase() || "BRL" })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Payment Links Tab ---
function PaymentLinksTab({ data, isLoading, products, stripeAction }: { data: any[]; isLoading: boolean; products: any[]; stripeAction: Function }) {
  const [open, setOpen] = useState(false);
  const [priceId, setPriceId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const productsWithPrice = products.filter((p: any) => p.default_price);

  const handleCreate = async () => {
    if (!priceId) return toast({ title: "Selecione um produto", variant: "destructive" });
    setLoading(true);
    try {
      await stripeAction("create_payment_link", { price_id: priceId, quantity: parseInt(quantity) });
      toast({ title: "Link criado com sucesso!" });
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({ title: "Link copiado!" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Links de Pagamento</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Novo Link</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Link de Pagamento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Produto *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={priceId} onChange={(e) => setPriceId(e.target.value)}>
                  <option value="">Selecione...</option>
                  {productsWithPrice.map((p: any) => (
                    <option key={p.id} value={typeof p.default_price === 'string' ? p.default_price : p.default_price?.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div><Label>Quantidade</Label><Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Criar Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum link encontrado</p>
        ) : (
          <div className="space-y-2">
            {data.map((l: any) => (
              <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Link2 className="h-4 w-4 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{l.url}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyLink(l.url, l.id)}>
                    {copiedId === l.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={l.url} target="_blank" rel="noopener"><ExternalLink className="h-3.5 w-3.5" /></a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Invoices Tab ---
function InvoicesTab({ data, isLoading, customers, stripeAction }: { data: any[]; isLoading: boolean; customers: any[]; stripeAction: Function }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer_id: "", amount: "", description: "" });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.customer_id || !form.amount) return toast({ title: "Cliente e valor são obrigatórios", variant: "destructive" });
    setLoading(true);
    try {
      await stripeAction("create_invoice", {
        customer_id: form.customer_id,
        amount: parseFloat(form.amount),
        description: form.description || "Cobrança",
        auto_advance: true,
      });
      toast({ title: "Cobrança criada com sucesso!" });
      setOpen(false);
      setForm({ customer_id: "", amount: "", description: "" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    paid: { label: "Pago", variant: "default" },
    open: { label: "Aberta", variant: "outline" },
    draft: { label: "Rascunho", variant: "secondary" },
    void: { label: "Cancelada", variant: "destructive" },
    uncollectible: { label: "Inadimplente", variant: "destructive" },
  };

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Cobranças</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Cobrança</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Cobrança</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Cliente *</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
                  <option value="">Selecione...</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name || c.email || c.id}</option>
                  ))}
                </select>
              </div>
              <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Gerar Cobrança
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma cobrança encontrada</p>
        ) : (
          <div className="space-y-2">
            {data.map((inv: any) => {
              const st = statusMap[inv.status] || { label: inv.status, variant: "secondary" as const };
              return (
                <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <DollarSign className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {(inv.amount_due / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                    <p className="text-xs text-muted-foreground">{inv.customer_name || inv.customer_email || inv.customer}</p>
                  </div>
                  <Badge variant={st.variant}>{st.label}</Badge>
                  {inv.hosted_invoice_url && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={inv.hosted_invoice_url} target="_blank" rel="noopener"><ExternalLink className="h-3.5 w-3.5" /></a>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Update Keys Dialog ---
function UpdateKeysDialog({ empresaId, userName }: { empresaId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const saveMutation = useSaveStripeKeys();

  const handleUpdate = () => {
    if (!publishableKey || !secretKey) return toast({ title: "Preencha ambas as chaves", variant: "destructive" });
    saveMutation.mutate({ empresaId, publishableKey, secretKey, createdBy: userName }, {
      onSuccess: () => setOpen(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Key className="h-4 w-4 mr-1" /> Atualizar Chaves</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Atualizar Chaves do Stripe</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Chave Publicável</Label><Input placeholder="pk_live_..." value={publishableKey} onChange={(e) => setPublishableKey(e.target.value)} /></div>
          <div><Label>Chave Secreta</Label><Input type="password" placeholder="sk_live_..." value={secretKey} onChange={(e) => setSecretKey(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button onClick={handleUpdate} disabled={saveMutation.isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
