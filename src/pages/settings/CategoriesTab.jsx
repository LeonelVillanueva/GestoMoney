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
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">➕ Agregar Nueva Categoría</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la categoría</label>
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Ropa, Viajes, Deportes..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
              <div className="flex flex-wrap gap-1">
                {colors.slice(0, 8).map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewCategory({ ...newCategory, color })}
                    className={`w-6 h-6 rounded-full border-2 ${
                      newCategory.color === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Icono</label>
            <div className="flex flex-wrap gap-2">
              {icons.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setNewCategory({ ...newCategory, icon })}
                  className={`w-10 h-10 text-xl rounded-lg border-2 flex items-center justify-center ${
                    newCategory.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={onAddCategory}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            ➕ Agregar Categoría
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">🏷️ Categorías Existentes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div key={category.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-800">{category.name}</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: category.color }} />
                      <span className="text-sm text-gray-600">{category.color}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setEditingCategory(editingCategory === category.id ? null : category.id)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">✏️</button>
                  <button onClick={() => onDeleteCategory(category.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">🗑️</button>
                </div>
              </div>

              {editingCategory === category.id && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="space-y-3">
                    <input
                      type="text"
                      defaultValue={category.name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      onBlur={(e) => {
                        if (e.target.value !== category.name) {
                          onUpdateCategory(category.id, { name: e.target.value })
                        }
                      }}
                    />
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        defaultValue={category.color}
                        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                        onChange={(e) => onUpdateCategory(category.id, { color: e.target.value })}
                      />
                      <div className="flex flex-wrap gap-1">
                        {icons.map((icon) => (
                          <button
                            key={icon}
                            onClick={() => onUpdateCategory(category.id, { icon })}
                            className={`w-8 h-8 text-sm rounded border flex items-center justify-center ${
                              category.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">⚙️ Configuración</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoría por defecto</label>
          <select
            value={settings.defaultCategory}
            onChange={(e) => onSettingChange('defaultCategory', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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






