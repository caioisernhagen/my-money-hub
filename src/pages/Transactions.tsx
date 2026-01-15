import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Filter, 
  CreditCard, 
  Check, 
  X,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Transaction, TransactionType, TransactionFilters } from '@/types/finance';
import { toast } from 'sonner';

export default function Transactions() {
  const { 
    transactions, 
    categories, 
    accounts, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction,
    togglePago,
    toggleCartao,
    filterTransactions 
  } = useFinance();

  const [isOpen, setIsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [filters, setFilters] = useState<TransactionFilters>({});
  
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    data: new Date().toISOString().split('T')[0],
    tipo: 'Despesa' as TransactionType,
    conta_id: '',
    categoria_id: '',
    pago: false,
    cartao: false,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const filteredTransactions = useMemo(() => {
    return filterTransactions(filters);
  }, [filterTransactions, filters]);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.tipo === formData.tipo);
  }, [categories, formData.tipo]);

  const resetForm = () => {
    setFormData({
      descricao: '',
      valor: '',
      data: new Date().toISOString().split('T')[0],
      tipo: 'Despesa',
      conta_id: accounts[0]?.id || '',
      categoria_id: '',
      pago: false,
      cartao: false,
    });
    setEditingTransaction(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      descricao: transaction.descricao,
      valor: transaction.valor.toString(),
      data: transaction.data,
      tipo: transaction.tipo,
      conta_id: transaction.conta_id,
      categoria_id: transaction.categoria_id,
      pago: transaction.pago,
      cartao: transaction.cartao,
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const transactionData = {
      descricao: formData.descricao,
      valor: parseFloat(formData.valor) || 0,
      data: formData.data,
      tipo: formData.tipo,
      conta_id: formData.conta_id,
      categoria_id: formData.categoria_id,
      pago: formData.pago,
      cartao: formData.cartao,
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transactionData);
      toast.success('Lançamento atualizado com sucesso!');
    } else {
      addTransaction(transactionData);
      toast.success('Lançamento criado com sucesso!');
    }

    handleOpenChange(false);
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast.success('Lançamento excluído com sucesso!');
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '');

  return (
    <MainLayout title="Lançamentos" subtitle="Registre e gerencie suas transações financeiras">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    !
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-display">Filtrar Lançamentos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={filters.dataInicio || ''}
                      onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value || undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={filters.dataFim || ''}
                      onChange={(e) => setFilters({ ...filters, dataFim: e.target.value || undefined })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Conta</Label>
                  <Select
                    value={filters.conta_id || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, conta_id: value === 'all' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as contas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as contas</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={filters.categoria_id || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, categoria_id: value === 'all' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.cor }} />
                            {category.nome}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={filters.tipo || 'all'}
                    onValueChange={(value) => setFilters({ ...filters, tipo: value === 'all' ? undefined : value as TransactionType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="Receita">Receita</SelectItem>
                      <SelectItem value="Despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status Pagamento</Label>
                    <Select
                      value={filters.pago === undefined ? 'all' : filters.pago ? 'true' : 'false'}
                      onValueChange={(value) => setFilters({ 
                        ...filters, 
                        pago: value === 'all' ? undefined : value === 'true' 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="true">Pago</SelectItem>
                        <SelectItem value="false">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cartão</Label>
                    <Select
                      value={filters.cartao === undefined ? 'all' : filters.cartao ? 'true' : 'false'}
                      onValueChange={(value) => setFilters({ 
                        ...filters, 
                        cartao: value === 'all' ? undefined : value === 'true' 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="true">Cartão</SelectItem>
                        <SelectItem value="false">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={clearFilters}>
                    Limpar Filtros
                  </Button>
                  <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>
                    Aplicar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Supermercado"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: TransactionType) => setFormData({ 
                    ...formData, 
                    tipo: value,
                    categoria_id: '' 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Receita">Receita</SelectItem>
                    <SelectItem value="Despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="conta">Conta</Label>
                  <Select
                    value={formData.conta_id}
                    onValueChange={(value) => setFormData({ ...formData, conta_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.filter(a => a.ativo).map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoria_id}
                    onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.cor }} />
                            {category.nome}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="pago"
                    checked={formData.pago}
                    onCheckedChange={(checked) => setFormData({ ...formData, pago: checked })}
                  />
                  <Label htmlFor="pago">Pago</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="cartao"
                    checked={formData.cartao}
                    onCheckedChange={(checked) => setFormData({ ...formData, cartao: checked })}
                  />
                  <Label htmlFor="cartao">Cartão de Crédito</Label>
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingTransaction ? 'Salvar Alterações' : 'Criar Lançamento'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Transactions List */}
      <div className="stat-card pb-20 lg:pb-0">
        <div className="text-sm text-muted-foreground mb-4">
          {filteredTransactions.length} lançamento(s) encontrado(s)
        </div>

        <div className="space-y-2">
          {filteredTransactions.map((transaction) => {
            const category = categories.find(c => c.id === transaction.categoria_id);
            const account = accounts.find(a => a.id === transaction.conta_id);
            const isIncome = transaction.tipo === 'Receita';
            
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Icon */}
                  <div 
                    className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
                    style={{ backgroundColor: `${category?.cor}20` }}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="h-5 w-5 text-income" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 text-expense" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{transaction.descricao}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ 
                          backgroundColor: `${category?.cor}15`,
                          color: category?.cor
                        }}
                      >
                        {category?.nome}
                      </span>
                      <span className="text-xs text-muted-foreground">{account?.nome}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(transaction.data)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Buttons */}
                <div className="flex items-center gap-2 mx-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-full",
                      transaction.pago ? "bg-income/20 text-income" : "bg-muted text-muted-foreground"
                    )}
                    onClick={() => togglePago(transaction.id)}
                    title={transaction.pago ? 'Pago' : 'Pendente'}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-full",
                      transaction.cartao ? "bg-chart-1/20 text-chart-1" : "bg-muted text-muted-foreground"
                    )}
                    onClick={() => toggleCartao(transaction.id)}
                    title={transaction.cartao ? 'Cartão' : 'Outros'}
                  >
                    <CreditCard className="h-4 w-4" />
                  </Button>
                </div>

                {/* Value */}
                <div className="text-right mr-4">
                  <p className={cn(
                    "font-display font-bold",
                    isIncome ? 'text-income' : 'text-expense'
                  )}>
                    {isIncome ? '+' : '-'}{formatCurrency(transaction.valor)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(transaction)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(transaction.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum lançamento encontrado
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
