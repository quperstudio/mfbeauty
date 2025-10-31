import { Users, Scissors, DollarSign, Calendar } from 'lucide-react';
import { formatCurrency } from '../lib/formats';

export default function Dashboard() {
  // Los colores se cambiaron para usar la clase base del tema (sin escala numérica)
  // ya que las nuevas tonalidades (success, info, etc.) se definen con un DEFAULT.
  const metrics = [
    {
      title: 'Total Clientes',
      value: '0',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-primary/50',
    },
    {
      title: 'Servicios Activos',
      value: '0',
      icon: <Scissors className="w-6 h-6" />,
      color: 'bg-info', // Usa el nuevo color info
    },
    {
      title: 'Ingresos del Día',
      value: formatCurrency(0),
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-success', // Usa el nuevo color success
    },
    {
      title: 'Citas de Hoy',
      value: '0',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-warning', // Usa el nuevo color warning
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        {/* Usando text-foreground y font-serif para títulos basado en index.css */}
        <h1 className="text-2xl sm:text-3xl font-serif text-foreground">
          Dashboard
        </h1>
        {/* Usando text-muted-foreground para texto sutil */}
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Vista general de tu negocio
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {metrics.map((metric) => (
          <div
            key={metric.title}
            // Usa la clase 'card' definida en components
            className="card p-4 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                {/* Usando text-muted-foreground para el título de la métrica */}
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                  {metric.title}
                </p>
                {/* Usando text-foreground para el valor principal */}
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {metric.value}
                </p>
              </div>
              {/* Usando la clase de color base (ej: bg-primary) y text-primary-foreground (blanco/oscuro) */}
              <div className={`${metric.color} p-2 sm:p-3 rounded-lg text-primary-foreground`}>
                {metric.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div 
        // Usa la clase 'card' definida en components
        className="card p-4 sm:p-6"
      >
        {/* Usando text-foreground y font-serif */}
        <h2 className="text-lg sm:text-xl font-serif font-semibold text-foreground mb-4">
          Transacciones Recientes
        </h2>
        <div className="text-center py-8 sm:py-12">
          {/* Usando text-muted-foreground para el icono */}
          <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3" />
          {/* Usando text-muted-foreground para el texto principal */}
          <p className="text-sm sm:text-base text-muted-foreground">
            No hay transacciones registradas aún
          </p>
          {/* Usando el color de texto más sutil para la descripción */}
          <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1">
            Las transacciones aparecerán aquí una vez que comiences a registrarlas
          </p>
        </div>
      </div>

      {/* Banner de bienvenida: usa bg-primary para el fondo principal del banner */}
      <div className="bg-primary text-primary-foreground rounded-lg shadow-soft p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-2">
          ¡Bienvenido al Sistema de Gestión!
        </h3>
        {/* Usando el color de texto de 'primary-foreground' para el párrafo */}
        <p className="text-sm sm:text-base mb-4">
          Comienza agregando clientes, servicios y citas para aprovechar todas las funcionalidades del sistema.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* El botón "Agregar Cliente" usa la clase 'btn-primary' con ajustes manuales para ser de fondo blanco */}
          <button className="px-4 py-2 bg-white text-primary rounded-lg hover:bg-secondary transition-colors font-medium text-sm sm:text-base">
            Agregar Cliente
          </button>
          {/* El botón "Crear Cita" usa la clase 'btn-primary' base con ajustes manuales para ser un color más oscuro sobre el primary */}
          <button className="px-4 py-2 bg-primary-foreground text-primary rounded-lg hover:bg-white/90 transition-colors font-medium text-sm sm:text-base">
            Crear Cita
          </button>
        </div>
      </div>
    </div>
  );
}