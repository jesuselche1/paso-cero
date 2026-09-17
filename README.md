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
├── index.html        Página de inicio
├── leccion-1.html    Lección 1: tu primer programa
├── css/estilos.css   Estilos compartidos (pensados primero para móvil)
└── js/leccion.js     Editor, ejecución de Python y errores en castellano
```

## Probarlo en tu ordenador

Desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Después abre <http://localhost:8000> en el navegador. Para parar el servidor, pulsa `Ctrl + C` en la terminal.
