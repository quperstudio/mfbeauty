import { Users, Scissors, DollarSign, Calendar } from 'lucide-react';
import { formatCurrency } from '../lib/formats';

export default function Dashboard() {
  const metrics = [
    {
      title: 'Total Clientes',
      value: '0',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-primary-500',
    },
    {
      title: 'Servicios Activos',
      value: '0',
      icon: <Scissors className="w-6 h-6" />,
      color: 'bg-info-500',
    },
    {
      title: 'Ingresos del Día',
      value: formatCurrency(0),
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-success-500',
    },
    {
      title: 'Citas de Hoy',
      value: '0',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-warning-500',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          Vista general de tu negocio
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {metrics.map((metric) => (
          <div
            key={metric.title}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-soft border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {metric.title}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </p>
              </div>
              <div className={`${metric.color} p-2 sm:p-3 rounded-lg text-white`}>
                {metric.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Transacciones Recientes
        </h2>
        <div className="text-center py-8 sm:py-12">
          <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
            No hay transacciones registradas aún
          </p>
          <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">
            Las transacciones aparecerán aquí una vez que comiences a registrarlas
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg shadow-soft p-4 sm:p-6 text-white">
        <h3 className="text-lg sm:text-xl font-semibold mb-2">
          ¡Bienvenido al Sistema de Gestión!
        </h3>
        <p className="text-sm sm:text-base text-primary-100 mb-4">
          Comienza agregando clientes, servicios y citas para aprovechar todas las funcionalidades del sistema.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button className="px-4 py-2 bg-white text-primary-700 rounded-lg hover:bg-primary-50 transition-colors font-medium text-sm sm:text-base">
            Agregar Cliente
          </button>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-800 transition-colors font-medium text-sm sm:text-base">
            Crear Cita
          </button>
        </div>
      </div>
    </div>
  );
}
