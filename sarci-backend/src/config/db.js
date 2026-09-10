// Mock Prisma Client
const mockData = {
  tickets: [],
  usuarios: [],
  citas: []
};

const prisma = {
  $connect: async () => console.log('Mock DB connected'),
  $disconnect: async () => {},
  $queryRaw: async () => [{ 1: 1 }],
  ticket: {
    count: async () => mockData.tickets.length,
    findMany: async () => mockData.tickets,
    findUnique: async ({ where }) => mockData.tickets.find(t => t.id === where.id),
    create: async ({ data }) => {
      const newTicket = { id: Math.random().toString(), createdAt: new Date(), ...data };
      mockData.tickets.push(newTicket);
      return newTicket;
    },
    update: async ({ where, data }) => {
      const idx = mockData.tickets.findIndex(t => t.id === where.id);
      if (idx !== -1) {
        mockData.tickets[idx] = { ...mockData.tickets[idx], ...data, updatedAt: new Date() };
        return mockData.tickets[idx];
      }
      return null;
    }
  },
  usuario: {
    findUnique: async ({ where }) => mockData.usuarios.find(u => u.email === where.email),
    findFirst: async ({ where }) => mockData.usuarios.find(u => u.email === where.email || u.cedula === where.cedula),
    create: async ({ data }) => {
      const newUser = { id: Math.random().toString(), createdAt: new Date(), ...data };
      mockData.usuarios.push(newUser);
      return newUser;
    },
    update: async () => ({})
  },
  citaPersonal: {
    findMany: async () => mockData.citas,
    count: async () => mockData.citas.length,
    create: async ({ data }) => {
      const newCita = { id: Math.random().toString(), createdAt: new Date(), ...data };
      mockData.citas.push(newCita);
      return newCita;
    },
    update: async () => ({})
  },
  auditLog: {
    create: async () => ({})
  },
  resetToken: {
    create: async () => ({}),
    findUnique: async () => null,
    update: async () => ({})
  }
};

export default prisma;
