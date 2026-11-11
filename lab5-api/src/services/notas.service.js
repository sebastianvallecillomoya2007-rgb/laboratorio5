const AppError = require('../utils/errors');

const notas = [];
let siguienteId = 1;

function listar() {
  return notas;
}

function buscar(id) {
  const nota = notas.find((elemento) => elemento.id === id);

  if (!nota) {
    throw new AppError(404, 'Nota no encontrada');
  }

  return nota;
}

function crear({ titulo, contenido }) {
  const nota = { id: siguienteId++, titulo, contenido };
  notas.push(nota);
  return nota;
}

function eliminar(id) {
  const nota = buscar(id);
  notas.splice(notas.indexOf(nota), 1);
}

module.exports = { listar, buscar, crear, eliminar };