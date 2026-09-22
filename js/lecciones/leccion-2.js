// ==========================================================
// Paso Cero — contenido del proyecto 2
// El título y la descripción están en js/progreso.js
// ==========================================================

window.LECCION = {
  numero: 2,

  // PARTE 1 · El reto
  reto: `
    <p>Salís a cenar 4 amigos y la cuenta es de 86 €. ¿Cuánto paga cada uno? Vamos a crear un programa que lo calcule por ti.</p>
  `,

  // PARTE 2 · Lo que necesitas saber
  saber: `
    <ul class="lista-conceptos">
      <li><strong>Números:</strong> Python los usa sin comillas. <code>86</code> es un número; <code>"86"</code> es un texto.</li>
      <li><strong>Operaciones:</strong> <code>+</code> suma, <code>-</code> resta, <code>*</code> multiplica, <code>/</code> divide.</li>
      <li><strong><code>input()</code> siempre te da texto</strong>, aunque escribas un número. Es como si te lo dieran escrito en un papel: primero hay que leerlo como cantidad. Para eso se usa <code>float()</code>.</li>
      <li><strong><code>round(numero, 2)</code></strong> deja el resultado con dos decimales, como en los euros.</li>
    </ul>
  `,

  // PARTE 3 · Constrúyelo tú
  textoReto: `Este programa tiene un fallo. Pulsa «Comprobar» y arréglalo.`,

  // PARTE 4 · Constrúyelo con IA
  ia: `
    <div class="aviso">
      <p><strong>¿Te has atascado?</strong> Puedes preguntar a una IA, pero pídele que te explique, no que te lo haga.</p>
      <p>Ejemplo de buena pregunta:</p>
      <blockquote>Estoy aprendiendo Python. Mi programa da error al dividir dos datos que pido con input(). Explícame por qué sin darme la solución completa.</blockquote>
    </div>
  `,

  // PARTE 5 · Mejóralo
  mejoralo: `
    <div class="reto">
      <strong>Reto extra</strong>
      Pregunta también qué porcentaje de propina queréis dejar y súmalo al total antes de dividir.
    </div>
  `,

  // --- Editor y comprobación ---
  codigoInicial: [
    'total = input("¿Cuánto ha costado la cena? ")',
    'personas = input("¿Cuántos sois? ")',
    'print("Cada uno paga:", total / personas)',
  ].join("\n"),
  pista: "Lo que llega de input() es texto. ¿Qué función convierte un texto en número?",
  aprendido: ["Números", "float()", "Operaciones", "round()"],
  // Mensajes de error propios de esta lección
  errores: [
    {
      tipo: "TypeError",
      patron: /unsupported operand type\(s\) for \/.*'str'/,
      mensaje: "No se pueden dividir textos. Convierte lo que escribe la persona en número con float().",
    },
  ],
  // Pruebas: cuentas cuyo resultado es exacto, salga con round() o sin él
  pruebas: [
    { entradas: ["86", "4"], esperado: "Cada uno paga: 21.5" },
    { entradas: ["90", "3"], esperado: "Cada uno paga: 30.0" },
  ],
  // Además, el reto pide convertir lo que se escribe con float()
  requisito: (codigo) => /\bfloat\s*\(/.test(codigo),
  notaSiNoCorrecto:
    "Tu programa funciona, pero el reto pide usar float() para convertir en número lo que escribe la persona.",
};
