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
├── leccion-1.html    Proyecto 1: Tu primer programa
├── leccion-2.html    Proyecto 2: Gastos compartidos
├── css/estilos.css   Estilos compartidos (pensados primero para móvil)
└── js/
    ├── progreso.js   Lista de proyectos y progreso guardado en el navegador
    ├── mapa.js       Dibuja el mapa de la página de inicio
    └── leccion.js    Editor, ejecución de Python, input() dentro de la página,
                      errores en castellano y pantalla de proyecto terminado
```

## Añadir un proyecto nuevo

1. Copia `leccion-2.html` con el nuevo número y cambia el texto y el objeto `LECCION` del final.
2. En `js/progreso.js`, pon su `url` en la lista `PROYECTOS` (o añádelo si no está).

El progreso de cada persona se guarda en su navegador (`localStorage`). Para empezar de cero, borra los datos del sitio desde el navegador.

## Probarlo en tu ordenador

Desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Después abre <http://localhost:8000> en el navegador. Para parar el servidor, pulsa `Ctrl + C` en la terminal.
