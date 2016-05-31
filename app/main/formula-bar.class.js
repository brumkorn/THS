/**
 * Created by Brumkorn on 28.05.2016.
 */
let a = console.log.bind(console);
let inputConsoleSymbol = Symbol();
let listenersCacheSymbol = Symbol();

import Utils from "./utils.class.js";
import Cell from "./cell.class.js";

export default class FormulaBar {
  constructor() {
    this.formulaMode = false;
    this[listenersCacheSymbol] = [];
    this[inputConsoleSymbol] = document.querySelector(".input-console");
  }

  get inputConsole() {
    return this[inputConsoleSymbol];
  }

  switchTargetSheet(sheet) {
    let cls = this;
    removeListeners();
    addListeners();
    cls.translateCellToConsole(sheet);


    function addListeners() {
      cls[listenersCacheSymbol] = [
        {e: "focus", func: sheet.consoleFocusHdlr.bind(sheet)},
        {e: "input", func: sheet.consoleInputChangeHdlr.bind(sheet)},
        {e: "keydown", func: sheet.inputKeyDoneHdlr.bind(sheet)},
        {e: "blur", func: sheet.forcedFormulaModeFocusHdlr.bind(sheet)}
      ];

      cls[listenersCacheSymbol].forEach((listener) => {
        cls.inputConsole.addEventListener(listener["e"], listener["func"]);
      });
    }

    function removeListeners() {
      cls[listenersCacheSymbol].forEach((listener) => {
        cls.inputConsole.removeEventListener(listener["e"], listener["func"]);
      });
    }

    function showCellValueInConsole() {

    }
  }

  translateCellToConsole(sheet) {
    let cls = this;
    let {cellName} = Utils.getCellCoordinates(sheet.focusedCell);
    let cellValue;

    if (sheet.cellsList[cellName] instanceof Cell) {
      cellValue = sheet.cellsList[cellName].value;
    } else {
      cellValue = sheet.focusedCell.innerHTML;
    }

    cls.inputConsole.value = sheet.focusedCell.innerHTML !== "<input>" ?
      cellValue :
      sheet.inputCell.value;
  }
}


