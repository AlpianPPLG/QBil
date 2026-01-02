/*
  Lightweight jsPDF plugin wiring for importing/merging PDFs.

  This file is a side-effect import that attaches `processPDF` to jsPDF instances.
  It uses the official jsPDF plugin package.
*/

import "jspdf";
import "jspdf/dist/polyfills.es.js";
import "jspdf/dist/jspdf.es.min.js";

// The plugin augments jsPDF API.
// eslint-disable-next-line import/no-unresolved
import "jspdf/dist/jspdf.plugin.pdf.js";

