

## Sistema de Contas a Pagar — ITA Digital

### 🎨 Design & Identidade Visual
- Paleta de cores elegante: **Azul escuro** (primário), **Verde esmeralda** (sucesso/destaque), **Areia/Bege** (fundo e cards)
- Tipografia moderna e limpa
- Layout responsivo com design glassmorphism sutil

---

### 1. Tela de Login
- Design moderno e centralizado com fundo em gradiente azul/verde
- Campos de email e senha com validação visual
- Login visual (mock) com credenciais de demonstração
- Animações suaves de entrada

### 2. Dashboard Principal
- **Header** com logo, nome do usuário e botão de logout
- **Sidebar** colapsável com navegação entre seções
- **KPI Cards** no topo:
  - Total de contas
  - Total a pagar (valor)
  - Contas pagas vs pendentes
  - Contas vencidas
- **Gráficos**:
  - Gráfico de barras com pagamentos por mês
  - Gráfico de pizza por categoria
  - Evolução de gastos ao longo do tempo

### 3. Listagem de Contas a Pagar
- Tabela moderna com dados vindos em tempo real do endpoint n8n
- Colunas: Documento, Fornecedor, Categoria, Valor, Vencimento, Status
- **Filtros**: por status (Pago/Pendente), por data, busca por texto
- **Ordenação** por valor, data ou status
- Badge colorido para status (Pago = verde, Pendente = amarelo, Vencido = vermelho)
- Clique na linha abre modal com detalhes completos e link para arquivo anexo

### 4. Dados
- Fetch em tempo real do endpoint `https://n8n.itadigital.com.br/webhook/conta-pagar`
- Loading states elegantes com skeletons
- Tratamento de erros com mensagens amigáveis

