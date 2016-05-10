/*
 *Excel-like spreadsheet editor.
 *
 *
 *
 *
 *
 *
 *@author Shovgenja Oleksij for INSART Trainee
 *@version "0.01 04/05/16"
 */

// function Cell() {}

// function FormulaCell() {
//     this.getValue = functino() {}
// }

// function SheetEditor(param) {

//     if (1 == 1)
//         this.getValue = function() {

//         }

//         let c = new Cell;

//         FormulaCell.call(c)

// }

(function () {
  "use strict";
  let a = console.log.bind(console);

  class Utils {
    static get keyCode() {
      return {
        enter: 13,
        backspace: 8,
        del: 46,
        shift: 16,
        alt: 18,
        ctrl: 17,
        arrows: [37, 38, 39, 40],
        arroRight: 39,
        arrowLeft: 37,
        arrowUp: 38,
        arrowDown: 40,
        equalSign: 187
      };
    }

    static get regExp() {
      return {
        operators: /[\+\-\*\/]/,
        cellLink: /([A-Z]+[0-9]+)/gi,
        cellLinkParts: /([A-Z]+)|([0-9]+)/gi,
        cellLinkEnding: /([A-Z]+[0-9]+)$/i,
        pickingInputEnding: /([=\+\-\*\/])$|([=\+\-\*\/]+[A-Z]+[0-9]+)$/i,
        validInput: /([A-Z]+[0-9]+)|([0-9]+)|([\+\-\*\/]+)|([\(\)])/gi,
        doublePlusesAndMinuses: /([\-]{2})|([\+]{2})/g,
        plusMinus: /(\+\-)|(\-\+)/g
      }
    }

    static getNameFromNumber(num) {
      if (typeof num !== "number") {
        a("Wrong type in getNameFromNumber" + typeof num);
        debugger;
      }
      let upperLatinLetters = 26,
        upperLatinAUnicode = 65,
        numeric = num % upperLatinLetters;
      let letter = String.fromCodePoint(upperLatinAUnicode + numeric);
      let num2 = Math.floor(num / upperLatinLetters);
      if (num2 > 0) {
        return this.getNameFromNumber(num2 - 1) + letter;
      } else {
        return letter;
      }
    }

    static getNumberFromName(letter) {
      let numeric = 0,
        upperLatinAUnicode = 65;

      for (let i = 0; i < letter.length; i++) {
        numeric += letter.charCodeAt(i) - upperLatinAUnicode;
      }
      return numeric;
    }

    static findCellOnSheet(rowIndex, colIndex, tbody) {
      let targetRow = tbody.children[rowIndex];
      return targetRow.children[colIndex];
    }

    static getCellName(rowIndex, colIndex) {
      let cellColName = Utils.getNameFromNumber(colIndex);
      let cellRowName = rowIndex + 1;
      return cellColName + cellRowName;
    }

    static getCellCoordinates(data) {
      if (data instanceof HTMLElement && data.nodeName === "TD") {
        let cellNode = data;
        let rowIndex = cellNode.parentElement.rowIndex;
        let colIndex = cellNode.cellIndex;
        let cellName = Utils.getCellName(rowIndex, colIndex);

        return {
          rowIndex: rowIndex,
          colIndex: colIndex,
          cellName: cellName
        }
      }

      if (typeof data === "object" && data.path) {
        let event = data,
          colIndex,
          rowIndex,
          cellName;

        if (event.path[0].cellIndex >= 0) {
          colIndex = event.path[0].cellIndex;
          rowIndex = event.path[1].rowIndex;
        } else {
          colIndex = event.path[1].cellIndex;
          rowIndex = event.path[2].rowIndex;
        }

        cellName = Utils.getCellName(rowIndex, colIndex);

        return {
          rowIndex: rowIndex,
          colIndex: colIndex,
          cellName: cellName
        };
      }

      if (typeof data === "string") {
        let cellNameArr = data.match(Utils.regExp.cellLinkParts);
        let rowIndex = cellNameArr[1] - 1;
        let colIndex = Utils.getNumberFromName(cellNameArr[0]);
        return {
          rowIndex: rowIndex,
          colIndex: colIndex
        };
      }
    }

    static parseExpression(inputExp, tbody) {
      let inputArrPattern = Utils.regExp.validInput,
        cellLinkPattern = Utils.regExp.cellLink,
        inputArr = inputExp.match(inputArrPattern) || [],
        links = inputExp.match(cellLinkPattern) || [];

      let returnArr = inputArr.map(function (current) {
        let matched = current.match(cellLinkPattern);
        if (matched) {
          let cellName = matched[0].toUpperCase();
          let {rowIndex, colIndex} =
            Utils.getCellCoordinates(cellName);
          return Utils.findCellOnSheet(rowIndex, colIndex, tbody);
        }
        return current
      });

      return {
        parsedInput: returnArr,
        parsedLinks: links
      };
    }

    static computeValue(inputExp, tbody) {
      let expressionArr = Utils.parseExpression(inputExp, tbody).parsedInput;
      let expressionStr = "",
        operators = Utils.regExp.operators,
        doublePlusesAndMinuses = Utils.regExp.doublePlusesAndMinuses,
        plusMinus = Utils.regExp.plusMinus;

      for (let i = 0; i < expressionArr.length; i++) {
        let item = expressionArr[i];

        if (typeof item === "object" || item.search(operators) === -1) {
          continue;
        }
        while (item.length > 1) {
          if (item.search(doublePlusesAndMinuses) >= 0) {
            item = item.replace(doublePlusesAndMinuses, "+");
          }

          if (item.search(plusMinus) >= 0) {
            item = item.replace(plusMinus, "-")
          }
        }
        expressionArr[i] = item;
      }

      for (let item of expressionArr) {
        if (typeof item === "object") {
          expressionStr += item.innerHTML || 0;
        } else {
          expressionStr += item;
        }
      }

      if (!expressionStr) return "";

      if (expressionStr.charAt(0).search(operators) >= 0) {
        expressionStr = `${0 + expressionStr}`;
      }
      if (expressionStr[expressionStr.length - 1].search(operators) >= 0) {
        expressionStr = `${expressionStr + 0}`;
      }

      if (expressionStr.search(Utils.regExp.cellLink) >= 0) return "";

      return eval(expressionStr);
    }
  }

  class SheetEditor {

    constructor(params) {
      this.target = document.querySelector(".main");
      this.columns = Math.abs(26);
      this.rows = Math.abs(50);

      if (params && typeof params === "object") {
        this.target = params.target;
        this.maxColls = params.maxColls;
        this.maxRows = params.maxRows;
        this.readOnly = params.readOnly;
        this.columns = Math.abs(params.columns);
        this.rows = Math.abs(params.rows);
      }

      this._currentSheet = null;
      this.sheetList = [];
      this.footerToolbar = document.querySelector(".footer-toolbar");
      this.serverData = null;

      this.start();
      this.initListeners();


    }

    get name() {
      return `Editor-for-${this.target.className}-window`;
    }

    start() {


      if (localStorage[`${this.name}`]) {
        this.loadSheets();
        return;
      }

      this.getServerData("http://127.0.0.1:3000/load", (data) => {
        this.serverData = data;
      });

      setTimeout(() => {
        if (this.serverData) {
          alert("Loading from server");
          this.loadSheets();
          this.saveData();
          return;
        }

        localStorage.setItem(this.name, "");
        this.addNewSheet();
      }, 0)

    }

    loadSheets() {
      let loadedData = this.loadData() || this.serverData;
      loadedData.forEach(function (item) {
        this.initTable();
        this.createSheet(item._currentColumns, item._currentRows, true);
      }, this);
      this.switchSheet(0);
    }

    loadData() {
      return JSON.parse(localStorage.getItem(this.name));
    }

    initTable() {
      let windowFrame = this.target;
      let sheetContainer =
          windowFrame.appendChild(document.createElement("div")),
        tableWrapper =
          sheetContainer.appendChild(document.createElement("div"));
      tableWrapper.classList.add("table-wrapper");

      let colHeaderWrapper =
        sheetContainer
          .insertBefore(document.createElement("div"), tableWrapper);
      colHeaderWrapper.classList.add("col-header-wrapper");
      colHeaderWrapper.appendChild(document.createElement("div"));
      let colHeader =
        colHeaderWrapper.appendChild(document.createElement("div"));
      colHeaderWrapper.appendChild(document.createElement("div"));
      colHeader.classList.add("col-header");
      colHeader.appendChild(document.createElement("ol"));

      let rowHeader =
        sheetContainer
          .insertBefore(document.createElement("div"), tableWrapper);
      rowHeader.classList.add("row-header");
      rowHeader.appendChild(document.createElement("ol"));

      let table = tableWrapper.appendChild(document.createElement("table"));
      table.appendChild(document.createElement("tbody"));

      let toolbar = document.querySelector(".footer-toolbar"),
        select = toolbar.querySelector("select");
      select.appendChild(document.createElement("option"));
      let sheetBoormarks = toolbar.querySelector(".sheet-bookmarks");
      sheetBoormarks.appendChild(document.createElement("div"));
    }

    createSheet(columns = this.columns, rows = this.rows, loading = false) {
      let editor = this;
      let toolbar = editor.footerToolbar,
        sheetID = editor.sheetList.length,
        sheetCellsData = {};

      if (loading) {
        sheetCellsData = editor.loadData() ?
          editor.loadData()[sheetID].cellsList :
          editor.serverData[sheetID].cellsList;
      }

      let sheet = new Sheet(columns, rows, sheetID, sheetCellsData);
      editor._currentSheet = sheet;

      let option = toolbar.querySelector("select > option:last-child");
      option.setAttribute("value", sheet.ID);
      option.textContent = sheet.name;

      let sheetBookmarksList =
        toolbar.querySelectorAll(".sheet-bookmarks > div");
      sheetBookmarksList[sheet.ID].id = `${sheet.ID}-sheet-bookmark`;
      sheetBookmarksList[sheet.ID].textContent = option.textContent;

      editor.sheetList.push(sheet);
      editor.switchSheet(sheet.ID);

      if (!loading) {
        editor.saveData();
      }
    }

    saveData() {
      let editor = this;
      let sheetsData = [];
      let objectData;
      editor.sheetList.forEach(ForEachCB, editor);
      objectData = JSON.stringify(sheetsData);

      localStorage.setItem(this.name, objectData);
      this.postServerData('http://127.0.0.1:3000/save', objectData, function (data) {
        alert(data);
      });

      function ForEachCB(sheet) {
        let cellsData = {};

        for (let cell in sheet.cellsList) {
          cellsData[cell] = {
            value: sheet.cellsList[cell].value,
            computedValue: sheet.cellsList[cell].computedValue,
            colIndex: sheet.cellsList[cell].colIndex,
            rowIndex: sheet.cellsList[cell].rowIndex
          };
        }

        let sheetData = {
          cellsList: cellsData,
          currentRows: sheet._currentRows,
          currentColumns: sheet._currentColumns
        };

        sheetsData.push(sheetData);
      }
    }

    getServerData(path, callback) {
      let httpRequest = new XMLHttpRequest();
      httpRequest.open("POST", path);
      httpRequest.send();

      httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState === 4) {
          if (httpRequest.status === 200) {
            let JSONData = JSON.parse(httpRequest.responseText);
            if (callback) {
              callback(JSONData);
            }
          }
        }
      };
    }

    postServerData(path, object, callback) {
      let json = object;
      let httpRequest = new XMLHttpRequest();

      httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState === 4) {
          if (httpRequest.status === 200) {
            let data = httpRequest.responseText;
            if (callback) callback(data);
          }
        }
      };

      httpRequest.open("POST", path);
      httpRequest.setRequestHeader("Content-type",
        "text/plain; charset=utf-8");
      httpRequest.send(json);
    }


    addNewSheet(columns, rows) {
      this.initTable();
      this.createSheet(columns, rows);
    }

    switchSheet(sheetIndex) {
      let sheetBookmarksList =
          this.footerToolbar.querySelectorAll(".sheet-bookmarks > div"),
        sheetSelectList =
          this.footerToolbar.querySelectorAll("select > option");

      for (let i = 0; i < this.sheetList.length; i++) {
        sheetBookmarksList[i].classList.remove("bookmark-current-sheet");
        sheetSelectList[i].removeAttribute("selected");
        this.sheetList[i].sheetContainer.style.display = "none";
      }

      sheetBookmarksList[sheetIndex].classList.add("bookmark-current-sheet");
      sheetSelectList[sheetIndex].setAttribute("selected", "true");

      this._currentSheet = this.sheetList[sheetIndex];
      this._currentSheet.sheetContainer.style.display = "initial";
    }

    deleteSheet(delSheetIndex) {
      let sheetBookmarks =
          this.footerToolbar.querySelector(".sheet-bookmarks"),
        sheetBookmarksList =
          this.footerToolbar.querySelectorAll(".sheet-bookmarks > div"),
        sheetSelect =
          this.footerToolbar.querySelector("select"),
        sheetSelectList =
          this.footerToolbar.querySelectorAll("select > option"),
        removedSheet = this.sheetList.splice(delSheetIndex)[0];
      this.target.removeChild(removedSheet.sheetContainer);
      sheetBookmarks.removeChild(sheetBookmarksList[delSheetIndex]);
      sheetSelect.removeChild(sheetSelectList[delSheetIndex]);
      this.saveData();
    }

    initListeners() {
      let select = this.footerToolbar.querySelector("select"),
        newSheetButton =
          this.footerToolbar.querySelector(".new-sheet-button"),
        sheetBookmarks =
          this.footerToolbar.querySelector(".sheet-bookmarks"),
        saveButton = document.getElementsByClassName("menu-button")[1],
        resetButton = document.getElementsByClassName("menu-button")[2],
        deleteSheetButton = document.getElementsByClassName("menu-button")[3];

      let switchSheetHdlr = (event) => {
        if (event.target.parentElement.className === "sheet-bookmarks" ||
          event.target.tagName === "SELECT") {
          let sheetIndex = event.target.value || parseFloat(event.target.id);
          this.switchSheet(sheetIndex);
        }
      };
      let resetDataBasesHdlr = () => {
        localStorage.setItem(this.name, "");
      };
      let deleteSheetHndlr = () => {
        let decision = confirm(
          `                       Warning!

Are you shure you want to delete ${this._currentSheet.name}?
`
        );
        if (!decision) return;
        let delSheetID = this._currentSheet.ID;
        this.switchSheet(this._currentSheet.ID - 1);
        this.deleteSheet(delSheetID);
      };
      newSheetButton.addEventListener("click", () => this.addNewSheet());
      select.addEventListener("change", switchSheetHdlr);
      sheetBookmarks.addEventListener("click", switchSheetHdlr);
      deleteSheetButton.addEventListener("click", deleteSheetHndlr);
      resetButton.addEventListener("click", resetDataBasesHdlr);
      saveButton.addEventListener("click", () => this.saveData());


      // window.onunload = () => {
      //     this.saveData();
      // }
    }
  }

  class Sheet {

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
        a(currentCell.rowIndex);
        a(currentCell.value);
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

        a(this);
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
        a(`input invoked: ${this.name}`);

        if (event.target.tagName === "TD") {
          input.focus();
        }
      };
      let consoleFocusHdlr = (event) => {
        a(`Console focused: ${this.name}`);
        if (event.relatedTarget === input) return;
        invokeInputHdlr(event);
        removeLastFocus();
        this.focusedCell = input.parentElement;
        this.focusedCell.classList.add("focused-input-cell");
      };
      let consoleInputChangeHdlr = () => {
        a(`Console input changed: ${this.name}`);
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
        a(`Listeners run: ${this.name}`)
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
        a(`Listeners stopped: ${this.name}`);
      }
    }

    initListeners() {
      this.listenersControl(true);
    }

    stopListeners() {
      this.listenersControl(false);
    }
  }

  class Cell {

    constructor(rowIndex, colIndex, tbody, value, computedValue) {
      this.colIndex = colIndex;
      this.rowIndex = rowIndex;
      this.value = value;
      this.tbody = tbody;
      this.computedValue = computedValue;
    }

    get cellNode() {
      return Utils.findCellOnSheet(this.rowIndex, this.colIndex, this.tbody)
    }

    get name() {
      return `${Utils.getCellName}`;
    }

    get value() {
      return this._value;
    }

    set value(value) {
      this._value = value;
    }

    set computedValue(value) {
      this._computedValue = value;
    }

    get computedValue() {
      let newValue = this.value;
      if (newValue.startsWith("=")) {
        newValue = Utils.computeValue(newValue.slice(1), this.tbody);
      }
      this._computedValue = newValue;
      return this._computedValue;
    }
  }
  new SheetEditor();
})();