/**
 * Created by Brumkorn on 27.05.2016.
 */
import Utils from "./utils.class.js";
import Cell from "./cell.class.js";

let a = console.log.bind(console);

export default class Sheet {
  constructor(columns, rows, sheetID, cellsList, formulaBar) {
    this.name = `Sheet${sheetID + 1}`;
    this.ID = sheetID;
    this._currentRows = 0;
    this._currentColumns = 0;
    this.cellsList = cellsList;
    this.formulaMode = false;
    this.inputCell = document.createElement("input");
    //this.editor = editor;

    this.sheetContainer = document.querySelector(".main>div:last-child");
    this.sheetContainer.id = `sheet-container-${this.ID}`;
    this.colHeaderList = this.sheetContainer.querySelector(".col-header ol");
    this.rowHeaderList = this.sheetContainer.querySelector(".row-header ol");
    this.tableWrapper = this.sheetContainer.querySelector(".table-wrapper");
    this.tbody = this.tableWrapper.querySelector("tbody");
    this.rowHeader = this.sheetContainer.querySelector(".row-header");
    this.colHeader = this.sheetContainer.querySelector(".col-header");
    this.corner = this.sheetContainer
      .querySelector(".col-header-wrapper div:first-child");
    this.formulaBar = formulaBar;

    this.focusedCell = null;
    this.highlightedHeaders = {
      columns: [],
      rows: []
    };

    this.addRows(rows);
    this.addColumns(columns);
    this.loadCellsData();
    _initCellFocus.call(this);
  }


  addListeners() {
    this.listenersControl(true);
  }

  removeListeners() {
    this.listenersControl(false);
  }

  addRows(rows = 1) {
    let cls = this
    for (let i = 0; i < rows; i++) {
      let row = cls.tbody.insertRow(-1);
      insertRowHeader();
      cls._currentRows++;

      for (let j = 0; j < cls._currentColumns; j++) {
        let cell = row.insertCell(-1);
        cell.classList.add("data-cell");
        cell.tabIndex = cls._currentRows + "";
      }
    }

    function insertRowHeader() {
      cls.rowHeaderList.appendChild(document.createElement("li"));
    }
  }

  addColumns(columns = 1) {
    let cls = this;
    let rowList = cls.tbody.querySelectorAll("tr");
    cls._currentColumns += columns;

    for (let i = 0; i < cls._currentRows; i++) {
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

  listenersControl(active = true) {
    let cls = this;
    let input, cornerHeight, cornerWidth;

    input = this.inputCell;
    cornerHeight = parseFloat(window.getComputedStyle(this.corner).height);
    cornerWidth = parseFloat(window.getComputedStyle(this.corner).width);

    this.tableWrapper.dataListeners = [
      {e: "scroll", func: pullHeadersHdlr},
      {e: "scroll", func: dynamicAddCellsHdlr},
      {e: "focusin", func: focusinCellHdlr},
      {e: "focusin", func: headersHighlightHdlr},
      {e: "dblclick", func: this.invokeInputHdlr.bind(this)},
      {e: "keypress", func: this.invokeInputHdlr.bind(this)},
      {e: "keydown", func: clearCellDataHdlr},
      {e: "keydown", func: changeFocusHdlr},
      {e: "click", func: this.formulaPickCellHdlr.bind(this)}
    ];

    input.dataListeners = [
      {e: "blur", func: this.forcedFormulaModeFocusHdlr.bind(this)},
      {e: "keydown", func: this.inputKeyDoneHdlr.bind(this)},
      {e: "input", func: inputValueChangeHdlr}
    ];

    if (typeof active === "boolean" && active) {
      this.tableWrapper.dataListeners.forEach((listener) => {
        this.tableWrapper.addEventListener(listener["e"], listener["func"]);
      }, this);

      input.dataListeners.forEach((listener) => {
        input.addEventListener(listener["e"], listener["func"]);
      });
    }

    if (typeof active === "boolean" && !active) {
      this.tableWrapper.dataListeners.forEach((listener) => {
        this.tableWrapper.removeEventListener(listener["e"], listener["func"]);
      }, this);

      input.dataListeners.forEach((listener) => {
        input.removeEventListener(listener["e"], listener["func"]);
      });
    }

    function inputDone() {
      if (cls.formulaMode === true) return;

      let {rowIndex, colIndex, cellName} = Utils
        .getCellCoordinates(input.parentNode);

      if (input.value === "") {
        input.parentNode.innerHTML = "";
        delete cls.cellsList[cellName];
        return;
      }
      if (!cls.cellsList[cellName] && input.value !== "") {
        cls.cellsList[cellName] =
          new Cell(rowIndex, colIndex, cls.tbody);
      }
      cls.cellsList[cellName].value = input.value;

      input.parentElement.innerHTML = input.value;
      synchronize();

      input.value = "";
      cls.formulaBar.inputConsole.value = input.value;
      hidePickedCells()

      function hidePickedCells() {
        let pickedCellsNodes = cls
          .tableWrapper
          .querySelectorAll(".formula-mode-picked-cell");

        for (let i = 0; i < pickedCellsNodes.length; i++) {
          pickedCellsNodes[i].classList.remove("formula-mode-picked-cell");
        }
      }
    }

    function synchronize() {
      for (let cell in cls.cellsList) {
        let cellOnSheet = cls.cellsList[cell].cellNode;
        cellOnSheet.innerHTML = cls.cellsList[cell].computedValue;
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
      let sheet = event.currentTarget,
        toEdgeOfSheetCols =
          sheet.scrollWidth - (sheet.clientWidth + sheet.scrollLeft),
        toEdgeOfSheetRows =
          sheet.scrollHeight - (sheet.clientHeight + sheet.scrollTop);

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
        if (cls.focusedCell.firstChild === input) {
          inputDone();
        }
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

    function inputValueChangeHdlr() {
      cls.formulaModeToggle();
      cls.formulaBar.inputConsole.value = input.value;
    }

    function clearCellDataHdlr(event) {
      if (event.target.tagName !== "TD") {
        return;
      }
      if (event.keyCode === Utils.keyCode.alt ||
        event.keyCode === Utils.keyCode.backspace) {
        event.preventDefault();
      }
      if (event.target.innerHTML === "") return;
      if (event.keyCode === Utils.keyCode.backspace ||
        event.keyCode === Utils.keyCode.del) {
        let {cellName} = Utils.getCellCoordinates(event);
        delete cls.cellsList[cellName];
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

  loadCellsData() {
    let sheet = this;
    for (let cell in sheet.cellsList) {
      let currentCell = sheet.cellsList[cell];
      sheet.cellsList[cell] = new Cell(
        currentCell.rowIndex,
        currentCell.colIndex,
        sheet.tbody,
        currentCell.value,
        currentCell.computedValue
      );
      currentCell = sheet.cellsList[cell];
      let targetRow = sheet.tbody.children[currentCell.rowIndex];
      let targetCell = targetRow.children[currentCell.colIndex];
      targetCell.innerHTML = currentCell._computedValue;
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
      this.formulaMode = (this.inputCell.value[0] === "=");
    }
  }

  /* Events Handlers */
  invokeInputHdlr(event) {
    let cls = this;
    let input = cls.inputCell;

    if (cls.formulaMode ||
      event.target === input ||
      event.keyCode === Utils.keyCode.backspace ||
      event.keyCode === Utils.keyCode.del) {
      return;
    }

    let {cellName} = Utils.getCellCoordinates(cls.focusedCell);

    if (event.keyCode &&

      event.keyCode !== Utils.keyCode.enter) {
      input.value = "";

    } else if (cls.cellsList[cellName]) {

      input.value = cls.cellsList[cellName].value;

      if (input.value[0] === "=") {
        let {parsedLinks} = Utils.parseExpression(input.value, cls.tbody);

        parsedLinks.forEach((link) => {
          Utils.getCellCoordinates(link)
            .findNode(this.tbody)
            .classList.add("formula-mode-picked-cell");
        });
      }
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
    if (event.relatedTarget === this.inputCell) return;
    this.invokeInputHdlr(event);
    this.removeLastFocus();
    _changeCellFocus.call(this, this.inputCell.parentElement, "focused-input-cell");
  }

  consoleInputChangeHdlr() {
    this.inputCell.value = this.formulaBar.inputConsole.value;
    this.formulaModeToggle();
  }

  forcedFormulaModeFocusHdlr(event) {
    if (!this.formulaMode) return;

    let input = this.inputCell;

    if (event.relatedTarget === input ||
      event.relatedTarget === this.formulaBar.inputConsole) return;

    input.parentElement.focus();
    event.target.focus();
  }

  inputKeyDoneHdlr(event) {
    if (event.keyCode === Utils.keyCode.enter) {
      let {rowIndex, colIndex} =
        Utils.getCellCoordinates(this.inputCell.parentElement);

      this.formulaModeToggle(true);

      let nextFocusCell =
        Utils.findCellOnSheet(rowIndex + 1, colIndex, this.tbody);
      setTimeout(function () {
        nextFocusCell.focus();
      }, 0);
    }
  }

  formulaPickCellHdlr(event) {
    if (!this.formulaMode) return;

    let input = this.inputCell;

    if (event.target === input) return;

    if (input.value.search(Utils.regExp.pickingInputEnding) >= 0) {
      let linkEndingPos = input
        .value
        .search(Utils.regExp.cellLinkEnding);
      let {cellName} = Utils.getCellCoordinates(event);
      if (linkEndingPos >= 0) {
        let lastPickName = input.value.slice(linkEndingPos);
        let {rowIndex, colIndex} = Utils
          .getCellCoordinates(lastPickName);
        let lastCellNode = Utils
          .findCellOnSheet(rowIndex, colIndex, this.tbody);

        lastCellNode.classList.remove("formula-mode-picked-cell");
        input.value = input.value.slice(0, linkEndingPos);
      }
      event.target.classList.add("formula-mode-picked-cell");
      input.value += cellName;
      this.formulaBar.inputConsole.value = input.value;
    }
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
  this.focusedCell.classList.add(className);
}

