# Paso Cero

Web para aprender a programar en Python desde cero, en castellano. El código se escribe y se ejecuta directamente en el navegador, sin instalar nada.

## Tecnologías

- HTML, CSS y JavaScript, sin frameworks
- [CodeMirror 5](https://codemirror.net/5/) para el editor de código
- [Pyodide](https://pyodide.org/) para ejecutar Python en el navegador

Las dos librerías se cargan desde un CDN, así que hace falta conexión a internet.

## Estructura

```
paso-cero/
├── index.html        Página de inicio con el mapa de proyectos
├── leccion.html      Plantilla: vale para todas las lecciones
│                     (se abre como leccion.html?p=2)
├── css/estilos.css   Estilos compartidos (pensados primero para móvil)
└── js/
    ├── ajustes.js    Límites contra bucles infinitos y versión de Pyodide
    ├── progreso.js   Lista de proyectos y progreso guardado en el navegador
    ├── mapa.js       Dibuja el mapa de la página de inicio
    ├── plantilla.js  Monta la lección que pide la dirección
    ├── leccion.js    Editor, input() dentro de la página, comprobación,
    │                 errores en castellano y pantalla de proyecto terminado
    ├── python-worker.js
    │                 Ejecuta Python (Pyodide) en segundo plano. Si un programa
    │                 se atasca en un bucle infinito, se para sin congelar la página
    └── lecciones/    El contenido de cada lección, uno por archivo
        ├── leccion-1.js
        ├── leccion-2.js
        └── leccion-3.js
```

## Añadir un proyecto nuevo

1. Copia `js/lecciones/leccion-3.js` como `leccion-4.js` y cambia su contenido:
   `numero`, los textos de las cinco partes (`reto`, `saber`, `textoReto`, `ia`,
   `mejoralo`), el `codigoInicial`, la `pista`, lo `aprendido`, los `errores`
   propios y las `pruebas`.
2. En `js/progreso.js`, pon el título, la descripción y la `url`
   (`"leccion.html?p=4"`) de ese proyecto.

No hay que tocar ningún HTML: la plantilla y el mapa se actualizan solos.

## Cómo se comprueba una lección

Cada lección lleva en su `LECCION` una lista de `pruebas`. Al pulsar «Comprobar»,
el programa se ejecuta una vez por prueba: `input()` toma las respuestas de
`entradas` en vez de preguntar, y lo que imprime se compara con `esperado`
(ignorando espacios sobrantes y mayúsculas). Solo si todas coinciden se supera.

```js
pruebas: [
  { entradas: ["Lucía"], esperado: "¡Hola, Lucía!" },
  { entradas: ["Jesús"], esperado: "¡Hola, Jesús!" },
],
```

Conviene usar datos distintos en cada prueba: así se detecta a quien escribe la
respuesta a mano en vez de usar la variable.

Opcionales:

- `preparacion`: código Python que se ejecuta antes del programa. Sirve para
  fijar el azar (`random.seed(1)`) y que el resultado sea siempre el mismo.
- `requisito`: función que recibe el código y exige algo más (por ejemplo, que
  use `float()`). Si no se cumple, se muestra `notaSiNoCorrecto`.

### Fallos típicos

Cuando el programa funciona pero el resultado no coincide, el recuadro se titula
«Casi lo tienes» y debajo de la comparación aparece un consejo. Los consejos
comunes están en `FALLOS_TIPICOS`, en `js/leccion.js`: detectan que ha salido el
nombre de una variable (se quedó dentro de las comillas) o que solo cambian
espacios y signos. Si ninguno encaja, se muestra «Fíjate en la diferencia».

Una lección puede añadir los suyos con `fallosTipicos`, que se prueban primero:

```js
fallosTipicos: [
  ({ esperado, obtenido, codigo }) =>
    obtenido.includes(",") ? "En Python los decimales van con punto, no con coma." : null,
],
```

Cada uno recibe el resultado esperado, el obtenido y el código, y devuelve el
consejo o `null` si no es su caso.

El botón «Ejecutar» es otra cosa: ejecuta el programa respondiendo la persona a
mano, para probarlo o jugar, y no da nada por superado.

El progreso de cada persona se guarda en su navegador (`localStorage`). Para empezar de cero, borra los datos del sitio desde el navegador.

## Probarlo en tu ordenador

Desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Después abre <http://localhost:8000> en el navegador. Para parar el servidor, pulsa `Ctrl + C` en la terminal.
