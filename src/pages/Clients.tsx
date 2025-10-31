import { useState, useMemo } from 'react';
import { Plus, Search, Users, Phone, Calendar, DollarSign, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useClients } from '../hooks/useClients';
import { useAuth } from '../contexts/AuthContext';
import { canDeleteClients } from '../lib/permissions';
import { formatCurrency, formatPhone, parseDate } from '../lib/formats';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import ClientModal from '../components/clients/ClientModal';
import { Client } from '../types/database';

export default function Clients() {
  const { clients, loading, createClient, updateClient, deleteClient } = useClients();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;

    const query = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.phone.includes(query)
    );
  }, [clients, searchQuery]);

  const handleCreateClient = () => {
    setSelectedClient(undefined);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleSaveClient = async (data: any) => {
    if (selectedClient) {
      return await updateClient(selectedClient.id, data);
    } else {
      return await createClient(data);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    await deleteClient(id);
  };

  const stats = [
    {
      label: 'Total Clientes',
      value: clients.length,
      icon: Users,
      color: 'text-primary-600 dark:text-primary-400',
    },
    {
      label: 'Con Visitas',
      value: clients.filter((c) => c.total_visits > 0).length,
      icon: Calendar,
      color: 'text-info-600 dark:text-info-400',
    },
    {
      label: 'Ingresos Totales',
      value: formatCurrency(clients.reduce((sum, c) => sum + Number(c.total_spent), 0)),
      icon: DollarSign,
      color: 'text-success-600 dark:text-success-400',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Clientes
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Gestiona tu base de clientes
          </p>
        </div>
        <Button variant="primary" onClick={handleCreateClient} className="w-full sm:w-auto">
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-soft border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {stat.label}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color}`}>
                <stat.icon className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-soft border border-gray-200 dark:border-gray-700">
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados aún'}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                onClick={handleCreateClient}
                className="mt-4 w-full sm:w-auto"
              >
                <Plus className="w-5 h-5 mr-2" />
                Agregar Primer Cliente
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Visitas</TableHead>
                    <TableHead>Gastado</TableHead>
                    <TableHead>Última Visita</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          {client.birthday && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                              <Calendar className="w-3 h-3 mr-1" />
                              {format(parseDate(client.birthday) || new Date(), 'dd/MM/yyyy', { locale: es })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {formatPhone(client.phone)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="purple">{client.total_visits}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-success-600 dark:text-success-400">
                          {formatCurrency(Number(client.total_spent))}
                        </span>
                      </TableCell>
                      <TableCell>
                        {client.last_visit_date ? (
                          <span className="text-sm">
                            {format(parseDate(client.last_visit_date) || new Date(), 'dd/MM/yyyy', { locale: es })}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Sin visitas</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditClient(client)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {user && canDeleteClients(user.role) && (
                            <button
                              onClick={() => handleDeleteClient(client.id)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-error-600 dark:hover:text-error-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {filteredClients.map((client) => (
                <div key={client.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {client.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-3 h-3 mr-1" />
                        {formatPhone(client.phone)}
                      </div>
                      {client.birthday && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(parseDate(client.birthday) || new Date(), 'dd/MM/yyyy', { locale: es })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditClient(client)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user && canDeleteClients(user.role) && (
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-error-600 dark:hover:text-error-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Visitas</p>
                      <Badge variant="purple">{client.total_visits}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gastado</p>
                      <p className="text-sm font-medium text-success-600 dark:text-success-400">
                        {formatCurrency(Number(client.total_spent))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Última Visita</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {client.last_visit_date
                          ? format(parseDate(client.last_visit_date) || new Date(), 'dd/MM/yy', { locale: es })
                          : 'Sin visitas'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
        client={selectedClient}
        clients={clients}
      />
    </div>
  );
}
