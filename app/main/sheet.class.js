/**
 * Created by Brumkorn on 27.05.2016.
 */
let a = console.log.bind(console);

import Utils from "./utils.class.js";
import Cell from "./cell.class.js";
import InputCell from "./input-cell.class.js";


let sheetListenersSymbol = Symbol();
let currentRowsSymbol = Symbol();
let currentColumnsSymbol = Symbol();

export default class Sheet {
  constructor(columns, rows, sheetID, cellsList, formulaBar) {
    this.name = `Sheet${sheetID + 1}`;
    this.ID = sheetID;
    this[currentRowsSymbol] = 0;
    this[currentColumnsSymbol] = 0;
    this.formulaMode = false;

    this.cellsList = cellsList;
    this.formulaBar = formulaBar;
    this.inputCell = new InputCell();
    this.focusedCell = null;
    this.highlightedHeaders = {
      columns: [],
      rows: []
    };

    /* DOM nodes related to the sheet */
    this.sheetContainer = document.querySelector(".main>div:last-child");

    this.colHeaderList = this.sheetContainer
      .querySelector(".col-header ol");

    this.rowHeaderList = this.sheetContainer
      .querySelector(".row-header ol");

    this.tableWrapper = this.sheetContainer
      .querySelector(".table-wrapper");

    this.tbody = this.tableWrapper.querySelector("tbody");

    this.rowHeader = this.sheetContainer
      .querySelector(".row-header");

    this.colHeader = this.sheetContainer
      .querySelector(".col-header");

    this.corner = this.sheetContainer
      .querySelector(".col-header-wrapper div:first-child");

    /* Runs on initialization */
    this.addRows(rows);
    this.addColumns(columns);
    this.loadCellsData();
    _initCellFocus.call(this);
  }
  
  get currentRows() {
    return this[currentRowsSymbol];
  }
  
  get currentColumns() {
    return this[currentColumnsSymbol]
  }
  
  addListeners() {
    _listenersControl.call(this, true);
  }

  removeListeners() {
    _listenersControl.call(this, false);
  }

  addRows(rows = 1) {
    let cls = this;

    for (let i = 0; i < rows; i++) {
      let row = cls.tbody.insertRow(-1);
      insertRowHeader();
      cls[currentRowsSymbol]++;

      for (let j = 0; j < cls[currentColumnsSymbol]; j++) {
        let cell = row.insertCell(-1);
        cell.classList.add("data-cell");
        cell.tabIndex = cls[currentRowsSymbol] + "";
      }
    }

    function insertRowHeader() {
      cls.rowHeaderList.appendChild(document.createElement("li"));
    }
  }

  addColumns(columns = 1) {
    let cls = this;

    let rowList = cls.tbody.querySelectorAll("tr");

    cls[currentColumnsSymbol] += columns;

    for (let i = 0; i < cls[currentRowsSymbol]; i++) {

      for (let j = 0; j < columns; j++) {

        if (i === 0) {
          insertColHeader();
        }

        let cell = rowList[i].insertCell(-1);
        cell.classList.add("data-cell");
        cell.tabIndex = i + 1 + "";
      }
    }

    function insertColHeader() {
      cls.colHeaderList.appendChild(document.createElement("li"));
    }
  }

  loadCellsData() {
    let cls = this;

    for (let cell in cls.cellsList) {

      if (cls.cellsList.hasOwnProperty(cell)) {
        let currentCell,
          targetRow,
          targetCell;

        currentCell = cls.cellsList[cell];

        cls.cellsList[cell] = new Cell(
          currentCell.rowIndex,
          currentCell.colIndex,
          cls.tbody,
          currentCell.value,
          currentCell.computedValue);

        currentCell = cls.cellsList[cell];

        targetRow = cls.tbody.children[currentCell.rowIndex];

        targetCell = targetRow.children[currentCell.colIndex];
        targetCell.innerHTML = currentCell._computedValue;
      }

    }
  }

  removeLastFocus() {
    this.focusedCell
      .classList
      .remove("focused-cell", "focused-input-cell");
  }

  formulaModeToggle(inputDone = false) {

    if (inputDone) {
      this.formulaMode = false;
    } else {
      this.formulaMode = (this.inputCell.inputNode.value[0] === "=");
    }
  }

  /*
   *Events Handlers
   */
  invokeInputHdlr(event) {
    let cls = this;

    let input = cls.inputCell.inputNode;

    if (cls.formulaMode ||
      event.target === input ||
      event.keyCode === Utils.keyCode.backspace ||
      event.keyCode === Utils.keyCode.del) {
      return;
    }

    if (event.keyCode &&

      event.keyCode !== Utils.keyCode.enter) {
      input.value = "";

    } else if (cls.cellsList[cls.focusedCell.name]) {
      input.value = cls.cellsList[cls.focusedCell.name].value;
      _pickedCellsSync.call(this);
    }
    else {
      input.value = "";
    }

    cls.focusedCell.innerHTML = "";
    cls.focusedCell.appendChild(input);

    if (event.target.tagName === "TD") {
      input.focus();
    }
  }

  consoleFocusHdlr(event) {

    if (event.relatedTarget === this.inputCell.inputNode) return;

    this.invokeInputHdlr(event);
    this.removeLastFocus();
    _changeCellFocus.call(this, this.inputCell.inputNode.parentElement, "focused-input-cell");
  }

  consoleInputChangeHdlr() {
    this.inputCell.inputNode.value = this.formulaBar.inputConsole.value;
    this.inputCell.inputNode.dispatchEvent(new Event("input"));
    this.formulaModeToggle();
  }

  forcedFormulaModeFocusHdlr(event) {
    if (!this.formulaMode) return;

    let input = this.inputCell.inputNode;

    if (event.relatedTarget === input ||
      event.relatedTarget === this.formulaBar.inputConsole) return;

    input.parentElement.focus();
    event.target.focus();
  }

  inputKeyDoneHdlr(event) {
    
    // if (event.keyCode === Utils.keyCode.escape) {
    //   this.formulaModeToggle(true);
    //
    //   let nextFocusCell = this.inputCell.inputNode.parentElement;
    //
    //   setTimeout(function () {
    //     nextFocusCell.focus();
    //   }, 0);
    // }

    if (event.keyCode === Utils.keyCode.enter) {
      let {rowIndex, colIndex} =
        Utils.getCellCoordinates(this.inputCell.inputNode.parentElement);

      this.formulaModeToggle(true);

      let nextFocusCell = Utils.findCellOnSheet(rowIndex + 1, colIndex, this.tbody);

      setTimeout(function () {
        nextFocusCell.focus();
      }, 0);
    }
  }

  formulaPickCellHdlr(event) {

    if (!this.formulaMode) return;

    let input = this.inputCell.inputNode;

    if (event.target.nodeName !== "TD") return;

    if (input.value.search(Utils.regExp.pickingInputEnding) >= 0) {
      let linkEndingPos = input
        .value
        .search(Utils.regExp.cellLinkEnding);

      let {cellName} = Utils.getCellCoordinates(event);

      if (linkEndingPos >= 0) {
        input.value = input.value.slice(0, linkEndingPos);
      }

      input.value += cellName;
      this.formulaBar.inputConsole.value = input.value;
      this.inputCell.inputNode.dispatchEvent(new Event("input"));
    }
  }

  inputValueChangeHdlr() {
    let cls = this;

    cls.formulaModeToggle();
    cls.formulaBar.inputConsole.value = cls.inputCell.inputNode.value;
    _pickedCellsSync.call(cls);
  }

}

/* private function */

function _initCellFocus() {
  let cell = Utils.findCellOnSheet(0, 0, this.tbody);

  _changeCellFocus.call(this, cell, "focused-cell");
  this.highlightedHeaders.rows.push(this.rowHeaderList.children[0]);
  this.highlightedHeaders.columns.push(this.colHeaderList.children[0]);
  this.rowHeaderList.children[0].classList.add("cell-header-highlight");
  this.colHeaderList.children[0].classList.add("cell-header-highlight");
}

function _changeCellFocus(cellNode, className) {
  this.focusedCell = cellNode;
  this.focusedCell.name = Utils.getCellCoordinates(cellNode).cellName;
  this.focusedCell.classList.add(className);
}

function _hidePickedCells() {
  let cls = this;


  if (!cls.inputCell.inputNode.formulaPickedCells) return;

  for (let cell of cls.inputCell.inputNode.formulaPickedCells) {
    cell.style.border = "";
  }
}

function _pickedCellsSync() {
  let cls = this;
  _hidePickedCells.call(cls);

  let colorCounter = 0;
  if (cls.inputCell.inputNode.value[0] === "=") {

    let { linksCellNodes, linksCellNames } = Utils.parseExpression(cls.inputCell.inputNode.value, cls.tbody);

    cls.inputCell.inputNode.formulaPickedCells = linksCellNodes;

    for (let link of linksCellNodes) {

      if (colorCounter >= Utils.pickedCellColors.length) {
        colorCounter = 0;
      }

      link.style.border = `2px dashed ${Utils.pickedCellColors[colorCounter++]}`
    }
  }
}

function _listenersControl(active = true) {
  let cls = this;

  let input,
    cornerHeight,
    cornerWidth;

  input = cls.inputCell.inputNode;
  cornerHeight = parseFloat(window.getComputedStyle(cls.corner).height);
  cornerWidth = parseFloat(window.getComputedStyle(cls.corner).width);

  cls[sheetListenersSymbol] = [
    {e: "scroll", func: pullHeadersHdlr},
    {e: "scroll", func: dynamicAddCellsHdlr},
    {e: "focusin", func: focusinCellHdlr},
    {e: "focusin", func: headersHighlightHdlr},
    {e: "dblclick", func: cls.invokeInputHdlr.bind(cls)},
    {e: "keypress", func: cls.invokeInputHdlr.bind(cls)},
    {e: "keydown", func: clearCellDataHdlr},
    {e: "keydown", func: changeFocusHdlr},
    {e: "click", func: cls.formulaPickCellHdlr.bind(cls)}
  ];

  if (typeof active === "boolean" && active) {

    for (let {e,func} of cls[sheetListenersSymbol]) {
      cls.tableWrapper.addEventListener(e, func);
    }

    cls.inputCell.addListeners(cls);
  }

  if (typeof active === "boolean" && !active) {

    for (let {e, func} of cls[sheetListenersSymbol]) {
      cls.tableWrapper.removeEventListener(e, func);
    }

    cls.inputCell.removeListeners();
  }

  function inputDone() {

    if (cls.formulaMode === true) return;

    let {rowIndex, colIndex, cellName} = Utils
      .getCellCoordinates(input.parentNode);

    if (input.value === '') {
      input.parentNode.innerHTML = '';
      delete cls.cellsList[cellName];
      return;
    }

    if (!cls.cellsList[cellName] && input.value !== "") {
      cls.cellsList[cellName] = new Cell(rowIndex, colIndex, cls.tbody);
    }

    cls.cellsList[cellName].value = input.value;

    input.parentElement.innerHTML = input.value;
    synchronize();

    input.value = "";
    cls.formulaBar.inputConsole.value = input.value;
    _hidePickedCells.call(cls)
  }

  // function inputCancel() {
  //   let {cellName} = Utils
  //     .getCellCoordinates(input.parentNode);
  //
  //   if (cls.cellsList[cellName]) {
  //     input.parentNode.innerHTML = cls.cellsList[cellName].value;
  //   }
  //
  //   input.value = "";
  //   cls.formulaBar.inputConsole.value = input.value;
  //   _hidePickedCells.call(cls);
  // }

  function synchronize() {

    for (let cell in cls.cellsList) {

      if (cls.cellsList.hasOwnProperty(cell)) {
        let cellOnSheet = cls.cellsList[cell].cellNode;
        cellOnSheet.innerHTML = cls.cellsList[cell].computedValue;
      }
    }
  }

  /* Event handlers */

  function pullHeadersHdlr() {
    let rowHeader = cls.rowHeader,
      colHeader = cls.colHeader;
    rowHeader.style.top =
      cornerHeight - cls.tableWrapper.scrollTop + "px";
    colHeader.style.left =
      cornerWidth - cls.tableWrapper.scrollLeft + "px";
  }

  function dynamicAddCellsHdlr(event) {
    let sheet,
      toEdgeOfSheetCols,
      toEdgeOfSheetRows;

    sheet = event.currentTarget;
    toEdgeOfSheetCols = sheet.scrollWidth - (sheet.clientWidth + sheet.scrollLeft);
    toEdgeOfSheetRows = sheet.scrollHeight - (sheet.clientHeight + sheet.scrollTop);

    if (toEdgeOfSheetCols < 200) {
      cls.addColumns(10);
    }

    if (toEdgeOfSheetRows < 120) {
      cls.addRows(10);
    }
  }

  function focusinCellHdlr(event) {

    if (event.target === input) {
      cls.removeLastFocus();
      _changeCellFocus.call(cls, input.parentElement, "focused-input-cell");
    }

    if (cls.formulaMode === true) return;

    if (event.target.tagName === "TD") {
      if (cls.focusedCell.firstChild === input && event.target !== cls.focusedCell) {
        inputDone();
      }
      // else if (cls.focusedCell.firstChild == input) {
      //   a("Cancelling input");
      //   // inputCancel();
      // }

      cls.removeLastFocus();
      _changeCellFocus.call(cls, event.target, "focused-cell");

      cls.formulaBar.translateCellToConsole(cls);
    }
  }

  function headersHighlightHdlr(event) {

    if (cls.formulaMode === true) return;

    let removeHiglighted = () => {

      for (let item of cls.highlightedHeaders.columns) {
        item.classList.remove("cell-header-highlight")
      }
      cls.highlightedHeaders.columns.length = 0;

      for (let item of cls.highlightedHeaders.rows) {
        item.classList.remove("cell-header-highlight")
      }
      cls.highlightedHeaders.rows.length = 0;
    };

    if (event.target.tagName === "TD") {
      removeHiglighted();

      let rowIndex = event.target.parentElement.rowIndex;
      let colIndex = event.target.cellIndex;
      cls.rowHeaderList.children[rowIndex]
        .classList.add("cell-header-highlight");
      cls.colHeaderList.children[colIndex]
        .classList.add("cell-header-highlight");
      cls.highlightedHeaders
        .rows.push(cls.rowHeaderList.children[rowIndex]);
      cls.highlightedHeaders
        .columns.push(cls.colHeaderList.children[colIndex]);
    }
  }



  function clearCellDataHdlr(event) {

    if (event.target.tagName !== "TD") return;

    if (event.keyCode === Utils.keyCode.alt ||
      event.keyCode === Utils.keyCode.backspace) {
      event.preventDefault();
    }

    if (event.target.innerHTML === "") return;

    if (event.keyCode === Utils.keyCode.backspace ||
      event.keyCode === Utils.keyCode.del) {

      let {cellName} = Utils.getCellCoordinates(event);

      delete cls.cellsList[cellName];

      input.dispatchEvent(new Event('input'));
      event.target.innerHTML = "";
      synchronize();
    }
  }

  function changeFocusHdlr(event) {

    if (event.target === input &&
      Utils.keyCode.arrows.includes(event.keyCode)) {
      return;
    }

    if (Utils.keyCode.arrows.includes(event.keyCode)) {
      let {rowIndex, colIndex} = Utils.getCellCoordinates(event);

      event.preventDefault();

      switch (event.keyCode) {
        case Utils.keyCode.arrowLeft:
          colIndex = colIndex || 1;
          Utils.findCellOnSheet(rowIndex, colIndex - 1, cls.tbody).focus();
          break;
        case Utils.keyCode.arroRight:
          Utils.findCellOnSheet(rowIndex, colIndex + 1, cls.tbody).focus();
          break;
        case Utils.keyCode.arrowDown:
          Utils.findCellOnSheet(rowIndex + 1, colIndex, cls.tbody).focus();
          break;
        case Utils.keyCode.arrowUp:
          rowIndex = rowIndex || 1;
          Utils.findCellOnSheet(rowIndex - 1, colIndex, cls.tbody).focus();
          break;
      }
    }
  }
}

