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
let copyBufferSymbol = Symbol();
let areaSelectedNodesSymbol = Symbol();
let selectingCornerSymbol = Symbol();

export default class Sheet {
  constructor(columns, rows, sheetID, cellsList, formulaBar) {
    this.name = `Sheet${sheetID + 1}`;
    this.ID = sheetID;
    this[currentRowsSymbol] = 0;
    this[currentColumnsSymbol] = 0;
    this[areaSelectedNodesSymbol] = [];
    this[copyBufferSymbol] = [];
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

    this.rowHeader = this.sheetContainer
      .querySelector(".row-header");

    this.colHeader = this.sheetContainer
      .querySelector(".col-header");

    this.colHeaderList = this.sheetContainer
      .querySelector(".col-header ol");

    this.rowHeaderList = this.sheetContainer
      .querySelector(".row-header ol");

    this.tableWrapper = this.sheetContainer
      .querySelector(".table-wrapper");

    this.tbody = this.tableWrapper.querySelector("tbody");


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
      let li = cls.rowHeaderList
        .appendChild(document.createElement("li"));

      li.appendChild(document.createElement("span"));


      li.appendChild(document.createElement("div"))
        .classList.add("resizer-horizontal");
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
      let li = cls.colHeaderList
        .appendChild(document.createElement("li"));

      li.appendChild(document.createElement("span"));


      li.appendChild(document.createElement("div"))
        .classList.add("resizer-vertical");
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
        targetCell.innerHTML = currentCell.computedValue;
      }

    }
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

function _changeCellFocus(cellNode, className = "focused-cell") {
  let cls = this;

  if (cls.focusedCell) {
    cls.focusedCell
      .classList
      .remove("focused-cell", "focused-input-cell");
  }

  for (let row of cls[areaSelectedNodesSymbol]) {
    for (let cellNode of row) {
      cellNode.classList.remove("area-selected");
      cellNode.style.border = "";
    }
  }
  cls[areaSelectedNodesSymbol].length = 0;


  cls.focusedCell = cellNode;
  cls.focusedCell.name = Utils.getCellCoordinates(cellNode).cellName;
  cellNode.classList.add(className);
  _changeSelectingCorner.call(cls, cellNode)

}

function _changeSelectingCorner(cellNode) {
  // if (this[selectingCornerSymbol]) {
  //   this[selectingCornerSymbol]
  //     .classList
  //     .remove("selecting-corner");
  // }

  this[selectingCornerSymbol] = cellNode;
  // cellNode.classList.add("selecting-corner");
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

    let {linksCellNodes} = Utils.parseExpression(cls.inputCell.inputNode.value, cls.tbody);

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
    cornerWidth,
    selectingListeners,
    resizingListeners;

  input = cls.inputCell.inputNode;
  cornerHeight = parseFloat(window.getComputedStyle(cls.corner).height);
  cornerWidth = parseFloat(window.getComputedStyle(cls.corner).width);



  selectingListeners = new Map();

  selectingListeners.set("sheetArea", {
    element: cls.tbody,
    e: "mouseover",
    func: mouseSelectAreaHdlr
  });

  selectingListeners.set("rows", {
    element: cls.rowHeaderList,
    e: "mouseover",
    func: mouseSelectRowsHdlr
  });

  selectingListeners.set("columns", {
    element: cls.colHeaderList,
    e: "mouseover",
    func: mouseSelectColsHdlr
  });

  resizingListeners = new Map();

  resizingListeners.set("rows", {
    element: cls.rowHeaderList,
    e: "mousemove",
    func: resizeRowHdlr
  });

  resizingListeners.set("columns", {
    element: cls.colHeaderList,
    e: "mousemove",
    func: resizeColHdlr
  });




  cls[sheetListenersSymbol] = [
    {element: cls.tableWrapper, e: "scroll", func: pullHeadersHdlr},
    {element: cls.tbody, e: "scroll", func: dynamicAddCellsHdlr},
    {element: cls.tbody, e: "focusin", func: focusinCellHdlr},
    {element: cls.tbody, e: "dblclick", func: cls.invokeInputHdlr.bind(cls)},
    {element: cls.tbody, e: "keypress", func: cls.invokeInputHdlr.bind(cls)},
    {element: cls.sheetContainer, e: "keyup", func: copyCellHdlr},
    {element: cls.sheetContainer, e: "keyup", func: pasteCellHdlr},
    {element: cls.tbody, e: "keydown", func: clearCellDataHdlr},
    {element: cls.tbody, e: "keydown", func: keyChangeFocusHdlr},
    {element: cls.tbody, e: "keydown", func: keySelectAreaHdlr},
    {element: cls.tbody, e: "click", func: cls.formulaPickCellHdlr.bind(cls)},
    /* Selecting area by mouse drag */
    {element: cls.tbody, e: "mousedown", func: initSelectingHdlr},
    {
      element: cls.tbody,
      e: "mouseup",
      func: finishSelectingHdlr
    },
    /* Selecting headers*/
    {element: cls.rowHeaderList, e: "mousedown", func: initRowSelectingHdlr},
    {
      element: cls.rowHeaderList,
      e: "mouseup",
      func: finishSelectingHdlr
    },
    {element: cls.colHeaderList, e: "mousedown", func: initColSelectingHdlr},
    {element: cls.colHeaderList, e: "mouseup", func: finishSelectingHdlr},

    {element: cls.corner, e: "click", func: selectAllHdlr},

    {element: cls.colHeaderList, e: "mousedown", func: initColResizeHdlr},
    {element: cls.rowHeaderList, e: "mousedown", func: initRowResizeHdlr},
    {element: cls.colHeaderList, e: "mouseup", func: finishResizeHdlr},
    {element: cls.rowHeaderList, e: "mouseup", func: finishResizeHdlr}
  ];

  if (typeof active === "boolean" && active) {

    for (let {element, e, func} of cls[sheetListenersSymbol]) {
      element.addEventListener(e, func);
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

    if (cls.formulaMode) return;

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

  function selectArea() {

    let focus,
      corner,
      tempSelectedNodes,
      highlightHeaderNodes,
      firstCell;

    /* Focused cell coords */
    focus = Utils.getCellCoordinates(cls.focusedCell);

    /* Corner cell coords */
    corner = Utils.getCellCoordinates(cls[selectingCornerSymbol]);

    tempSelectedNodes = [];
    highlightHeaderNodes = [];
    firstCell = {};

    for (let row of cls[areaSelectedNodesSymbol]) {
      for (let cellNode of row) {
        cellNode.classList.remove("area-selected");
        cellNode.style.border = "";
      }
    }

    firstCell.rowIndex = focus.rowIndex <= corner.rowIndex ? focus.rowIndex : corner.rowIndex;
    firstCell.colIndex = focus.colIndex <= corner.colIndex ? focus.colIndex : corner.colIndex;

    for (let i = 0; i <= Math.abs(corner.rowIndex - focus.rowIndex); i++) {
      tempSelectedNodes.push([]);
      for (let j = 0; j <= Math.abs(corner.colIndex - focus.colIndex); j++) {
        let cell = Utils.findCellOnSheet(firstCell.rowIndex + i, firstCell.colIndex + j, cls.tbody);
        tempSelectedNodes[i].push(cell);
        cell.classList.add('area-selected');

        if (i === 0) {
          highlightHeaderNodes.push(cell);
        }
        if (i > 0 && j === 0) {
          highlightHeaderNodes.push(cell);
        }
      }
    }

    if (cls.focusedCell === cls[selectingCornerSymbol]) {
      cls.focusedCell.classList.remove("area-selected");
    }

    console.log("tempSelected", tempSelectedNodes);

    highlightHeaders(highlightHeaderNodes);
    cls[areaSelectedNodesSymbol] = tempSelectedNodes;
  }

  function makeSelectedBorder() {
    cls[areaSelectedNodesSymbol].forEach(function (row, i, area) {
      row.forEach(function (cellNode, j) {
        if (cellNode === cls.focusedCell) return;
        if (j === 0) {
          cellNode.style.borderLeft = "1px double #4c74fa"
        }
        if (j === row.length - 1) {
          cellNode.style.borderRight = "1px solid #4c74fa"
        }
        if (i === 0) {
          cellNode.style.borderTop = "1px double #4c74fa"
        }
        if (i === area.length - 1) {
          cellNode.style.borderBottom = "1px solid #4c74fa"
        }
      })
    });
  }

  /* Event handlers */

  function pasteCellHdlr(event) {
    if (!event.ctrlKey) return;
    if (event.keyCode !== Utils.keyCode.keyV || !cls[copyBufferSymbol].length ||
      event.target.nodeName !== "TD") return;
    event.preventDefault();

    let {rowIndex: startRow, colIndex: startCol} = Utils.getCellCoordinates(event.target);
    debugger;
    cls[copyBufferSymbol].forEach(function (row, i) {
      row.forEach(function (cellValue, j) {
        let cellName = Utils.getCellName(startRow + i, startCol + j);
        if (cellValue.length > 0) {
          if (!cls.cellsList[cellName]) {
            cls.cellsList[cellName] = new Cell(startRow + i, startCol + j, cls.tbody);
          }
          cls.cellsList[cellName].value = cellValue;
        }
      })
    });
  }

  function copyCellHdlr(event) {
    if (!event.ctrlKey) return;
    console.log("Copy cell handler: ");
    if (event.keyCode !== Utils.keyCode.keyC) return;
    event.preventDefault();


    let {cellName} = Utils.getCellCoordinates(cls.focusedCell);

    if (!cls[areaSelectedNodesSymbol].length) {
      if (!cls.cellsList[cellName]) return;
      cls[copyBufferSymbol] = [[cls.cellsList[cellName].value]];
      console.log("Copy cell handler: ", cls[copyBufferSymbol]);
      return
    }

    let tempBuffer = [];
    cls[areaSelectedNodesSymbol].forEach(function (row, i) {
      tempBuffer.push([]);
      console.log(row);
      row.forEach(function (cellNode) {
        let {cellName} = Utils.getCellCoordinates(cellNode);
        if (cls.cellsList[cellName]) {
          tempBuffer[i].push(cls.cellsList[cellName].value);
        } else {
          tempBuffer[i].push("");
        }
      });
    });

    cls[copyBufferSymbol] = tempBuffer;

    console.log("Copy cell handler: ", cls[copyBufferSymbol]);
  }

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
      _changeCellFocus.call(cls, input.parentElement, "focused-input-cell");
    }

    if (cls.formulaMode) return;

    if (event.target.tagName === "TD") {
      if (cls.focusedCell.firstChild === input && event.target !== cls.focusedCell) {
        inputDone();
      }
      // else if (cls.focusedCell.firstChild == input) {
      //   a("Cancelling input");
      //   // inputCancel();
      // }

      _changeCellFocus.call(cls, event.target, "focused-cell");
      highlightHeaders([event.target]);

      cls.formulaBar.translateCellToConsole(cls);
    }
  }

  function highlightHeaders(cellNodes) {

    if (cls.formulaMode === true) return;

    removeHiglighted();

    for (let cellNode of cellNodes) {
      let {rowIndex, colIndex} = Utils.getCellCoordinates(cellNode);

      cls.rowHeaderList.children[rowIndex]
        .classList.add("cell-header-highlight");
      cls.colHeaderList.children[colIndex]
        .classList.add("cell-header-highlight");
      cls.highlightedHeaders
        .rows.push(cls.rowHeaderList.children[rowIndex]);
      cls.highlightedHeaders
        .columns.push(cls.colHeaderList.children[colIndex]);
    }

    function removeHiglighted() {

      for (let item of cls.highlightedHeaders.columns) {
        item.classList.remove("cell-header-highlight")
      }
      cls.highlightedHeaders.columns.length = 0;

      for (let item of cls.highlightedHeaders.rows) {
        item.classList.remove("cell-header-highlight")
      }
      cls.highlightedHeaders.rows.length = 0;
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
      event.target.dispatchEvent(new Event('change'));

    }
  }

  function keyChangeFocusHdlr(event) {

    if (event.target === input &&
      Utils.keyCode.arrows.includes(event.keyCode) ||
      event.shiftKey) {
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
        case Utils.keyCode.arrowRight:
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

  /*Resize handlers */

  function initColResizeHdlr(event) {
    if (event.target.className !== "resizer-vertical") return;
    let colIndex,
      resizableColCell;
    colIndex = Array.prototype.indexOf.call(cls.colHeaderList.childNodes, event.path[1]);
    resizableColCell = Utils.findCellOnSheet(0, colIndex, cls.tbody);

    resizingListeners.set("columns", {
      element: cls.colHeaderList,
      e: "mousemove",
      func: resizeColHdlr.bind(null, event, event.path[1].clientWidth, resizableColCell)
    });

    let {element, e, func} = resizingListeners.get("columns");
    element.addEventListener(e, func);
  }

  function initRowResizeHdlr(event) {
    if (event.target.className !== "resizer-horizontal") return;

    let rowIndex,
      resizableRowCell;
    rowIndex = Array.prototype.indexOf.call(cls.rowHeaderList.childNodes, event.path[1]);
    resizableRowCell = Utils.findCellOnSheet(rowIndex, 0, cls.tbody);

    resizingListeners.set("rows", {
      element: cls.rowHeaderList,
      e: "mousemove",
      func: resizeRowHdlr.bind(null, event, event.path[1].clientHeight, resizableRowCell)
    });

    let {element, e, func} = resizingListeners.get("rows");
    element.addEventListener(e, func);
  }

  function finishResizeHdlr() {
    if (cls.formulaMode) return;
    for (let {element, e, func} of resizingListeners.values()) {
      element.removeEventListener(e, func);
    }

  }


  function resizeColHdlr(sourceEvent, initialWidth, resizableColCell, event) {
    console.log("resizing col", event, sourceEvent);
    let resizableLi,
      newWidth;

    resizableLi = sourceEvent.path[1];
    newWidth = event.clientX - sourceEvent.clientX + initialWidth;

    resizableColCell.style.minWidth = `${newWidth}px`;
    resizableColCell.style.maxWidth = `${newWidth}px`;
    resizableLi.style.minWidth = `${newWidth}px`;
    resizableLi.style.maxWidth = `${newWidth}px`;


    console.log("Change Width to", newWidth, initialWidth);
  }

  function resizeRowHdlr(sourceEvent, initialHeight, resizableRowCell, event) {
    console.log("resizing Row", event, sourceEvent);
    let resizableLi,
      newHeight;

    resizableLi = sourceEvent.path[1];
    newHeight = event.clientY - sourceEvent.clientY + initialHeight;

    resizableRowCell.style.height = `${newHeight}px`;
    resizableRowCell.style.height = `${newHeight}px`;
    resizableLi.style.minHeight = `${newHeight}px`;
    resizableLi.style.maxHeight = `${newHeight}px`;

    console.log("Change Height to", newHeight, initialHeight);
  }
  /* Selecting highlights */

  function keySelectAreaHdlr(event) {

    if (event.target === input &&
      Utils.keyCode.arrows.includes(event.keyCode) || !event.shiftKey ||
      cls.formulaMode) {
      return;
    }

    if (Utils.keyCode.arrows.includes(event.keyCode)) {
      let {rowIndex, colIndex} = Utils.getCellCoordinates(cls[selectingCornerSymbol]);

      event.preventDefault();
      switch (event.keyCode) {
        case Utils.keyCode.arrowLeft:
          colIndex = colIndex || 1;
          _changeSelectingCorner.call(cls, Utils.findCellOnSheet(rowIndex, colIndex - 1, cls.tbody));
          break;
        case Utils.keyCode.arrowRight:
          _changeSelectingCorner.call(cls, Utils.findCellOnSheet(rowIndex, colIndex + 1, cls.tbody));
          break;
        case Utils.keyCode.arrowDown:
          _changeSelectingCorner.call(cls, Utils.findCellOnSheet(rowIndex + 1, colIndex, cls.tbody));
          break;
        case Utils.keyCode.arrowUp:
          rowIndex = rowIndex || 1;
          _changeSelectingCorner.call(cls, Utils.findCellOnSheet(rowIndex - 1, colIndex, cls.tbody));
          break;
      }
      selectArea();
      makeSelectedBorder();
    }
  }

  function mouseSelectAreaHdlr(event) {
    if (cls.formulaMode) return;

    _changeSelectingCorner.call(cls, event.target);

    selectArea();
  }

  function mouseSelectRowsHdlr(event) {
    if (cls.formulaMode || event.target.nodeName !== "LI") return;
    let rowIndex,
      lastCell;

    console.log("row mouse over", event);

    rowIndex = Array.prototype.indexOf.call(cls.rowHeaderList.childNodes, event.target);
    lastCell = Utils.findCellOnSheet(rowIndex, cls[currentColumnsSymbol] - 1, cls.tbody);

    _changeSelectingCorner.call(cls, lastCell);
    selectArea();
  }

  function mouseSelectColsHdlr(event) {
    if (cls.formulaMode || event.target.nodeName !== "LI") return;
    let colIndex,
      lastCell;

    console.log("row mouse over", event);

    colIndex = Array.prototype.indexOf.call(cls.colHeaderList.childNodes, event.target);
    lastCell = Utils.findCellOnSheet(cls[currentRowsSymbol] - 1, colIndex, cls.tbody);

    _changeSelectingCorner.call(cls, lastCell);
    selectArea();
  }

  function initColSelectingHdlr(event) {
    if (cls.formulaMode || event.target.nodeName === "DIV") return;
    let colIndex,
      focusToNode,
      lastCell,
      eventTarget;

    eventTarget = event.target;
    if (event.target.nodeName !== "LI") {
      eventTarget = event.path[1]
    }

    colIndex = Array.prototype.indexOf.call(cls.colHeaderList.childNodes, eventTarget);
    focusToNode = Utils.findCellOnSheet(0, colIndex, cls.tbody);
    lastCell = Utils.findCellOnSheet(cls[currentRowsSymbol] - 1, colIndex, cls.tbody);

    _changeCellFocus.call(cls, focusToNode);
    _changeSelectingCorner.call(cls, lastCell);

    selectArea();

    let {element, e, func} = selectingListeners.get("columns");
    element.addEventListener(e, func);

  }

  function initRowSelectingHdlr(event) {
    if (cls.formulaMode || event.target.nodeName === "DIV" ) return;
    let rowIndex,
      focusToNode,
      lastCell,
      eventTarget;

    eventTarget = event.target
    if (event.target.nodeName !== "LI") {
      eventTarget = event.path[1]
    }


    console.log("ROW MOUSE DOWN", event);

    rowIndex = Array.prototype.indexOf.call(cls.rowHeaderList.childNodes, eventTarget);
    focusToNode = Utils.findCellOnSheet(rowIndex, 0, cls.tbody);
    lastCell = Utils.findCellOnSheet(rowIndex, cls[currentColumnsSymbol] - 1, cls.tbody);

    _changeCellFocus.call(cls, focusToNode);
    _changeSelectingCorner.call(cls, lastCell);

    selectArea();

    let {element, e, func} = selectingListeners.get("rows");
    element.addEventListener(e, func);
  }

  function initSelectingHdlr() {
    if (cls.formulaMode) return;
    let {element, e, func} = selectingListeners.get("sheetArea");
    element.addEventListener(e, func);
  }

  function finishSelectingHdlr() {
    if (cls.formulaMode) return;
    for (let {element, e, func} of selectingListeners.values()) {
      element.removeEventListener(e, func);
    }

    makeSelectedBorder();
  }

  function selectAllHdlr() {
    if (cls.formulaMode) return;
    let firstCell,
      lastCell;

    firstCell = Utils.findCellOnSheet(0, 0, cls.tbody);
    lastCell = Utils.findCellOnSheet(cls[currentRowsSymbol] - 1,
      cls[currentColumnsSymbol] - 1, cls.tbody);

    _changeCellFocus.call(cls, firstCell);
    _changeSelectingCorner.call(cls, lastCell);
    selectArea()

  }
}

