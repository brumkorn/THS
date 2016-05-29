/**
 * Created by Brumkorn on 27.05.2016.
 */
import Utils from "./utils.class.js";
import Cell from "./cell.class.js";


export default class Sheet {

  constructor(columns, rows, sheetID, cellsList) {
    this.name = `Sheet${sheetID + 1}`;
    this.ID = sheetID;
    this._currentRows = 0;
    this._currentColumns = 0;
    this.cellsList = cellsList;
    this.formulaMode = false;
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
    this.inputConsole = document.querySelector(".input-console");

    this.focusedCell = null;
    this.highlightedHeaders = {
      columns: [],
      rows: []
    };

    this.addRows(rows);
    this.addColumns(columns);
    this.loadCellsData();
    this.initFocus();
    this.initListeners();
  }

  insertColHeader() {
    this.colHeaderList.appendChild(document.createElement("li"));
  }

  insertRowHeader() {
    this.rowHeaderList.appendChild(document.createElement("li"));
  }

  addRows(rows = 1) {
    for (let i = 0; i < rows; i++) {
      let row = this.tbody.insertRow(-1);
      this.insertRowHeader();
      this._currentRows++;

      for (let j = 0; j < this._currentColumns; j++) {
        let cell = row.insertCell(-1);
        cell.classList.add("data-cell");
        cell.tabIndex = this._currentRows + "";
      }
    }
  }

  addColumns(columns = 1) {
    let rowList = this.tbody.querySelectorAll("tr");
    this._currentColumns += columns;

    for (let i = 0; i < this._currentRows; i++) {
      for (let j = 0; j < columns; j++) {
        if (i === 0) {
          this.insertColHeader();
        }

        let cell = rowList[i].insertCell(-1);
        cell.classList.add("data-cell");
        cell.tabIndex = i + 1 + "";
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

  initFocus() {
    let cell = Utils.findCellOnSheet(0, 0, this.tbody);
    this.focusedCell = cell;
    cell.classList.add("focused-cell");
    this.highlightedHeaders.rows.push(this.rowHeaderList.children[0]);
    this.highlightedHeaders.columns.push(this.colHeaderList.children[0]);
    this.rowHeaderList.children[0].classList.add("cell-header-highlight");
    this.colHeaderList.children[0].classList.add("cell-header-highlight");
  }

  listenersControl(active = true) {
    let cornerHeight = parseFloat(
      window.getComputedStyle(this.corner).height
      ),
      cornerWidth = parseFloat(
        window.getComputedStyle(this.corner).width
      );

    this.cellInput = document.createElement("input");
    let input = this.cellInput;

    let removeLastFocus = () => {
      this.focusedCell
        .classList
        .remove("focused-cell", "focused-input-cell");
    };
    let inputDone = () => {
      if (this.formulaMode === true) return;

      let {rowIndex, colIndex, cellName} = Utils
        .getCellCoordinates(input.parentNode);

      if (input.value === "") {
        input.parentNode.innerHTML = "";
        delete this.cellsList[cellName];
        return;
      }
      if (!this.cellsList[cellName] && input.value !== "") {
        this.cellsList[cellName] =
          new Cell(rowIndex, colIndex, this.tbody);
      }
      this.cellsList[cellName].value = input.value;

      input.parentElement.innerHTML = input.value;
      synchronize();

      input.value = "";
      this.inputConsole.value = input.value;
    };
    let translateToConsole = (event) => {
      if (!this.formulaMode && event.target.tagName === "TD") {
        let {cellName} = Utils.getCellCoordinates(event);

        if (this.cellsList[cellName] instanceof Cell) {
          this.inputConsole.value = this.cellsList[cellName].value;
        } else {
          this.inputConsole.value = event.target.innerHTML;
        }
      }
    };
    let formulaModeToggle = (inputDone = false) => {
      if (inputDone) {
        this.formulaMode = false;
      } else {
        this.formulaMode = (input.value[0] === "=");
      }

      if (this.formulaMode) {
        input.addEventListener("blur", forcedFormulaModeFocusHdlr);
        this.inputConsole.addEventListener("blur", forcedFormulaModeFocusHdlr);
        this.tableWrapper
          .addEventListener("click", formulaPickCellHdlr);
      } else {
        input.removeEventListener("blur", forcedFormulaModeFocusHdlr);
        this.inputConsole.removeEventListener("blur", forcedFormulaModeFocusHdlr);
        this.tableWrapper
          .removeEventListener("click", formulaPickCellHdlr);

        let pickedCellsNodes = this
          .tableWrapper
          .querySelectorAll(".formula-mode-picked-cell");

        for (let i = 0; i < pickedCellsNodes.length; i++) {
          pickedCellsNodes[i].classList.remove("formula-mode-picked-cell");
        }
      }
    };
    let synchronize = () => {
      for (let cell in this.cellsList) {
        let cellOnSheet = this.cellsList[cell].cellNode;
        cellOnSheet.innerHTML = this.cellsList[cell].computedValue;
      }
    };

    let pullHeadersHdlr = (event) => {
      let rowHeader = this.rowHeader,
        colHeader = this.colHeader;
      rowHeader.style.top =
        cornerHeight - this.tableWrapper.scrollTop + "px";
      colHeader.style.left =
        cornerWidth - this.tableWrapper.scrollLeft + "px";
    };
    let dynamicAddCellsHdlr = (event) => {
      let sheet = event.currentTarget,
        toEdgeOfSheetCols =
          sheet.scrollWidth - (sheet.clientWidth + sheet.scrollLeft),
        toEdgeOfSheetRows =
          sheet.scrollHeight - (sheet.clientHeight + sheet.scrollTop);

      if (toEdgeOfSheetCols < 200) {
        this.addColumns(10);
      }

      if (toEdgeOfSheetRows < 120) {
        this.addRows(10);
      }
    };
    let focusinCellHdlr = (event) => {
      if (event.target === input) {
        removeLastFocus();
        this.focusedCell = input.parentElement;
        this.focusedCell.classList.add("focused-input-cell");
      }

      if (this.formulaMode === true) return;

      if (event.target.tagName === "TD") {
        if (this.focusedCell.firstChild === input) {
          inputDone();
        }
        removeLastFocus();
        this.focusedCell = event.target;
        event.target.classList.add("focused-cell");
        translateToConsole(event);
      }
    };
    let headersHighlightHdlr = (event) => {
      if (this.formulaMode === true) return;

      let removeHiglighted = () => {
        for (let item of this.highlightedHeaders.columns) {
          item.classList.remove("cell-header-highlight")
        }
        this.highlightedHeaders.columns.length = 0;

        for (let item of this.highlightedHeaders.rows) {
          item.classList.remove("cell-header-highlight")
        }
        this.highlightedHeaders.rows.length = 0;
      };

      if (event.target.tagName === "TD") {
        removeHiglighted();

        let rowIndex = event.target.parentElement.rowIndex;
        let colIndex = event.target.cellIndex;
        this.rowHeaderList.children[rowIndex]
          .classList.add("cell-header-highlight");
        this.colHeaderList.children[colIndex]
          .classList.add("cell-header-highlight");
        this.highlightedHeaders
          .rows.push(this.rowHeaderList.children[rowIndex]);
        this.highlightedHeaders
          .columns.push(this.colHeaderList.children[colIndex]);
      }
    };
    let invokeInputHdlr = (event) => {
      if (this.formulaMode === true ||
        event.target === input ||
        event.keyCode === Utils.keyCode.backspace ||
        event.keyCode === Utils.keyCode.del) {
        return;
      }


      let {cellName} = Utils.getCellCoordinates(this.focusedCell);

      if (event.keyCode &&
        event.keyCode !== Utils.keyCode.enter) {
        input.value = "";
      } else if (this.cellsList[cellName]) {
        input.value = this.cellsList[cellName].value;
      }
      else {
        input.value = "";
      }
      this.focusedCell.innerHTML = "";
      this.focusedCell.appendChild(input);


      if (event.target.tagName === "TD") {
        input.focus();
      }
    };
    let consoleFocusHdlr = (event) => {
      if (event.relatedTarget === input) return;
      invokeInputHdlr(event);
      removeLastFocus();
      this.focusedCell = input.parentElement;
      this.focusedCell.classList.add("focused-input-cell");
    };
    let consoleInputChangeHdlr = () => {
      input.value = this.inputConsole.value;
      formulaModeToggle();
    };
    let inputKeyDoneHdlr = (event) => {
      if (event.keyCode === Utils.keyCode.enter) {
        let {rowIndex, colIndex} =
          Utils.getCellCoordinates(input.parentElement);

        formulaModeToggle(true);
        let nextFocusCell =
          Utils.findCellOnSheet(rowIndex + 1, colIndex, this.tbody);
        setTimeout(function () {
          nextFocusCell.focus();
        }, 0);
      }
    };
    let formulaPickCellHdlr = (event) => {
      if (event.target === input) {
        return
      }

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
        this.inputConsole.value = input.value;
      }
    };
    let forcedFormulaModeFocusHdlr = (event) => {
      if (event.relatedTarget === input ||
        event.relatedTarget === this.inputConsole) return;

      input.parentElement.focus();
      event.target.focus();
    };
    let inputValueChangeHdlr = () => {
      formulaModeToggle();
      this.inputConsole.value = input.value;
    };
    let clearCellDataHdlr = (event) => {
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
        delete this.cellsList[cellName];
        event.target.innerHTML = "";
        synchronize();
      }
    };
    let changeFocusHdlr = (event) => {
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
            Utils.findCellOnSheet(rowIndex, colIndex - 1, this.tbody)
              .focus();
            break;
          case Utils.keyCode.arroRight:
            Utils.findCellOnSheet(rowIndex, colIndex + 1, this.tbody)
              .focus();
            break;
          case Utils.keyCode.arrowDown:
            Utils.findCellOnSheet(rowIndex + 1, colIndex, this.tbody)
              .focus();
            break;
          case Utils.keyCode.arrowUp:
            rowIndex = rowIndex || 1;
            Utils.findCellOnSheet(rowIndex - 1, colIndex, this.tbody)
              .focus();
            break;
        }
      }
    };

    if (typeof active === "boolean" && active) {
      this.tableWrapper.addEventListener("scroll", pullHeadersHdlr);
      this.tableWrapper.addEventListener("scroll", dynamicAddCellsHdlr);
      this.tableWrapper.addEventListener("focusin", focusinCellHdlr);
      this.tableWrapper.addEventListener("focusin", headersHighlightHdlr);
      this.tableWrapper.addEventListener("dblclick", invokeInputHdlr);
      this.tableWrapper.addEventListener("keypress", invokeInputHdlr);
      this.tableWrapper.addEventListener("keydown", clearCellDataHdlr);
      this.tableWrapper.addEventListener("keydown", changeFocusHdlr);

      this.inputConsole.addEventListener("focus", consoleFocusHdlr);
      this.inputConsole.addEventListener("input", consoleInputChangeHdlr);
      this.inputConsole.addEventListener("keydown", inputKeyDoneHdlr);

      input.addEventListener("keydown", inputKeyDoneHdlr);
      input.addEventListener("input", inputValueChangeHdlr);
    }

    if (typeof active === "boolean" && !active) {
      this.tableWrapper.removeEventListener("scroll", pullHeadersHdlr);
      this.tableWrapper.removeEventListener("scroll", dynamicAddCellsHdlr);
      this.tableWrapper.removeEventListener("focusin", focusinCellHdlr);
      this.tableWrapper.removeEventListener("focusin", headersHighlightHdlr);
      this.tableWrapper.removeEventListener("dblclick", invokeInputHdlr);
      this.tableWrapper.removeEventListener("keypress", invokeInputHdlr);
      this.inputConsole.removeEventListener("focus", consoleFocusHdlr);
      this.inputConsole.removeEventListener("input", consoleInputChangeHdlr);
      input.removeEventListener("keydown", inputKeyDoneHdlr);
      this.inputConsole.removeEventListener("keydown", inputKeyDoneHdlr);
      input.removeEventListener("input", inputValueChangeHdlr);
      this.tableWrapper.removeEventListener("keydown", clearCellDataHdlr);
      this.tableWrapper.removeEventListener("keydown", changeFocusHdlr);
    }
  }

  initListeners() {
    this.listenersControl(true);
  }

  stopListeners() {
    this.listenersControl(false);
  }
}