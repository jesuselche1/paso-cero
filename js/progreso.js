// ==========================================================
// Paso Cero — lista de proyectos y progreso de cada persona
// El progreso se guarda en el navegador (localStorage), así que
// cada persona ve el suyo y no hace falta crear una cuenta.
// ==========================================================

const TOTAL_PROYECTOS = 9;

// Proyectos que ya tienen nombre. Los que no tienen «url» aún no existen.
const PROYECTOS = [
  {
    numero: 1,
    titulo: "Tu primer programa",
    descripcion: "Usa print() para mostrar mensajes.",
    url: "leccion-1.html",
  },
  {
    numero: 2,
    titulo: "Gastos compartidos",
    descripcion: "Calcula cuánto paga cada uno en una cena.",
    url: "leccion-2.html",
  },
  {
    numero: 3,
    titulo: "Adivina el número",
    descripcion: "Crea tu primer juego: adivina el número secreto.",
    url: "leccion-3.html",
  },
  {
    numero: 4,
    titulo: "Lista de la compra",
    descripcion: "Guarda varios productos en una lista.",
    url: null,
  },
];

const CLAVE_PROGRESO = "pasoCero.completados";

function datosProyecto(numero) {
  return (
    PROYECTOS.find((p) => p.numero === numero) || {
      numero,
      titulo: null,
      descripcion: null,
      url: null,
    }
  );
}

// El navegador puede bloquear el guardado (modo privado, por ejemplo).
// Por eso todo va dentro de try/catch: la web funciona igual sin él.
function leerCompletados() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_PROGRESO));
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function marcarCompletado(numero) {
  const completados = leerCompletados();
  if (completados.includes(numero)) return;
  completados.push(numero);
  try {
    localStorage.setItem(CLAVE_PROGRESO, JSON.stringify(completados));
  } catch {
    // Sin guardado: el progreso solo dura mientras la página está abierta
  }
}

function estaCompletado(numero) {
  return leerCompletados().includes(numero);
}

// Un proyecto se desbloquea al terminar el anterior. El 1 siempre está abierto.
function estaDesbloqueado(numero) {
  return numero === 1 || estaCompletado(numero) || estaCompletado(numero - 1);
}
