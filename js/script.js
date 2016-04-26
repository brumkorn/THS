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

let a = console.log.bind(console);

;(function() {
"use strict";

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
            pickingInputEnding: /([\=\+\-\*\/])$|([\=\+\-\*\/]+[A-Z]+[0-9]+)$/i,
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
        let numeric = 0;
        for (let i = 0; i < letter.length; i++) {
            numeric += letter.charCodeAt(i) - 65;
        }
        return numeric;
    }

    static findCellOnSheet(rowIndex, colIndex, tbody) {
        let targetRow = tbody.children[rowIndex];
        let targetCell = targetRow.children[colIndex];
        return targetCell;
    }

    static getCellCoordinates(data) {
        if (typeof data === "object") {
            let event = data;
            let colIndex,
                rowIndex,
                cellColPosition,
                cellRowPosition,
                cellPosition;

            if (event.path[0].cellIndex >= 0) {
                colIndex = event.path[0].cellIndex;
                rowIndex = event.path[1].rowIndex;
            } else {
                colIndex = event.path[1].cellIndex;
                rowIndex =  event.path[2].rowIndex;
            }

            cellColPosition = Utils.getNameFromNumber(colIndex);
            cellRowPosition = rowIndex + 1;
            cellPosition = cellColPosition + cellRowPosition;

            return {
                rowIndex: rowIndex,
                colIndex: colIndex,
                cellName: cellPosition
            };
        }
        if (typeof data === "string") {
            let cellName = data;
            let cellNameArr = cellName.match(Utils.regExp.cellLinkParts);
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
            operators = Utils.regExp.operators,
            cellLinkPattern = Utils.regExp.cellLink,
            inputArr = inputExp.match(inputArrPattern) || [],
            links = inputExp.match(cellLinkPattern) || [];

        let returnArr = inputArr.map(function(current) {
            let matched = current.match(cellLinkPattern);
            if (matched) {
                let cellName = matched[0].toUpperCase();
                let {rowIndex, colIndex} = 
                    Utils.getCellCoordinates( cellName );
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

            if(typeof item === "object" || item.search(operators) === -1) {
                continue;
            }
            while (item.length >1) {
                if ( item.search(doublePlusesAndMinuses) >= 0) {
                    item = item.replace(doublePlusesAndMinuses, "+");
                } 

                if ( item.search(plusMinus) >= 0) {
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

    constructor(params = {}) {

        let {
            target = ".main", 
            columns = 26,
            rows = 35,
            maxColls = 60,
            maxRows = 35, 
            readOnly = false
        } = params;
        this.target = document.querySelector(target);
        this.maxColls = maxColls;
        this.maxRows = maxRows;
        this.readOnly = readOnly;
        this.columns = Math.abs(columns);
        this.rows = Math.abs(rows);
        this._currentSheet = {};
        this.sheetList = [];
        this.footerToolbar = document.querySelector(".footer-toolbar");
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

        localStorage.setItem(this.name, "");
        this.addNewSheet();
    }

    initTable() {
        let windowFrame = this.target;
        let sheetContainer =
                windowFrame.appendChild( document.createElement("div") ),
            tableWrapper =
                sheetContainer.appendChild( document.createElement("div") );
        tableWrapper.classList.add("table-wrapper");

        let colHeaderWrapper =
            sheetContainer
            .insertBefore(document.createElement("div"), tableWrapper);
        colHeaderWrapper.classList.add("col-header-wrapper");
        colHeaderWrapper.appendChild( document.createElement("div") );
        let colHeader = 
            colHeaderWrapper.appendChild( document.createElement("div") );
        colHeaderWrapper.appendChild( document.createElement("div") );
        colHeader.classList.add("col-header");
        colHeader.appendChild( document.createElement("ol") );

        let rowHeader = 
            sheetContainer
            .insertBefore(document.createElement("div"), tableWrapper);
        rowHeader.classList.add("row-header");
        rowHeader.appendChild( document.createElement("ol") );

        let table = tableWrapper.appendChild( document.createElement("table") );
        table.appendChild( document.createElement("tbody") );

        let toolbar = document.querySelector(".footer-toolbar"),
            select = toolbar.querySelector("select");
        select.appendChild( document.createElement("option"));
        let sheetBoormarks = toolbar.querySelector(".sheet-bookmarks");
        sheetBoormarks.appendChild( document.createElement("div") );
    }

    createSheet(columns = this.columns, rows = this.rows, loading = false) {
        a(rows);
        let toolbar = this.footerToolbar,
            sheetID = this.sheetList.length,
            sheetCellsData = {};

        if(loading) {
            sheetCellsData = this.loadData()[sheetID].cellsList;
        }

        let sheet = new Sheet(columns, rows, sheetID, sheetCellsData);
            this._currentSheet = sheet;

        let option = toolbar.querySelector("select > option:last-child");
        option.setAttribute("value", sheet.ID);
        option.textContent = sheet.name;

        let sheetBookmarksList = 
            toolbar.querySelectorAll(".sheet-bookmarks > div");
        sheetBookmarksList[sheet.ID].id = `${sheet.ID}-sheet-bookmark`;
        sheetBookmarksList[sheet.ID].textContent = option.textContent;

        this.sheetList.push(sheet);
        this.switchSheet(sheet.ID);

        if (!loading) {
            this.saveData();
            return;
        }
    }

    saveData() {
        let objectData = JSON.stringify(this.sheetList);
        localStorage.setItem(this.name, objectData);
    }

    loadData() {
        let objectData = JSON.parse(localStorage.getItem(this.name));
        return objectData;
    }

    loadSheets() {
        let self = this;
        let loadedData = this.loadData();
        loadedData.forEach(function(item) {
            self.initTable();
            self.createSheet(item._currentColumns, item._currentRows, true);
        });
        self.switchSheet(0);
    }

    addNewSheet(columns, rows) {
        this.initTable();
        this.createSheet(columns, rows);
    }

    //switching is work not optimal. exessive loops and broking after hard clicking
    //1st variant -toggle all off. togle on new (by query selectors);
    //2nd variant - toggle current off. make new and toggle on it
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

        sheetBookmarksList[this._currentSheet.ID]
            .classList
            .remove("bookmark-current-sheet");
        sheetSelectList[this._currentSheet.ID].removeAttribute("selected");
        this._currentSheet.sheetContainer.style.display = "none";

        sheetBookmarksList[sheetIndex].classList.add("bookmark-current-sheet");
        sheetSelectList[sheetIndex].setAttribute("selected", "true");

        /*
        *Need something like this:
        */
        /* 
            let sheetBookmarksList = 
                this.footerToolbar.querySelectorAll(".sheet-bookmarks > div"),
                sheetSelectList = 
                    this.footerToolbar.querySelectorAll("select > option");


            sheetBookmarksList[this._currentSheet.ID].classList.remove("bookmark-current-sheet");
            sheetSelectList[this._currentSheet.ID].removeAttribute("selected");
            this._currentSheet.sheetContainer.style.display = "none";
            
            this._currentSheet = this.sheetList[sheetIndex];
            this._currentSheet.sheetContainer.style.display = "initial";

            sheetBookmarksList[sheetIndex].classList.add("bookmark-current-sheet");
            sheetSelectList[sheetIndex].setAttribute("selected", "true");
        */

            this._currentSheet = this.sheetList[sheetIndex];
            this._currentSheet.sheetContainer.style.display = "initial";
    }

    initListeners() {
        let select = this.footerToolbar.querySelector("select"),
            newSheetButton =
                this.footerToolbar.querySelector(".new-sheet-button"),
            sheetBookmarks =
                this.footerToolbar.querySelector(".sheet-bookmarks"),
            resetButton = document.getElementsByClassName("menu-button")[2],
            saveButton = document.getElementsByClassName("menu-button")[1];
            // not shure is it right to make such a varification. maybe need better event handling

        let switchSheetHandler = (event) => {
            if (!event.target.parentElement.className === "sheetBookmarks") {
                return;
            }

            let sheetIndex = event.target.value || parseFloat(event.target.id);
            this.switchSheet(sheetIndex);
        };
        select.addEventListener("change", switchSheetHandler);
        sheetBookmarks.addEventListener("click", switchSheetHandler);
        newSheetButton.addEventListener("click", () => this.addNewSheet());

        let resetDataBases = () => {
            localStorage.setItem(this.name, "");
        };
        resetButton.addEventListener("click", resetDataBases);
        saveButton.addEventListener("click", () => this.saveData()); 


        // window.onunload = () => {
        //     this.saveData();
        // }
    }
}

class Sheet{

    constructor(columns, rows, sheetID, cellsList) {
        this.name = `Sheet${sheetID + 1}`;
        this.ID = sheetID;
        this._currentRows = 0;
        this._currentColumns = 0;
        this.cellsList = cellsList;
        this.formulaMode = false;
       
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
        this.colHeaderList.appendChild( document.createElement("li") );
    }

    insertRowHeader() {
        this.rowHeaderList.appendChild( document.createElement("li") );
    }

    addRows(rows = 1) {
        for (let i = 0; i < rows; i++) {
            let row = this.tbody.insertRow(-1);
            this.insertRowHeader();
            this._currentRows ++;

            for (let j = 0; j < this._currentColumns; j++) {
                let cell = row.insertCell(-1);
                cell.classList.add("data-cell");
                cell.tabIndex = this._currentRows +"";
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
        for (let item in this.cellsList) {
            let currentCell = this.cellsList[item];
            this.cellsList[item] = new Cell(
                currentCell.rowIndex,
                currentCell.colIndex,
                this.tbody,
                currentCell._value,
                currentCell._computedValue
            );
            currentCell = this.cellsList[item];
            let targetRow = this.tbody.children[currentCell.rowIndex];
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

    initListeners() {
        let cornerHeight = parseFloat( 
                window.getComputedStyle(this.corner).height),
            cornerWidth = parseFloat( 
                window.getComputedStyle(this.corner).width);
        this.inputConsole = document.querySelector(".input-console");

        let pullHeadersHandler = (event) => {
            let rowHeader = this.rowHeader,
                colHeader = this.colHeader;
            rowHeader.style.top = 
                cornerHeight - this.tableWrapper.scrollTop + "px";
            colHeader.style.left = 
                cornerWidth - this.tableWrapper.scrollLeft + "px";
        }
        this.tableWrapper.addEventListener("scroll", pullHeadersHandler);

        let dynamicAddCellsHandler = (event) => {
            let sheet = event.currentTarget,
                toEdgeOfSheetCols = 
                    sheet.scrollWidth - (sheet.clientWidth + sheet.scrollLeft),
                toEdgeOfSheetRows =
                    sheet.scrollHeight - (sheet.clientHeight + sheet.scrollTop);

            if ( toEdgeOfSheetCols < 200 ) {
                this.addColumns(10);
            }

            if ( toEdgeOfSheetRows < 120 ) {
                this.addRows(10);
            }
        };
        this.tableWrapper.addEventListener("scroll", dynamicAddCellsHandler);

        let input = document.createElement("input");
        let focusinCell = (event) => {
            if(this.formulaMode === true) return;
            let removeLastFocus = () => {
                this.focusedCell
                    .classList
                    .remove("focused-cell", "focused-input-cell");
            }

            if(event.target.tagName === "TD") {
                if (this.focusedCell)
                removeLastFocus();
                this.focusedCell = event.target;
                event.target.classList.add("focused-cell")
            }

            if(event.target === input) {
                removeLastFocus();
                this.focusedCell = event.target.parentElement;
                this.focusedCell.classList.add("focused-input-cell");
            }
        };
        this.tableWrapper.addEventListener("focusin", focusinCell);


        let headersHighlight = (event) => {
            if(this.formulaMode === true) return;

            let removeHiglighted = () => {
                for (let item of this.highlightedHeaders.columns) {
                    item.classList.remove("cell-header-highlight")
                }
                this.highlightedHeaders.columns.length = 0;

                for (let item of this.highlightedHeaders.rows) {
                    item.classList.remove("cell-header-highlight")
                }
                this.highlightedHeaders.rows.length = 0;
            }

            if (event.target.tagName === "TD"){
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
        }
        this.tableWrapper.addEventListener("focusin", headersHighlight);


        let invokeInputHandler = (event) => {
            if (this.formulaMode === true ||
                event.target === input ||
                event.keyCode === Utils.keyCode.backspace ||
                event.keyCode === Utils.keyCode.del) {
                return;
            }

            let {cellName} = Utils.getCellCoordinates(event);

            if (event.keyCode &&
                event.keyCode !== Utils.keyCode.enter) {
                input.value = "";
            } else if (this.cellsList[cellName]) {
                input.value = this.cellsList[cellName].value;
                formulaModeToggle();
            }
            else {
                input.value = "";
            }
            this.inputConsole.value = input.value;
            event.target.innerHTML = "";
            event.target.appendChild(input);
            input.focus();
        };
        this.tableWrapper.addEventListener("dblclick", invokeInputHandler);
        this.tableWrapper.addEventListener("keypress", invokeInputHandler);


        let consoleFocusHandler = (event) => {

        }
        this.inputConsole.addEventListener("focus", consoleFocusHandler);

        let consoleInputHandler = (event) => {

        }
        this.inputConsole.addEventListener("input", consoleInputHandler);

        let inputDoneHandler = (event) => {
            a(event);
            if (this.formulaMode === true) return;

            if(!event.relatedTarget || 
                event.relatedTarget.tagName !== "TD")  {
                return;
            }

            let {rowIndex, colIndex, cellName} = Utils
                .getCellCoordinates(event);

            if(input.value === "") {
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
        input.addEventListener("focusout", inputDoneHandler);

        let inputKeyDoneHandler = (event) => {
                if (event.keyCode === Utils.keyCode.enter) {
                    let {rowIndex, colIndex} =
                        Utils.getCellCoordinates(event);

                    formulaModeToggle(true);
                    let nextFocusCell =
                        Utils.findCellOnSheet(rowIndex + 1, colIndex, this.tbody);
                    setTimeout(function() {
                        nextFocusCell.focus();
                    }, 0);
                }
            };
        input.addEventListener("keydown", inputKeyDoneHandler);

        let formulaPickCellHandler = (event) => {
            if (event.target === input) {
                return
            }
            
            if (input.value.search(Utils.regExp.pickingInputEnding) >= 0) {
                let linkEndingPos = input
                                    .value
                                    .search(Utils.regExp.cellLinkEnding);
                let {cellName} = Utils.getCellCoordinates(event);
                if(linkEndingPos >= 0 ) {
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

        let translateToConsoleHandler = (event) => {
            if (event.target.tagName === "TD") {
                let {cellName} = Utils.getCellCoordinates(event);

                if (this.cellsList[cellName] instanceof Cell) {
                    this.inputConsole.value = this.cellsList[cellName].value;
                } else {
                    this.inputConsole.value = event.target.innerHTML;
                }
                
            }
        }
        this.tableWrapper.addEventListener("click", translateToConsoleHandler)

        let forcedFormulaModeFocusHandler = (event) => {
            input.parentElement.focus();
            input.focus();
        };

        let formulaModeToggle = (inputDone = false) => {
            if (inputDone) {
                this.formulaMode = false;
            } else {
                this.formulaMode = (input.value[0] === "=") ? true : false;
            }

            if (this.formulaMode) {
                input.addEventListener("blur", forcedFormulaModeFocusHandler)
                this.tableWrapper
                    .addEventListener("click", formulaPickCellHandler); 
            } else {
                input.removeEventListener("blur", forcedFormulaModeFocusHandler);
                this.tableWrapper
                    .removeEventListener("click", formulaPickCellHandler); 
                let pickedCellsNodes = this
                                .tableWrapper
                                .querySelectorAll(".formula-mode-picked-cell");

                for (let i = 0; i < pickedCellsNodes.length; i++) {
                    pickedCellsNodes[i].classList.remove("formula-mode-picked-cell");
                }
            }
        }

        let inputValueChangeHandler = (event) => {
            formulaModeToggle();
            this.inputConsole.value = input.value;
        };
        input.addEventListener("input", inputValueChangeHandler);

        let synchronize = () => {
            for (let cell in this.cellsList) {
                let cellOnSheet = this.cellsList[cell].cellNode;
                cellOnSheet.innerHTML = this.cellsList[cell].computedValue;
            }
        };

        let clearCellDataHandler = (event) => {
            if (event.target.tagName !== "TD") {
                return;
            }
            if (event.keyCode === Utils.keyCode.alt||
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
        this.tableWrapper.addEventListener("keydown", clearCellDataHandler);

        let changeFocusHandler = (event) => {
            if (event.target === input &&
                Utils.keyCode.arrows.includes(event.keyCode)) {
                return;
            }
            if ( Utils.keyCode.arrows.includes(event.keyCode) ) {
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
        }
        this.tableWrapper.addEventListener("keydown", changeFocusHandler);
    }
}

class Cell {

    constructor(rowIndex, colIndex, tbody, value, computedValue) {
        this.colIndex = colIndex;
        this.rowIndex = rowIndex;
        this.value = value;
        this.tbody = tbody
        this.computedValue = computedValue
    }

    get cellNode() {
        return Utils.findCellOnSheet(this.rowIndex, this.colIndex, this.tbody)
    }

    get cellColPosition () {
        return Utils.getNameFromNumber(this.colIndex);
    }

    get cellRowPosition() {
        return this.rowIndex + 1;
    }

    get name() {
        return `${this.cellColPosition + this.cellRowPosition}`;
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
        if ( newValue.startsWith("=") ) {
            newValue = Utils.computeValue( newValue.slice(1), this.tbody );
        }
        this._computedValue = newValue;
        return this._computedValue;
    }
}
let editor = new SheetEditor();
})();