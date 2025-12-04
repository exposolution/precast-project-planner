import { useMemo, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProductionQueue } from '@/components/dashboard/ProductionQueue';
import { GanttChart } from '@/components/gantt/GanttChart';
import { ObrasList } from '@/components/obras/ObrasList';
import { FormasList } from '@/components/obras/FormasList';
import { ObraForm } from '@/components/forms/ObraForm';
import { FormaForm } from '@/components/forms/FormaForm';
import { ProductionItemForm } from '@/components/forms/ProductionItemForm';
import { useObras } from '@/hooks/useObras';
import { useFormas } from '@/hooks/useFormas';
import { useProductionItems } from '@/hooks/useProductionItems';
import { generateGanttSchedule } from '@/utils/ganttScheduler'; // Import the new scheduler
import { getPriorityValue } from '@/data/mockData'; // Still used for sorting production items in ProductionQueue
import { Factory, Package, Clock, AlertTriangle, TrendingUp, Layers, Loader2 } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const { data: obras = [], isLoading: loadingObras } = useObras();
  const { data: formas = [], isLoading: loadingFormas } = useFormas();
  const { data: productionItems = [], isLoading: loadingItems } = useProductionItems();

  const isLoading = loadingObras || loadingFormas || loadingItems;

  // Generate scheduled lots using the new algorithm
  const scheduledLotes = useMemo(() => {
    if (isLoading || obras.length === 0 || formas.length === 0 || productionItems.length === 0) {
      return [];
    }
    const initialStartTime = new Date(); // Start scheduling from now
    initialStartTime.setHours(7, 0, 0, 0); // Set to 07:00 AM today

    return generateGanttSchedule(obras, formas, productionItems, {
      initialStartTime,
      workDayStartHour: 7, // 07:00
      workDayEndHour: 17,  // 17:00
      workDays: [1, 2, 3, 4, 5], // Monday to Friday
    });
  }, [obras, formas, productionItems, isLoading]);

  // Sort production items by priority (obra priority first, then item priority, then by size)
  const sortedProductionItems = useMemo(() => {
    return [...productionItems].sort((a, b) => {
      // First by obra priority
      const obraA = obras.find(o => o.id === a.obraId);
      const obraB = obras.find(o => o.id === b.obraId);
      const obraPriorityDiff = getPriorityValue(obraB?.priority || 'low') - getPriorityValue(obraA?.priority || 'low');
      if (obraPriorityDiff !== 0) return obraPriorityDiff;

      // Then by item priority
      const itemPriorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority);
      if (itemPriorityDiff !== 0) return itemPriorityDiff;

      // Then by forma size (larger first)
      // Note: Forma dimensions are now altura_max, base_max, comprimento_max
      const formaA = formas.find(f => f.id === a.formaId);
      const formaB = formas.find(f => f.id === b.formaId);
      const sizeA = (formaA?.dimensions.comprimento_max || 0) * (formaA?.dimensions.base_max || 0) * (formaA?.dimensions.altura_max || 0);
      const sizeB = (formaB?.dimensions.comprimento_max || 0) * (formaB?.dimensions.base_max || 0) * (formaB?.dimensions.altura_max || 0);
      return sizeB - sizeA;
    });
  }, [productionItems, obras, formas]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalItems = productionItems.length;
    const inProgress = productionItems.filter(i => i.status === 'in-progress').length;
    const pending = productionItems.filter(i => i.status === 'pending').length;
    const totalQuantity = productionItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalProduced = productionItems.reduce((sum, i) => sum + i.produced, 0);
    const criticalCount = productionItems.filter(i => i.priority === 'critical' || i.priority === 'high').length;
    const activeObras = obras.filter(o => o.status === 'active').length;
    const availableFormas = formas.filter(f => f.status === 'available').length;

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
  }, [productionItems, obras, formas]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="container mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-slide-in">
            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <ObraForm />
              <FormaForm />
              <ProductionItemForm obras={obras} formas={formas} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard
                title="Obras Ativas"
                value={stats.activeObras}
                subtitle={`${obras.length} total`}
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
                subtitle={`${formas.length} total`}
                icon={Layers}
              />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProductionQueue
                items={sortedProductionItems}
                obras={obras}
                formas={formas}
              />
              <FormasList
                formas={formas}
                productionItems={productionItems}
              />
            </div>

            {/* Gantt Preview */}
            <GanttChart
              lotes={scheduledLotes} // Pass scheduledLotes here
              obras={obras}
              formas={formas}
            />
          </div>
        )}

        {activeTab === 'obras' && (
          <div className="space-y-6 animate-slide-in">
            <div className="flex flex-wrap gap-3">
              <ObraForm />
              <FormaForm />
              <ProductionItemForm obras={obras} formas={formas} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ObrasList
                  obras={obras}
                  productionItems={productionItems}
                />
              </div>
              <div>
                <FormasList
                  formas={formas}
                  productionItems={productionItems}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gantt' && (
          <div className="space-y-6 animate-slide-in">
            <div className="flex flex-wrap gap-3">
              <ProductionItemForm obras={obras} formas={formas} />
            </div>
            <GanttChart
              lotes={scheduledLotes} // Pass scheduledLotes here
              obras={obras}
              formas={formas}
            />
            <ProductionQueue
              items={sortedProductionItems}
              obras={obras}
              formas={formas}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;