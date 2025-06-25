// Inicializar cliente de Healthcare API con la autenticación explícita
const healthcareClient = healthcare({
  version: "v1beta1",
  auth: auth,
}); 