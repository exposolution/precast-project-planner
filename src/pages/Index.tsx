import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProductionQueue } from '@/components/dashboard/ProductionQueue';
import { GanttChart } from '@/components/gantt/GanttChart';
import { ObrasList } from '@/components/obras/ObrasList';
import { FormasList } from '@/components/obras/FormasList';
import { mockObras, mockFormas, mockProductionItems, sortByPriority, getPriorityValue } from '@/data/mockData';
import { Factory, Package, Clock, AlertTriangle, TrendingUp, Layers } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Sort production items by priority (obra priority first, then item priority, then by size)
  const sortedProductionItems = useMemo(() => {
    return [...mockProductionItems].sort((a, b) => {
      // First by obra priority
      const obraA = mockObras.find(o => o.id === a.obraId);
      const obraB = mockObras.find(o => o.id === b.obraId);
      const obraPriorityDiff = getPriorityValue(obraB?.priority || 'low') - getPriorityValue(obraA?.priority || 'low');
      if (obraPriorityDiff !== 0) return obraPriorityDiff;

      // Then by item priority
      const itemPriorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority);
      if (itemPriorityDiff !== 0) return itemPriorityDiff;

      // Then by forma size (larger first)
      const formaA = mockFormas.find(f => f.id === a.formaId);
      const formaB = mockFormas.find(f => f.id === b.formaId);
      const sizeA = (formaA?.dimensions.length || 0) * (formaA?.dimensions.width || 0) * (formaA?.dimensions.height || 0);
      const sizeB = (formaB?.dimensions.length || 0) * (formaB?.dimensions.width || 0) * (formaB?.dimensions.height || 0);
      return sizeB - sizeA;
    });
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const totalItems = mockProductionItems.length;
    const inProgress = mockProductionItems.filter(i => i.status === 'in-progress').length;
    const pending = mockProductionItems.filter(i => i.status === 'pending').length;
    const totalQuantity = mockProductionItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalProduced = mockProductionItems.reduce((sum, i) => sum + i.produced, 0);
    const criticalCount = mockProductionItems.filter(i => i.priority === 'critical' || i.priority === 'high').length;
    const activeObras = mockObras.filter(o => o.status === 'active').length;
    const availableFormas = mockFormas.filter(f => f.status === 'available').length;

    return {
      totalItems,
      inProgress,
      pending,
      totalQuantity,
      totalProduced,
      criticalCount,
      activeObras,
      availableFormas,
      completionRate: totalQuantity > 0 ? Math.round((totalProduced / totalQuantity) * 100) : 0,
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="container mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-slide-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard
                title="Obras Ativas"
                value={stats.activeObras}
                subtitle={`${mockObras.length} total`}
                icon={Factory}
                variant="primary"
              />
              <StatCard
                title="Em Produção"
                value={stats.inProgress}
                subtitle={`${stats.pending} pendentes`}
                icon={Clock}
                variant="success"
              />
              <StatCard
                title="Peças Produzidas"
                value={stats.totalProduced}
                subtitle={`de ${stats.totalQuantity}`}
                icon={Package}
                trend={{ value: stats.completionRate, isPositive: true }}
              />
              <StatCard
                title="Itens Críticos"
                value={stats.criticalCount}
                subtitle="Alta prioridade"
                icon={AlertTriangle}
                variant="warning"
              />
              <StatCard
                title="Taxa de Conclusão"
                value={`${stats.completionRate}%`}
                icon={TrendingUp}
                variant="success"
              />
              <StatCard
                title="Formas Disponíveis"
                value={stats.availableFormas}
                subtitle={`${mockFormas.length} total`}
                icon={Layers}
              />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProductionQueue
                items={sortedProductionItems}
                obras={mockObras}
                formas={mockFormas}
              />
              <FormasList
                formas={mockFormas}
                productionItems={mockProductionItems}
              />
            </div>

            {/* Gantt Preview */}
            <GanttChart
              items={sortedProductionItems}
              obras={mockObras}
              formas={mockFormas}
            />
          </div>
        )}

        {activeTab === 'obras' && (
          <div className="space-y-6 animate-slide-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ObrasList
                  obras={mockObras}
                  productionItems={mockProductionItems}
                />
              </div>
              <div>
                <FormasList
                  formas={mockFormas}
                  productionItems={mockProductionItems}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gantt' && (
          <div className="space-y-6 animate-slide-in">
            <GanttChart
              items={sortedProductionItems}
              obras={mockObras}
              formas={mockFormas}
            />
            <ProductionQueue
              items={sortedProductionItems}
              obras={mockObras}
              formas={mockFormas}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
