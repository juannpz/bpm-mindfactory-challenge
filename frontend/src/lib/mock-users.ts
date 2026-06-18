export const MOCK_INTERNAL_USERS = [
  {
    azureObjectId: "mock-admin-001",
    nombre: "Admin General",
    email: "admin@oficina.local",
    area: "Mesa de Entrada",
    rol: "ADMIN",
  },
  {
    azureObjectId: "mock-mesa-001",
    nombre: "Operador Mesa de Entrada",
    email: "mesa@oficina.local",
    area: "Mesa de Entrada",
    rol: "MESA_ENTRADA",
  },
  {
    azureObjectId: "mock-sup-001",
    nombre: "Supervisor Administración",
    email: "sup@oficina.local",
    area: "Administración",
    rol: "SUPERVISOR",
  },
  {
    azureObjectId: "mock-legal-001",
    nombre: "Operador Legal",
    email: "legal@oficina.local",
    area: "Legales",
    rol: "OPERADOR",
  },
  {
    azureObjectId: "mock-audit-001",
    nombre: "Auditor",
    email: "auditor@oficina.local",
    area: "Administración",
    rol: "AUDITOR",
  },
];

export const MOCK_SEED_PASSWORDS: Record<string, string> = {
  "externo1@test.com": "Password123!",
  "externo2@test.com": "Password123!",
  "externo3@test.com": "Password123!",
};
