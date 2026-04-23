import React from 'react'
import {
  ContextBand,
  KpiRow,
  TopCategoriesBlock,
  BudgetBlock,
  RecentBlock,
  QuickActionsBlock
} from '../shared/DashboardSharedSections'
import { I } from '../shared/dashboardUI'

export default function DashboardViewOperations (props) {
  const {
    yearFilter,
    selectedYear,
    currentYear,
    previousYears,
    availableYears,
    statsByYear,
    onFilterChange,
    handleYearFilterChange,
    formatCurrency,
    currentYearStats,
    previousYearsStats,
    allTimeStats,
    stats,
    monthStats,
    filterLabel,
    budgetAlerts,
    onNavigate,
    recentExpenses,
    formatDate,
    kpiDensity
  } = props

  return (
    <div className='space-y-4'>
      <ContextBand
        filterLabel={filterLabel}
        stats={stats}
        showTransactionCount
        yearFilter={yearFilter}
        selectedYear={selectedYear}
        currentYear={currentYear}
        previousYears={previousYears}
        availableYears={availableYears}
        statsByYear={statsByYear}
        onFilterChange={onFilterChange}
        handleYearFilterChange={handleYearFilterChange}
        formatCurrency={formatCurrency}
        currentYearStats={currentYearStats}
        previousYearsStats={previousYearsStats}
        allTimeStats={allTimeStats}
      />

      <KpiRow
        stats={stats}
        monthStats={monthStats}
        yearFilter={yearFilter}
        filterLabel={filterLabel}
        formatCurrency={formatCurrency}
        density={kpiDensity}
      />

      <div className='grid grid-cols-1 gap-3 xl:grid-cols-3'>
        <div className='min-w-0 space-y-3 xl:col-span-2'>
          <div className='flex items-center justify-between'>
            <h2 className='flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500'>
              {I.list('h-4 w-4')}
              Categorías y presupuestos
            </h2>
            <span className='text-xs text-zinc-600'>Atención requerida</span>
          </div>
          <div className='grid gap-3 md:grid-cols-2'>
            <TopCategoriesBlock monthStats={monthStats} formatCurrency={formatCurrency} />
            <BudgetBlock budgetAlerts={budgetAlerts} onNavigate={onNavigate} formatCurrency={formatCurrency} />
          </div>
        </div>
        <div className='min-w-0'>
          <RecentBlock
            recentExpenses={recentExpenses}
            yearFilter={yearFilter}
            filterLabel={filterLabel}
            onNavigate={onNavigate}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        </div>
      </div>

      <QuickActionsBlock onNavigate={onNavigate} />
    </div>
  )
}
