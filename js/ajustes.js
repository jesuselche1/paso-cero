// ==========================================================
// Paso Cero — ajustes en un solo sitio
// Este archivo lo usan tanto la página como el trabajador de Python.
// ==========================================================

// Si un programa pasa este tiempo sin terminar (sin contar lo que espera
// a que la persona escriba), lo paramos: seguramente es un bucle infinito.
const LIMITE_SEGUNDOS = 5;

// Si un programa escribe más letras que esto, también lo paramos:
// es lo que pasa con un bucle que imprime sin parar.
const LIMITE_SALIDA = 50000;

// Versión de Pyodide (el Python que funciona dentro del navegador)
const URL_PYODIDE = "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/";
