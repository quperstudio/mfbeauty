import { Client, ClientFilterType, ClientSortField, ClientSortDirection } from '../../types/database';

export function filterClients(
  clients: Client[],
  filter: {
    type: ClientFilterType;
    selectedTagIds: string[];
    clientsWithSelectedTags: string[];
    searchQuery: string;
  }
): Client[] {
  let filtered = clients;

  if (filter.type === 'with_visits') {
    filtered = filtered.filter((c) => c.total_visits > 0);
  } else if (filter.type === 'with_sales') {
    filtered = filtered.filter((c) => Number(c.total_spent) > 0);
  } else if (filter.type === 'referred') {
    filtered = filtered.filter((c) => c.referrer_id !== null);
  }

  if (filter.selectedTagIds.length > 0 && filter.clientsWithSelectedTags.length > 0) {
    filtered = filtered.filter((c) => filter.clientsWithSelectedTags.includes(c.id));
  }

  if (filter.searchQuery) {
    const query = filter.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.phone.includes(query) ||
        client.whatsapp_link?.toLowerCase().includes(query) ||
        client.facebook_link?.toLowerCase().includes(query) ||
        client.instagram_link?.toLowerCase().includes(query) ||
        client.tiktok_link?.toLowerCase().includes(query)
    );
  }

  return filtered;
}

export function sortClients(
  clients: Client[],
  sortField: ClientSortField,
  sortDirection: ClientSortDirection
): Client[] {
  return [...clients].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'total_spent':
        aValue = Number(a.total_spent);
        bValue = Number(b.total_spent);
        break;
      case 'total_visits':
        aValue = a.total_visits;
        bValue = b.total_visits;
        break;
      case 'last_visit_date':
        aValue = a.last_visit_date ? new Date(a.last_visit_date).getTime() : 0;
        bValue = b.last_visit_date ? new Date(b.last_visit_date).getTime() : 0;
        break;
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}

export function formatClientForExport(client: Client): Record<string, string> {
  return {
    ID: client.id,
    Nombre: client.name,
    Teléfono: client.phone,
    Email: '',
    'Fecha Nacimiento': client.birthday || '',
    Notas: client.notes || '',
    'Total Gastado': client.total_spent.toString(),
    'Total Visitas': client.total_visits.toString(),
    'Última Visita': client.last_visit_date || '',
    WhatsApp: client.whatsapp_link || '',
    Facebook: client.facebook_link || '',
    Instagram: client.instagram_link || '',
    TikTok: client.tiktok_link || '',
    'ID Referente': client.referrer_id || '',
    'Fecha Creación': client.created_at,
  };
}

export function generateCSV(clients: Client[]): string {
  if (clients.length === 0) return '';

  const formattedClients = clients.map(formatClientForExport);
  const headers = Object.keys(formattedClients[0]);

  const csvRows = [
    headers,
    ...formattedClients.map((client) => headers.map((header) => client[header])),
  ];

  return csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export function calculateFilterCounts(clients: Client[]) {
  return {
    all: clients.length,
    with_visits: clients.filter((c) => c.total_visits > 0).length,
    with_sales: clients.filter((c) => Number(c.total_spent) > 0).length,
    referred: clients.filter((c) => c.referrer_id !== null).length,
  };
}
