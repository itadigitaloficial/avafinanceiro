import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { User, Building2, Mail, Phone, Globe, MapPin, Hash, Calendar } from "lucide-react";

const Perfil = () => {
  const { user } = useAuth();
  const { empresa, isLoading } = useEmpresa();

  const fmtDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  };

  const endereco = empresa
    ? [
        empresa["Endereco rua"],
        empresa["Endereco numero"],
        empresa["Endereco bairro"],
        empresa["Endereco cidade"],
        empresa["Endereco uf"],
        empresa["Endereco cep"],
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const logoUrl = empresa?.Logo
    ? empresa.Logo.startsWith("//") ? `https:${empresa.Logo}` : empresa.Logo
    : undefined;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-4xl">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
          <p className="text-sm text-muted-foreground">Informações do usuário e empresa</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="h-full">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Dados do Usuário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                      {user?.nome?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{user?.nome}</p>
                    <Badge variant="outline" className="text-xs mt-1">Ativo</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <InfoRow icon={Mail} label="E-mail" value={user?.mail} />
                  <InfoRow icon={Hash} label="ID do Usuário" value={user?.user_id} mono />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Company Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-accent" />
                    Empresa
                  </CardTitle>
                  {logoUrl && (
                    <img src={logoUrl} alt="Logo" className="h-10 max-w-[120px] object-contain" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {empresa ? (
                  <>
                    <div className="pb-2 border-b border-border">
                      <p className="text-lg font-semibold text-foreground">{empresa.Razao_social}</p>
                      {empresa.cnpj && (
                        <p className="text-xs text-muted-foreground mt-0.5">CNPJ: {empresa.cnpj}</p>
                      )}
                    </div>

                    <InfoRow icon={Mail} label="E-mail" value={empresa.Email} />
                    <InfoRow icon={Phone} label="Telefone" value={empresa.Telefone} />
                    <InfoRow icon={Phone} label="WhatsApp" value={empresa.Whatsapp} />
                    {empresa.Website && (
                      <InfoRow icon={Globe} label="Website" value={empresa.Website} link={`https://${empresa.Website}`} />
                    )}
                    {endereco && <InfoRow icon={MapPin} label="Endereço" value={endereco} />}
                    <InfoRow icon={Calendar} label="Cadastro" value={fmtDate(empresa["Created Date"])} />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Nenhuma empresa vinculada a este usuário
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
  link,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  mono?: boolean;
  link?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">
            {value}
          </a>
        ) : (
          <p className={`text-sm text-foreground truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
        )}
      </div>
    </div>
  );
}

export default Perfil;
