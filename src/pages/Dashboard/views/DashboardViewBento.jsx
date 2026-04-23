import React from 'react'
import {
  ContextBand,
  KpiRow,
  TopCategoriesBlock,
  BudgetBlock,
  RecentBlock,
  QuickActionsBlock,
  MonthHeroBlock
} from '../shared/DashboardSharedSections'

export default function DashboardViewBento (props) {
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

      <MonthHeroBlock monthStats={monthStats} formatCurrency={formatCurrency} variant='compact' />

      <KpiRow
        stats={stats}
        monthStats={monthStats}
        yearFilter={yearFilter}
        filterLabel={filterLabel}
        formatCurrency={formatCurrency}
        density={kpiDensity}
      />

      <div className='grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3'>
        <div className='order-1 md:order-1'>
          <BudgetBlock budgetAlerts={budgetAlerts} onNavigate={onNavigate} formatCurrency={formatCurrency} />
        </div>
        <div className='order-2 min-w-0 md:col-span-2 xl:col-span-1 md:order-2'>
          <RecentBlock
            recentExpenses={recentExpenses}
            yearFilter={yearFilter}
            filterLabel={filterLabel}
            onNavigate={onNavigate}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        </div>
        <div className='order-3 min-w-0 md:col-span-2 xl:col-span-1'>
          <TopCategoriesBlock monthStats={monthStats} formatCurrency={formatCurrency} />
        </div>
      </div>

      <QuickActionsBlock onNavigate={onNavigate} />
    </div>
  )
}
