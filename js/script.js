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
            arrowDown: 40
        };
    }

    static getNameFromNumber(num) {
        if (typeof num !== "number") {
            a("Wrong type in getNameFromNumber" + typeof num);
        }
        let numeric = num % 26;
        let letter = String.fromCodePoint(65 + numeric);
        let num2 = Math.floor(num / 26);
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
            let colIndex = event.path[0].cellIndex  || event.path[1].cellIndex || 0,
                rowIndex = event.path[1].rowIndex  || event.path[2].rowIndex || 0,
                cellColPosition = Utils.getNameFromNumber(colIndex);
            let cellRowPosition = rowIndex + 1,
                cellPosition = cellColPosition + cellRowPosition;
            return {
                rowIndex: rowIndex,
                colIndex: colIndex,
                cellName: cellPosition
            };
        }
        if (typeof data === "string") {
            let cellName = data.toUpperCase();
            let cellNameArr = cellName.match(/([A-Z]+)|([0-9]+)/g);
            let rowIndex = cellNameArr[1] - 1;
            let colIndex = Utils.getNumberFromName(cellNameArr[0]);
            return {
                rowIndex: rowIndex,
                colIndex: colIndex
            };
        }
    }


    static parseExpression(inputExp, tbody) {
        let inputArrPattern = /([A-Z]+[0-9]+)|([0-9]+)|([\+\-\*\/]+)|([\(\)])/gi,
            operators = /[\+\-\*\/]/,
            cellLinkPattern = /([A-Z]+[0-9]+)/gi,
            inputArr = inputExp.match(inputArrPattern),
            links = inputExp.match(cellLinkPattern);
        // let returnArr = inputArr.map(function(current) {
        //     let matched = current.match(cellLinkPattern);
        //     if (matched) {
        //         return sheet.cellsData[ matched[0].toUpperCase() ];
        //     }
        //     return current;
        // });
        let returnArr = inputArr.map(function(current) {
            let matched = current.match(cellLinkPattern);
            if (matched) {
                let {rowIndex, colIndex} = 
                    Utils.getCellCoordinates(matched[0]);
                return Utils.findCellOnSheet(rowIndex, colIndex, tbody);
            }
            return current
        });

        return {
            parsedInput: returnArr, 
            parsedLinks: links
        };
    }

    static computeValue(value, tbody) {
        let valueArr = Utils.parseExpression(value, tbody).parsedInput;
        let valueString = ``;
        for (let item of valueArr) {
            if (typeof item === "object") {
                valueString += item.innerHTML || 0;
            } else {
                valueString += (item);
            }
        }
        let computedValue = eval(valueString);
        return computedValue;
    }
}

class SheetEditor {

    constructor(params = {}) {

        let {
            target = ".main", 
            columns = 26,
            rows = 35,
            maxColls = 60,
            maxRows = 300, 
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
        let toolbar = this.footerToolbar,
            sheetID = this.sheetList.length,
            sheetCellsData = {};

        if(loading) {
            sheetCellsData = this.loadData()[sheetID].cellsData;
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
            localStorage.setItem(this.name, "")
        }
        resetButton.addEventListener("click", resetDataBases);
        saveButton.addEventListener("click", () => this.saveData()); 


        // window.onunload = () => {
        //     this.saveData();
        // }
    }
}

class Sheet{

    constructor(columns, rows, sheetID, cellsData) {
        this.name = `Sheet${sheetID + 1}`;
        this.ID = sheetID;
        this._currentRows = 0;
        this._currentColumns = 0;
        this.cellsData = cellsData;
       
        this.sheetContainer = document.querySelector(".main>div:last-child");
        this.sheetContainer.id = `sheet-container-${this.ID}`;
        this.colHeaderList = this.sheetContainer.querySelector(".col-header ol");
        this.rowHeaderList = this.sheetContainer.querySelector(".row-header ol");
        this.tableWrapper = this.sheetContainer.querySelector(".table-wrapper");
        this.tbody = this.tableWrapper.querySelector("tbody");

        this.addRows(rows);
        this.addColumns(columns);
        this.loadCellsData();
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
        for (let item in this.cellsData) {
            let currentCell = this.cellsData[item];
            this.cellsData[item] = new Cell(
                currentCell.rowIndex,
                currentCell.colIndex,
                this.tbody,
                currentCell._value
                
            );
            currentCell = this.cellsData[item];
            let targetRow = this.tbody.children[currentCell.rowIndex];
            let targetCell = targetRow.children[currentCell.colIndex];
            targetCell.innerHTML = currentCell.computedValue;
        }
    }

    initListeners() {

        let pullHeaders = (event) => {
            let sheet = event.target,
                rowHeader = this.sheetContainer.querySelector(".row-header"),
                colHeader = this.sheetContainer.querySelector(".col-header");
            rowHeader.style.top = 24 - sheet.scrollTop + "px";
            colHeader.style.left =  40 - sheet.scrollLeft + "px";
        }
        this.tableWrapper.addEventListener("scroll", pullHeaders);

        let dynamicAddCells = (event) => {
            let sheet = event.currentTarget,
                toEdgeOfSheetCols = 
                    sheet.scrollWidth - (sheet.clientWidth + sheet.scrollLeft),
                toEdgeOfSheetRows =
                    sheet.scrollHeight - (sheet.clientHeight + sheet.scrollTop);

            if ( toEdgeOfSheetCols < 200 ) {
                this.addColumns(5);
            }

            if ( toEdgeOfSheetRows < 120 ) {
                this.addRows(5);
            }
        };
        this.tableWrapper.addEventListener("scroll", dynamicAddCells);

        let input = document.createElement("input");
        //let noInput = input.value === "" || input.value.trim() === "=";

        let invokeInput = (event) => {
            let {rowIndex, colIndex, cellName} = Utils
                    .getCellCoordinates(event);
            if (event.target === input ||
                event.keyCode === Utils.keyCode.backspace ||
                event.keyCode === Utils.keyCode.del) {
                return;
            }
            if (event.keyCode &&
                event.keyCode !== Utils.keyCode.enter) {
                input.value = "";
            } else if (this.cellsData[cellName]) {
                input.value = this.cellsData[cellName].value;
            }
            else {
                input.value = "";
            }
            event.target.innerHTML = "";
            event.target.appendChild(input);
            input.focus();
        };

        let inputDone = (event) => {
                let {rowIndex, colIndex, cellName} = Utils
                    .getCellCoordinates(event);

                if(input.value === "") {
                    input.parentNode.innerHTML = "";
                    delete this.cellsData[cellName];
                    return;
                } 
                if (!this.cellsData[cellName] && input.value !== "") {
                    a(this);
                    this.cellsData[cellName] = 
                        new Cell(rowIndex, colIndex, this.tbody);
                }
                this.cellsData[cellName].value = input.value;
                input.parentNode.innerHTML = 
                    this.cellsData[cellName].computedValue;
                input.value = "";
            },
            inputKeyDone = (event) => {
                if (event.keyCode === Utils.keyCode.enter) {
                    let {rowIndex, colIndex} =
                        Utils.getCellCoordinates(event);
                    let nextFocusCell =
                        Utils.findCellOnSheet(rowIndex + 1, colIndex, this.tbody);
                    //nextFocusCell.focus();
                    input.blur();
                }
            },
            cellSynchronize= () => {
                let links = Utils.parseExpression(input.value).parsedLinks;
            }
        input.addEventListener("blur", inputDone);
        input.addEventListener("keydown", inputKeyDone);
        input.addEventListener("change", cellSynchronize);

        // if clear - need to delete this cell
        let clearCellData = (event) => {
            if (event.target === input) {
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
                delete this.cellsData[cellName];
                event.target.innerHTML = "";
            }
        };
        this.tableWrapper.addEventListener("dblclick", invokeInput);
        this.tableWrapper.addEventListener("keypress", invokeInput);
        this.tableWrapper.addEventListener("keydown", clearCellData);

        let cellHeaderHiglight = (event) => {
            let {rowIndex, colIndex} = Utils.getCellCoordinates(event);
            this.rowHeaderList.children[rowIndex]
                .classList.toggle("cell-header-higlight");
            this.colHeaderList.children[colIndex]
                .classList.toggle("cell-header-higlight");
        };
        this.tableWrapper.addEventListener("focusin", cellHeaderHiglight);
        this.tableWrapper.addEventListener("focusout", cellHeaderHiglight);
        input.addEventListener("blur", cellHeaderHiglight);

        let changeFocus = (event) => {
            if (event.target === input &&
                Utils.keyCode.arrows.includes(event.keyCode)) {
                //event.preventDefault();
                return;
            }
            if ( Utils.keyCode.arrows.includes(event.keyCode) ) {
                event.preventDefault();
            }
            let {rowIndex, colIndex} = Utils.getCellCoordinates(event);
            switch (event.keyCode) {
                case Utils.keyCode.arrowLeft:
                    Utils.findCellOnSheet(rowIndex, colIndex - 1, this.tbody).focus();
                    break;
                case Utils.keyCode.arroRight:
                    Utils.findCellOnSheet(rowIndex, colIndex + 1, this.tbody).focus();
                    break;
                case Utils.keyCode.arrowDown:
                    Utils.findCellOnSheet(rowIndex + 1, colIndex, this.tbody).focus();
                    break;
                case Utils.keyCode.arrowUp:
                    Utils.findCellOnSheet(rowIndex - 1, colIndex, this.tbody).focus();
                    break;
            }
        }
        this.tableWrapper.addEventListener("keydown", changeFocus);
    }
}

class Cell {

    constructor(rowIndex, colIndex, tbody, value) {
        this.colIndex = colIndex;
        this.rowIndex = rowIndex;
        this.value = value;
        this.tbody = tbody
    }

    get cellColPosition () {
        return Utils.getNameFromNumber(this.colIndex);
    }

    get cellRowPosition() {
        return this.rowIndex + 1;
    }

    get name() {
        return `data-cell-${this.cellColPosition + this.cellRowPosition}`;
    }

    get value() {
        return this._value;
    }

    set value(value) {
        this._value = value;
    }

    get computedValue() {
        let newValue = this.value;
        if ( newValue.startsWith("=") ) {
            a(this.tbody);
            newValue = Utils.computeValue( newValue.slice(1), this.tbody );
        }
        return newValue;
    }
}
let editor = new SheetEditor();
})();