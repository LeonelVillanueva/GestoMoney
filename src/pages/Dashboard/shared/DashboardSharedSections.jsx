import React from 'react'
import YearSelector from '../../../components/YearSelector'
import { I, CategoryBadge, dsCard, dsCardMuted, dsCardEmphasis, getPeriodShellClass } from './dashboardUI'

export function ContextBand ({
  filterLabel,
  stats,
  showTransactionCount,
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
  allTimeStats
}) {
  return (
    <div className={`${dsCardMuted} relative z-[100] overflow-visible`}>
      <div className='mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>Contexto y periodo</p>
        <div className='flex flex-wrap items-center gap-2 text-xs'>
          <span
            className='inline-flex max-w-full items-center truncate rounded-full border border-zinc-700/80 bg-zinc-800/50 px-2.5 py-1 text-zinc-200'
            title={filterLabel}
          >
            {filterLabel}
          </span>
          {showTransactionCount && stats != null && (
            <span className='text-zinc-500'>
              <span className='font-semibold tabular-nums text-zinc-300'>{stats.totalTransactions}</span> mov. en periodo
            </span>
          )}
        </div>
      </div>
      <div className='mb-4 min-w-0'>
        <YearSelector
          yearFilter={yearFilter}
          selectedYear={selectedYear}
          currentYear={currentYear}
          previousYears={previousYears}
          availableYears={availableYears}
          onFilterChange={onFilterChange}
          showStats={false}
          statsByYear={statsByYear}
          compact
          variant='dark'
        />
      </div>
      <PeriodTriplet
        yearFilter={yearFilter}
        currentYear={currentYear}
        previousYears={previousYears}
        handleYearFilterChange={handleYearFilterChange}
        formatCurrency={formatCurrency}
        currentYearStats={currentYearStats}
        previousYearsStats={previousYearsStats}
        allTimeStats={allTimeStats}
      />
    </div>
  )
}

export function PeriodTriplet ({
  yearFilter,
  currentYear,
  previousYears,
  handleYearFilterChange,
  formatCurrency,
  currentYearStats,
  previousYearsStats,
  allTimeStats
}) {
  const periodShell = (active, accent) => getPeriodShellClass(active, accent)
  const periodCard = 'min-w-[min(100%,20rem)] shrink-0 snap-center sm:min-w-0 md:min-w-0'

  return (
    <div className='relative z-[1] flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-3 md:gap-3 md:overflow-x-visible md:pb-0 [&::-webkit-scrollbar]:hidden'>
      <div
        role='button'
        tabIndex={0}
        onClick={() => handleYearFilterChange('current')}
        onKeyDown={(e) => e.key === 'Enter' && handleYearFilterChange('current')}
        className={`${periodCard} ${periodShell(
          yearFilter === 'current',
          'border-emerald-500/40 bg-zinc-900/60 ring-1 ring-emerald-500/25'
        )}`}
      >
        {yearFilter === 'current' && <span className='absolute left-0 top-0 h-full w-1 bg-emerald-500' aria-hidden />}
        <div className='mb-3 flex items-center justify-between'>
          <div className='flex items-center gap-2.5 pl-0.5'>
            <div className='text-emerald-400'>{I.cal('h-5 w-5')}</div>
            <h3 className='text-base font-semibold text-white'>{currentYear}</h3>
          </div>
          <span className='rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300'>
            Año actual
          </span>
        </div>
        <div className='space-y-1.5 text-sm'>
          <div className='flex justify-between gap-2'>
            <span className='text-zinc-500'>Gastos</span>
            <span className='font-semibold tabular-nums text-rose-400'>{formatCurrency(currentYearStats.totalGastos)}</span>
          </div>
          <div className='flex justify-between gap-2'>
            <span className='text-zinc-500'>Ingresos</span>
            <span className='font-semibold tabular-nums text-emerald-400'>{formatCurrency(currentYearStats.totalIngresos)}</span>
          </div>
          <div className='border-t border-zinc-800/80 pt-2'>
            <div className='flex justify-between gap-2'>
              <span className='text-zinc-500'>Balance</span>
              <span className={`font-bold tabular-nums ${currentYearStats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(currentYearStats.balance)}
              </span>
            </div>
          </div>
          <p className='pt-1 text-center text-xs text-zinc-600'>{currentYearStats.count} transacciones</p>
        </div>
      </div>

      <div
        role='button'
        tabIndex={0}
        onClick={() => handleYearFilterChange('previous')}
        onKeyDown={(e) => e.key === 'Enter' && handleYearFilterChange('previous')}
        className={`${periodCard} ${periodShell(
          yearFilter === 'previous',
          'border-violet-500/40 bg-zinc-900/60 ring-1 ring-violet-500/25'
        )}`}
      >
        {yearFilter === 'previous' && <span className='absolute left-0 top-0 h-full w-1 bg-violet-500' aria-hidden />}
        <div className='mb-3 flex items-center justify-between'>
          <div className='flex items-center gap-2.5 pl-0.5'>
            <div className='text-violet-400'>{I.book('h-5 w-5')}</div>
            <h3 className='text-base font-semibold text-white'>Anteriores</h3>
          </div>
          <span className='rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-200'>
            {previousYears.length} años
          </span>
        </div>
        <div className='space-y-1.5 text-sm'>
          <div className='flex justify-between gap-2'>
            <span className='text-zinc-500'>Gastos</span>
            <span className='font-semibold tabular-nums text-rose-400'>{formatCurrency(previousYearsStats.totalGastos)}</span>
          </div>
          <div className='flex justify-between gap-2'>
            <span className='text-zinc-500'>Ingresos</span>
            <span className='font-semibold tabular-nums text-emerald-400'>{formatCurrency(previousYearsStats.totalIngresos)}</span>
          </div>
          <div className='border-t border-zinc-800/80 pt-2'>
            <div className='flex justify-between gap-2'>
              <span className='text-zinc-500'>Balance</span>
              <span className={`font-bold tabular-nums ${previousYearsStats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(previousYearsStats.balance)}
              </span>
            </div>
          </div>
          <p className='pt-1 text-center text-xs text-zinc-600'>{previousYearsStats.count} transacciones</p>
        </div>
      </div>

      <div
        role='button'
        tabIndex={0}
        onClick={() => handleYearFilterChange('all')}
        onKeyDown={(e) => e.key === 'Enter' && handleYearFilterChange('all')}
        className={`${periodCard} ${periodShell(
          yearFilter === 'all',
          'border-blue-500/40 bg-zinc-900/60 ring-1 ring-blue-500/25'
        )}`}
      >
        {yearFilter === 'all' && <span className='absolute left-0 top-0 h-full w-1 bg-blue-500' aria-hidden />}
        <div className='mb-3 flex items-center justify-between'>
          <div className='flex items-center gap-2.5 pl-0.5'>
            <div className='text-blue-400'>{I.chart('h-5 w-5')}</div>
            <h3 className='text-base font-semibold text-white'>Total</h3>
          </div>
          <span className='rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-200'>Histórico</span>
        </div>
        <div className='space-y-1.5 text-sm'>
          <div className='flex justify-between gap-2'>
            <span className='text-zinc-500'>Gastos</span>
            <span className='font-semibold tabular-nums text-rose-400'>{formatCurrency(allTimeStats.totalGastos)}</span>
          </div>
          <div className='flex justify-between gap-2'>
            <span className='text-zinc-500'>Ingresos</span>
            <span className='font-semibold tabular-nums text-emerald-400'>{formatCurrency(allTimeStats.totalIngresos)}</span>
          </div>
          <div className='border-t border-zinc-800/80 pt-2'>
            <div className='flex justify-between gap-2'>
              <span className='text-zinc-500'>Balance</span>
              <span className={`font-bold tabular-nums ${allTimeStats.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(allTimeStats.balance)}
              </span>
            </div>
          </div>
          <p className='pt-1 text-center text-xs text-zinc-600'>{allTimeStats.count} transacciones</p>
        </div>
      </div>
    </div>
  )
}

const kpiIcon = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800/80 bg-zinc-800/60 text-zinc-400'

export function KpiRow ({ stats, monthStats, yearFilter, filterLabel, formatCurrency, density = 'default' }) {
  const cellPad = density === 'compact' ? 'p-2.5 sm:p-3' : 'p-3 sm:p-4'
  return (
    <div className={`${dsCard} p-0`}>
      <div className='grid grid-cols-2 divide-y divide-zinc-800/70 lg:grid-cols-4 lg:divide-x lg:divide-y-0'>
        <div className={`${cellPad} min-w-0`}>
          <div className='flex items-start gap-2.5'>
            <div className={kpiIcon}>{I.coin('h-4 w-4 sm:h-5 sm:w-5')}</div>
            <div className='min-w-0 flex-1'>
              <p className='text-xs font-medium text-zinc-500'>
                Total (filtro)
                {yearFilter !== 'all' && <span className='text-zinc-400'> · {filterLabel}</span>}
              </p>
              <p className='mt-0.5 break-words text-base font-bold tabular-nums text-white sm:text-lg'>
                {formatCurrency(stats.totalExpenses)}
              </p>
              <p className='mt-1 text-xs text-zinc-600'>{stats.totalTransactions} transacciones</p>
            </div>
          </div>
        </div>

        <div className={`${cellPad} min-w-0`}>
          <div className='flex items-start gap-2.5'>
            <div className={kpiIcon}>{I.cal('h-4 w-4 sm:h-5 sm:w-5')}</div>
            <div className='min-w-0 flex-1'>
              <p className='text-xs font-medium text-zinc-500'>Gasto este mes</p>
              <p className='mt-0.5 break-words text-base font-bold tabular-nums text-white sm:text-lg'>
                {formatCurrency(monthStats.currentMonthTotal)}
              </p>
              <p className={`mt-1 text-xs font-medium ${monthStats.monthlyChange >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {monthStats.monthlyChange >= 0 ? 'Más' : 'Menos'} {Math.abs(monthStats.monthlyChange).toFixed(1)}% vs mes ant.
              </p>
            </div>
          </div>
        </div>

        <div className={`${cellPad} min-w-0`}>
          <div className='flex items-start gap-2.5'>
            <div className={kpiIcon}>
              {monthStats.balance >= 0 ? I.check('h-4 w-4 sm:h-5 sm:w-5') : I.alert('h-4 w-4 sm:h-5 sm:w-5')}
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-xs font-medium text-zinc-500'>Balance (mes)</p>
              <p
                className={`mt-0.5 break-words text-base font-bold tabular-nums sm:text-lg ${
                  monthStats.balance >= 0 ? 'text-emerald-400' : 'text-amber-300'
                }`}
              >
                {formatCurrency(monthStats.balance)}
              </p>
              <p className='mt-1 text-xs text-zinc-600'>Ingresos − gastos</p>
            </div>
          </div>
        </div>

        <div className={`${cellPad} col-span-2 min-w-0 lg:col-span-1`}>
          <div className='flex items-start gap-2.5'>
            <div className={kpiIcon}>{I.trend('h-4 w-4 sm:h-5 sm:w-5')}</div>
            <div className='min-w-0'>
              <p className='text-xs font-medium text-zinc-500'>Top categoría (mes)</p>
              {monthStats.topCategories.length > 0 ? (
                <div className='mt-1 flex min-w-0 items-center gap-2'>
                  <CategoryBadge name={monthStats.topCategories[0].name} className='!h-7 !w-7 !text-[9px]' />
                  <span className='truncate text-sm font-semibold text-white'>{monthStats.topCategories[0].name}</span>
                </div>
              ) : (
                <p className='mt-0.5 text-sm text-zinc-500'>N/A</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TopCategoriesBlock ({ monthStats, formatCurrency }) {
  if (monthStats.topCategories.length === 0 || monthStats.currentMonthTotal <= 0) return null
  return (
    <div className={dsCard}>
      <h2 className='mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500'>
        {I.chart('h-4 w-4 text-zinc-400')}
        Categorías destacadas (mes)
      </h2>
      <ul className='space-y-4'>
        {monthStats.topCategories.map((cat, index) => {
          const pct = (cat.total / monthStats.currentMonthTotal) * 100
          return (
            <li key={cat.name} className='group'>
              <div className='mb-1.5 flex items-center justify-between gap-2'>
                <div className='flex min-w-0 items-center gap-2.5'>
                  <CategoryBadge name={cat.name} className='!h-7 !w-7 !text-[9px]' />
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium text-zinc-200'>{cat.name}</p>
                    <p className='text-xs text-zinc-500'>Posición {index + 1}</p>
                  </div>
                </div>
                <div className='shrink-0 text-right'>
                  <p className='text-sm font-bold tabular-nums text-white'>{formatCurrency(cat.total)}</p>
                  <p className='text-xs text-zinc-500'>{pct.toFixed(0)}% del total del mes</p>
                </div>
              </div>
              <div className='h-1.5 w-full overflow-hidden rounded-full bg-zinc-800'>
                <div
                  className='h-full rounded-full bg-gradient-to-r from-blue-600/80 to-violet-500/80 transition-all duration-500'
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function BudgetBlock ({ budgetAlerts, onNavigate, formatCurrency }) {
  return (
    <div className={dsCardMuted}>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <h2 className='flex items-center gap-2 text-base font-semibold text-white'>
          {I.alert('h-5 w-5 text-amber-400')}
          Alertas de presupuesto
        </h2>
        {budgetAlerts.length > 0 && (
          <button
            type='button'
            onClick={() => onNavigate('budgets')}
            className='cursor-pointer text-xs font-medium text-blue-400 transition-colors hover:text-blue-300'
          >
            Presupuestos
          </button>
        )}
      </div>
      {budgetAlerts.length > 0 ? (
        <ul className='space-y-2'>
          {budgetAlerts.slice(0, 3).map((alert) => (
            <li
              key={`${alert.category}-${alert.spent}`}
              className={`rounded-xl border p-3 ${
                alert.isOverBudget ? 'border-rose-500/30 bg-rose-500/5' : 'border-amber-500/30 bg-amber-500/5'
              }`}
            >
              <div className='mb-2 flex items-center justify-between gap-2'>
                <div className='flex min-w-0 items-center gap-2'>
                  <CategoryBadge name={alert.category} className='!h-7 !w-7' />
                  <span className='truncate text-sm font-medium text-zinc-200'>{alert.category}</span>
                </div>
                <span className={alert.isOverBudget ? 'text-xs font-bold text-rose-400' : 'text-xs font-bold text-amber-300'}>
                  {alert.percentage.toFixed(0)}%
                </span>
              </div>
              <p className='mb-1.5 text-xs text-zinc-500'>
                {formatCurrency(alert.spent)} de {formatCurrency(alert.amount)} — {alert.isOverBudget ? 'Límite superado' : 'Cerca del tope'}
              </p>
              <div className='h-1.5 w-full overflow-hidden rounded-full bg-zinc-800'>
                <div
                  className={`h-full rounded-full ${alert.isOverBudget ? 'bg-rose-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                />
              </div>
            </li>
          ))}
          {budgetAlerts.length > 3 && (
            <li className='pt-1 text-center text-xs text-zinc-600'>+{budgetAlerts.length - 3} alertas más</li>
          )}
        </ul>
      ) : (
        <div className='flex flex-col items-center py-8 text-center'>
          <div className='mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'>
            {I.check('h-6 w-6')}
          </div>
          <p className='text-sm text-zinc-500'>No hay presupuestos cerca o superados este mes</p>
        </div>
      )}
    </div>
  )
}

export function RecentBlock ({
  recentExpenses,
  yearFilter,
  filterLabel,
  onNavigate,
  formatCurrency,
  formatDate
}) {
  return (
    <div className={dsCard}>
      <div className='mb-3 flex items-center justify-between gap-2'>
        <h2 className='flex min-w-0 items-center gap-2 text-base font-semibold text-white'>
          {I.list('h-5 w-5 text-zinc-500')}
          <span className='truncate'>Movimientos recientes</span>
          {yearFilter !== 'all' && <span className='shrink-0 text-xs font-normal text-blue-400'>· {filterLabel}</span>}
        </h2>
        {recentExpenses.length > 0 && (
          <button
            type='button'
            onClick={() => onNavigate('view-data')}
            className='cursor-pointer shrink-0 text-xs font-medium text-blue-400 transition-colors hover:text-blue-300'
          >
            Ver todo
          </button>
        )}
      </div>
      {recentExpenses.length > 0 ? (
        <ul className='space-y-1.5'>
          {recentExpenses.slice(0, 5).map((expense) => (
            <li
              key={expense.id || `${expense.descripcion}-${expense.fecha}`}
              className='flex items-center justify-between gap-2 rounded-xl border border-transparent p-2.5 transition-colors hover:border-zinc-800 hover:bg-zinc-800/30'
            >
              <div className='flex min-w-0 flex-1 items-center gap-2.5'>
                <CategoryBadge name={expense.categoria_nombre} className='!h-8 !w-8' />
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium text-zinc-200'>{expense.descripcion}</p>
                  <p className='text-xs text-zinc-500'>
                    {expense.categoria_nombre} · {formatDate(expense.fecha)}
                  </p>
                </div>
              </div>
              <p className={`shrink-0 text-sm font-bold tabular-nums ${expense.es_entrada ? 'text-emerald-400' : 'text-zinc-200'}`}>
                {expense.es_entrada ? '+' : '−'}
                {formatCurrency(expense.monto)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className='py-6 text-center'>
          <p className='text-sm text-zinc-500'>
            {yearFilter !== 'all' ? `No hay movimientos en ${filterLabel}` : 'Aún no registras movimientos en el periodo'}
          </p>
          <button
            type='button'
            onClick={() => onNavigate('add-expense')}
            className='mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-600'
          >
            {I.plus('h-3.5 w-3.5')}
            Registrar un gasto
          </button>
        </div>
      )}
    </div>
  )
}

const QUICK = [
  { id: 'add-expense', label: 'Agregar gasto' },
  { id: 'charts', label: 'Gráficos' },
  { id: 'budgets', label: 'Presupuestos' },
  { id: 'calculate-expense', label: 'Calcular' }
]

export function QuickActionsBlock ({ onNavigate, className = '' }) {
  const icons = [I.plus, I.chart, I.coin, I.calc]
  return (
    <div className={`${dsCardMuted} ${className}`.trim()}>
      <h2 className='mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500'>Accesos directos</h2>
      <div className='grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3'>
        {QUICK.map((a, i) => (
          <button
            key={a.id}
            type='button'
            onClick={() => onNavigate(a.id)}
            className='flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-800/20 px-3 py-4 text-zinc-300 transition-all duration-200 hover:border-blue-500/30 hover:bg-zinc-800/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40'
          >
            <div className='text-blue-400/90'>{icons[i]('h-5 w-5')}</div>
            <span className='text-center text-xs font-medium leading-tight'>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const heroShell =
  `${dsCardEmphasis} border-blue-500/20 bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-blue-950/30 ring-1 ring-blue-500/15`

export function MonthHeroBlock ({ monthStats, formatCurrency, variant = 'default' }) {
  const prev = monthStats.previousMonthTotal
  const cur = monthStats.currentMonthTotal
  const rel = prev > 0 ? Math.min(100, (cur / prev) * 100) : cur > 0 ? 100 : 0
  if (variant === 'compact') {
    return (
      <div className={heroShell}>
        <p className='text-xs font-medium uppercase tracking-wider text-zinc-500'>Salud del mes</p>
        <div className='mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end'>
          <div>
            <p className='text-xs text-zinc-500'>Balance</p>
            <p className={`text-xl font-bold tabular-nums sm:text-2xl ${monthStats.balance >= 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
              {formatCurrency(monthStats.balance)}
            </p>
          </div>
          <div className='text-left sm:text-right'>
            <p className='text-xs text-zinc-500'>Gasto del mes</p>
            <p className='text-lg font-bold tabular-nums text-white sm:text-xl'>{formatCurrency(cur)}</p>
          </div>
        </div>
        <p className={`mt-2 text-xs font-medium ${monthStats.monthlyChange >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
          {monthStats.monthlyChange >= 0 ? '↑' : '↓'} {Math.abs(monthStats.monthlyChange).toFixed(1)}% vs mes anterior
        </p>
        <div className='mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800'>
          <div className='h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-500' style={{ width: `${rel}%` }} />
        </div>
      </div>
    )
  }
  return (
    <div className={heroShell}>
      <p className='text-xs font-medium uppercase tracking-wider text-zinc-500'>Salud del mes</p>
      <div className='mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
        <div>
          <p className='text-sm text-zinc-400'>Balance (ingresos − gastos)</p>
          <p
            className={`mt-1 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl ${
              monthStats.balance >= 0 ? 'text-emerald-400' : 'text-amber-300'
            }`}
          >
            {formatCurrency(monthStats.balance)}
          </p>
        </div>
        <div className='text-right'>
          <p className='text-sm text-zinc-400'>Gastos del mes</p>
          <p className='mt-1 text-2xl font-bold tabular-nums text-white'>{formatCurrency(cur)}</p>
        </div>
      </div>
      <p className={`mt-3 text-sm font-medium ${monthStats.monthlyChange >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
        {monthStats.monthlyChange >= 0 ? '↑' : '↓'} {Math.abs(monthStats.monthlyChange).toFixed(1)}% respecto al mes anterior
      </p>
      <div className='mt-4'>
        <p className='mb-1 text-xs text-zinc-500'>Gasto actual vs mes anterior (referencia visual)</p>
        <div className='h-2.5 w-full overflow-hidden rounded-full bg-zinc-800'>
          <div className='h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-500' style={{ width: `${rel}%` }} />
        </div>
      </div>
    </div>
  )
}
