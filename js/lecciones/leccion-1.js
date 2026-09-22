// ==========================================================
// Paso Cero — contenido del proyecto 1
// El título y la descripción están en js/progreso.js
// ==========================================================

window.LECCION = {
  numero: 1,

  // PARTE 1 · El reto
  reto: `
    <p>Vamos a hacer que el ordenador te pregunte tu nombre y te salude. Es el primer programa que escribe todo el mundo, y en 5 minutos lo tendrás funcionando.</p>
  `,

  // PARTE 2 · Lo que necesitas saber
  saber: `
    <!-- EXPLICACIÓN 1 -->
          <article class="explicacion">
            <h3>Dar órdenes</h3>
            <p>Programar es escribir una lista de instrucciones, como una receta. El ordenador las lee de arriba abajo, una por una, y hace exactamente lo que pone. Ni más, ni menos, ni en otro orden.</p>

            <div class="ejemplo">
              <pre class="codigo"><code>print("Hola")
    print("Qué tal")</code></pre>
              <p class="pie-ejemplo">Sale por pantalla:</p>
              <pre class="pantalla">Hola
    Qué tal</pre>
            </div>

            <p><code>print</code> es la orden para mostrar algo en pantalla. Es la que más vas a usar, porque es tu forma de ver qué está pasando dentro del programa.</p>
            <p class="fallo"><strong>Fallo típico:</strong> escribir <code>Print</code> o <code>PRINT</code>. Python distingue mayúsculas y minúsculas: para él, <code>print</code> y <code>Print</code> son dos palabras distintas. Va siempre en minúscula.</p>
          </article>

          <!-- EXPLICACIÓN 2 -->
          <article class="explicacion">
            <h3>Las comillas</h3>
            <p>Las comillas son como decir «esto que viene es un texto, no me lo interpretes, repítelo tal cual».</p>

            <div class="ejemplo">
              <pre class="codigo"><code>print("Hola")</code></pre>
              <p class="pie-ejemplo">Sale por pantalla:</p>
              <pre class="pantalla">Hola</pre>
            </div>

            <p>Sin comillas, Python cree que le estás nombrando algo que debería conocer, y como no lo conoce, se queja.</p>
            <p class="fallo"><strong>Fallo típico:</strong> abrir comillas y no cerrarlas. Van siempre en pareja: una al principio y otra al final. Si ves un error que habla de un texto sin terminar, busca la comilla que falta.</p>
          </article>

          <!-- EXPLICACIÓN 3 -->
          <article class="explicacion">
            <h3>La cajita con etiqueta</h3>
            <p>Imagina una caja con una etiqueta pegada. Dentro guardas algo y, cuando lo necesitas, lo pides por el nombre de la etiqueta.</p>

            <div class="ejemplo">
              <pre class="codigo"><code>nombre = "Lucía"
    print(nombre)</code></pre>
              <p class="pie-ejemplo">Sale por pantalla:</p>
              <pre class="pantalla">Lucía</pre>
            </div>

            <p>Fíjate en que aquí <code>nombre</code> va <strong>sin comillas</strong> dentro del <code>print</code>. Con comillas saldría la palabra «nombre»; sin comillas, sale lo que hay guardado dentro.</p>
            <p>Sirve para guardar datos que cambian, como el nombre de quien está usando tu programa.</p>
            <p>Los programadores a estas cajitas las llaman <strong>variables</strong>. Ahora que sabes lo que son, el nombre ya no asusta.</p>
            <p class="fallo"><strong>Fallo típico:</strong> confundir cuándo poner comillas. Regla corta: con comillas = el texto tal cual; sin comillas = mira qué hay dentro de la caja.</p>
          </article>

          <!-- EXPLICACIÓN 4 -->
          <article class="explicacion">
            <h3>Preguntar a la persona</h3>
            <p>Hasta ahora tú decidías todo. <code>input</code> es como pasarle un papel a quien usa el programa para que escriba su respuesta, y quedarte con ese papel.</p>

            <div class="ejemplo">
              <pre class="codigo"><code>nombre = input("¿Cómo te llamas? ")
    print("¡Hola, " + nombre + "!")</code></pre>
              <p class="pie-ejemplo">Si la persona escribe <code>Lucía</code>, sale por pantalla:</p>
              <pre class="pantalla">¿Cómo te llamas? Lucía
    ¡Hola, Lucía!</pre>
            </div>

            <p>Es lo que convierte un programa en algo útil. Sin <code>input</code>, tu programa haría siempre lo mismo.</p>
            <p>El signo <code>+</code> aquí sirve para pegar textos, uno detrás de otro. Por eso hay un espacio antes de las comillas en <code>"¡Hola, "</code>: si no, saldría todo junto.</p>
            <p class="fallo"><strong>Fallo típico:</strong> olvidarse de cerrar el paréntesis del final. Todo lo que abres con <code>(</code> hay que cerrarlo con <code>)</code>. Si Python dice que se esperaba algo más, cuenta los paréntesis.</p>
          </article>
  `,

  // PARTE 3 · Constrúyelo tú
  textoReto: `Este programa tiene un fallo. Pulsa «Comprobar» y arréglalo.`,

  // PARTE 4 · Constrúyelo con IA
  ia: `
    <div class="aviso">
      <p>Una IA puede escribirte este programa en un segundo, pero entonces no aprendes tú. Úsala al revés: cuando algo no te encaje, pídele que te lo explique.</p>
      <p>Ejemplo:</p>
      <blockquote>Explícame por qué nombre va sin comillas dentro del print, como si nunca hubiera programado.</blockquote>
    </div>
  `,

  // PARTE 5 · Mejóralo
  mejoralo: `
    <div class="reto">
      <strong>Reto extra</strong>
      Pregunta también la ciudad y saluda con las dos cosas.
      <p>Por ejemplo: <code>¡Hola, Lucía! ¿Qué tal por Elche?</code></p>
    </div>
  `,

  // --- Editor y comprobación ---
  codigoInicial: [
    'nombre = input("¿Cómo te llamas? ")',
    'print("¡Hola, " + nombre + "!"',
  ].join("\n"),
  pista: "Cuenta los paréntesis de la línea 2. ¿Abres los mismos que cierras?",
  aprendido: ["print()", "Comillas", "Variables", "input()"],
  // Mensajes de error propios de esta lección
  errores: [
    {
      tipo: "SyntaxError",
      patron: /never closed/,
      mensaje: "Te ha faltado cerrar un paréntesis. Todo lo que se abre tiene que cerrarse.",
    },
    {
      tipo: "SyntaxError",
      patron: /unterminated string|EOL while scanning/,
      mensaje: "Te ha faltado cerrar unas comillas. Van siempre en pareja.",
    },
  ],
  // Pruebas: se ejecuta el programa con estas respuestas y lo que
  // imprime tiene que ser exactamente lo esperado.
  // Son dos nombres distintos a propósito: así se nota si alguien
  // ha escrito el nombre a mano en vez de usar la variable.
  pruebas: [
    { entradas: ["Lucía"], esperado: "¡Hola, Lucía!" },
    { entradas: ["Jesús"], esperado: "¡Hola, Jesús!" },
  ],
};
