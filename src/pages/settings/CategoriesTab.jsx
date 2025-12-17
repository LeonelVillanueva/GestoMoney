import React from 'react'

export default function CategoriesTab({
  categories,
  newCategory,
  setNewCategory,
  editingCategory,
  setEditingCategory,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
  settings,
  onSettingChange,
  colors,
  icons,
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">➕ Agregar Nueva Categoría</h3>
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Ropa, Viajes..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <div className="flex flex-wrap gap-1">
                  {colors.slice(0, 6).map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCategory({ ...newCategory, color })}
                      className={`w-5 h-5 rounded-full border ${
                        newCategory.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Icono</label>
              <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                {icons.slice(0, 8).map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewCategory({ ...newCategory, icon })}
                    className={`w-8 h-8 text-base rounded border flex items-center justify-center ${
                      newCategory.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={onAddCategory}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ➕ Agregar
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">🏷️ Categorías ({categories.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {categories.map((category) => (
            <div key={category.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg flex-shrink-0">{category.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 truncate">{category.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: category.color }} />
                      <span className="text-xs text-gray-600 truncate">{category.color}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setEditingCategory(editingCategory === category.id ? null : category.id)} className="text-blue-600 hover:text-blue-800 text-xs">✏️</button>
                  <button onClick={() => onDeleteCategory(category.id)} className="text-red-600 hover:text-red-800 text-xs">🗑️</button>
                </div>
              </div>

              {editingCategory === category.id && (
                <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                  <input
                    type="text"
                    defaultValue={category.name}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                    onBlur={(e) => {
                      if (e.target.value !== category.name) {
                        onUpdateCategory(category.id, { name: e.target.value })
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <input
                      type="color"
                      defaultValue={category.color}
                      className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                      onChange={(e) => onUpdateCategory(category.id, { color: e.target.value })}
                    />
                    <div className="flex flex-wrap gap-1">
                      {icons.slice(0, 6).map((icon) => (
                        <button
                          key={icon}
                          onClick={() => onUpdateCategory(category.id, { icon })}
                          className={`w-6 h-6 text-xs rounded border flex items-center justify-center ${
                            category.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">⚙️ Configuración</h3>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Categoría por defecto</label>
          <select
            value={settings.defaultCategory}
            onChange={(e) => onSettingChange('defaultCategory', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}






