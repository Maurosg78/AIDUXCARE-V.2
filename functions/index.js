"use strict";

/**
 * Entry point mínimo para Cloud Functions en este proyecto.
 * Re-exporta explícitamente las funciones definidas en ./src
 * para que el CLI de Firebase pueda descubrirlas.
 */

// Importamos las funciones HTTP / callable
const { processImagingReport } = require("./src/processImagingReport.js");

// Importamos la función de Storage trigger
// TODO: Descomentar cuando processImagingReportStorage.js esté implementado
// const { processImagingReportStorage } = require("./src/processImagingReportStorage.js");

// Exportamos TODO lo que queremos que vea Firebase
module.exports = {
  processImagingReport,
  // processImagingReportStorage, // TODO: Descomentar cuando esté implementado
};
