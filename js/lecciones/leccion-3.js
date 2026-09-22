// ==========================================================
// Paso Cero — contenido del proyecto 3
// El título y la descripción están en js/progreso.js
// ==========================================================

window.LECCION = {
  numero: 3,

  // PARTE 1 · El reto
  reto: `
    <p>El ordenador piensa un número del 1 al 10 y tú tienes que adivinarlo. Te irá diciendo si te pasas o te quedas corto. Vamos a crear tu primer juego.</p>
  `,

  // PARTE 2 · Lo que necesitas saber
  saber: `
    <ul class="lista-conceptos">
      <li><strong>Números al azar:</strong> primero escribes <code>import random</code>, y luego <code>random.randint(1, 10)</code> elige un número entre 1 y 10.</li>
      <li><strong>Tomar decisiones con <code>if</code>:</strong> «si pasa esto, haz aquello». Para comparar se usa <code>==</code> (dos iguales). Un solo <code>=</code> sirve para guardar datos en una cajita, no para comparar.</li>
      <li><strong><code>elif</code> y <code>else</code>:</strong> «si no, pero si pasa esto otro…» y «en cualquier otro caso…».</li>
      <li><strong>Repetir con <code>while</code>:</strong> «mientras no aciertes, sigue preguntando».</li>
      <li><strong>Los espacios del principio de la línea importan:</strong> lo que va dentro de un <code>if</code> o un <code>while</code> se escribe un poco más a la derecha. Es la forma que tiene Python de saber qué va dentro.</li>
    </ul>
  `,

  // PARTE 3 · Constrúyelo tú
  textoReto: `Este juego tiene un fallo. Pulsa «Comprobar» y arréglalo.`,

  // PARTE 4 · Constrúyelo con IA
  ia: `
    <div class="aviso">
      <p><strong>Truco:</strong> cuando no entiendas un código, pídele a la IA que te lo explique línea a línea.</p>
      <p>Ejemplo:</p>
      <blockquote>Explícame qué hace cada línea de este código como si nunca hubiera programado.</blockquote>
      <p>Luego intenta explicárselo tú a ella con tus palabras: si puedes, lo has entendido.</p>
    </div>
  `,

  // PARTE 5 · Mejóralo
  mejoralo: `
    <div class="reto">
      <strong>Reto extra</strong>
      Cuenta cuántos intentos has necesitado y muéstralo al acertar.
      <p><em>Pista:</em> crea una cajita llamada <code>intentos</code> que empiece en 0 y súmale 1 cada vez que preguntes.</p>
    </div>
  `,

  // --- Editor y comprobación ---
  codigoInicial: [
    "import random",
    "",
    "secreto = random.randint(1, 10)",
    "intento = 0",
    "",
    "while intento != secreto:",
    '    intento = int(input("Di un número del 1 al 10: "))',
    "    if intento = secreto:",
    '        print("¡Has acertado!")',
    "    elif intento < secreto:",
    '        print("Te has quedado corto")',
    "    else:",
    '        print("Te has pasado")',
  ].join("\n"),
  pista: "Mira la línea del if. ¿Estás guardando un dato o comparando dos?",
  aprendido: ["if / elif / else", "while", "==", "random"],
  // Mensajes de error propios de esta lección
  errores: [
    {
      // Un solo = en la línea de un if, elif o while
      tipo: "SyntaxError",
      linea: /^\s*(if|elif|while)\b.*[^=!<>]=(?!=)/,
      mensaje: "Para comparar se usan dos iguales (==). Uno solo (=) sirve para guardar datos.",
    },
    {
      tipo: "IndentationError",
      mensaje: "Revisa los espacios al principio de la línea. Lo que va dentro de un if o un while tiene que ir un poco más a la derecha.",
    },
  ],
  // Pruebas: durante la comprobación se fija la semilla del azar, así
  // el número secreto es siempre el mismo y se sabe qué debe salir.
  // Con la semilla 1 el secreto es 3; con la semilla 7, el 6.
  pruebas: [
    {
      preparacion: "import random\nrandom.seed(1)",
      entradas: ["5", "2", "3"],
      esperado: ["Te has pasado", "Te has quedado corto", "¡Has acertado!"].join("\n"),
    },
    {
      preparacion: "import random\nrandom.seed(7)",
      entradas: ["3", "8", "6"],
      esperado: ["Te has quedado corto", "Te has pasado", "¡Has acertado!"].join("\n"),
    },
  ],
};
