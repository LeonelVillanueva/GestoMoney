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

export default function DashboardViewHero (props) {
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
    <div className='space-y-5'>
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

      <MonthHeroBlock monthStats={monthStats} formatCurrency={formatCurrency} />

      <KpiRow
        stats={stats}
        monthStats={monthStats}
        yearFilter={yearFilter}
        filterLabel={filterLabel}
        formatCurrency={formatCurrency}
        density={kpiDensity}
      />

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start'>
        <div className='order-2 lg:order-1'>
          <TopCategoriesBlock monthStats={monthStats} formatCurrency={formatCurrency} />
        </div>
        <div className='order-1 space-y-4 lg:order-2'>
          <BudgetBlock budgetAlerts={budgetAlerts} onNavigate={onNavigate} formatCurrency={formatCurrency} />
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
