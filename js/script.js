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

// SheetEditor.DEFAULT_ROWS = 10;
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
            ctrl: 17
        }
    }

    static getNameFromNumber(num) {
        let numeric = num % 26;
        let letter = String.fromCodePoint(65 + numeric);
        let num2 = Math.floor(num / 26);
        if (num2 > 0) {
            return this.getNameFromNumber(num2 - 1) + letter;
        } else {
            return letter;
        }
    }
}


class SheetEditor {

    constructor(params = {}) {

        let {target = ".main", 
            columns = 26,
            rows = 35,
            maxColls = 60,
            maxRows = 300, 
            readOnly = false} = params;
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

    initTable() {
        let windowFrame = this.target;
        let sheetContainer =
            windowFrame.appendChild( document.createElement("div") ),
            tableWrapper =
                sheetContainer.appendChild( document.createElement("div") );
        tableWrapper.classList.add("table-wrapper");

        let colHeaderWrapper =
            sheetContainer.insertBefore(document.createElement("div"), tableWrapper);
        colHeaderWrapper.classList.add("col-header-wrapper");
        colHeaderWrapper.appendChild( document.createElement("div") );
        let colHeader = 
            colHeaderWrapper.appendChild( document.createElement("div") );
        colHeaderWrapper.appendChild( document.createElement("div") );
        colHeader.classList.add("col-header");
        colHeader.appendChild( document.createElement("ol") );

        let rowHeader = 
            sheetContainer.insertBefore(document.createElement("div"), tableWrapper);
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

        let sheetBookmarksList = toolbar.querySelectorAll(".sheet-bookmarks > div");
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
        a("Saving to local storage: " + objectData);
        localStorage.setItem(this.name, objectData);
    }

    loadData() {
        let objectData = JSON.parse(localStorage.getItem(this.name));
        return objectData;
    }
    start() {
        if (localStorage[`${this.name}`]) {
            this.loadSheets();
            return;
        }
       
        localStorage.setItem(this.name, "");
        this.addNewSheet();
    }

    loadSheets() {
        let self = this;
        let loadedData = this.loadData();
        loadedData.forEach(function(item) {
            self.initTable();
            self.createSheet(item._currentColumns, item._currentRows, true);
        })
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
        a("Editor's current sheet: ")
        a(this._currentSheet);
    }

    initListeners() {
        let select = this.footerToolbar.querySelector("select"),
            newSheetButton = this.footerToolbar.querySelector(".new-sheet-button"),
            sheetBookmarks = this.footerToolbar.querySelector(".sheet-bookmarks"),

            // not shure is it right to make such a varification. maybe need better event handling

            switchSheetHandler = (event) => {
                if (!event.target.id) return;
                let sheetIndex = event.target.value || parseFloat(event.target.id);
                this.switchSheet(sheetIndex);
            };
        select.addEventListener("change", switchSheetHandler);
        sheetBookmarks.addEventListener("click", switchSheetHandler);

        newSheetButton.addEventListener("click", () => this.addNewSheet());

        window.onunload = () => this.saveData();
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
        this.writeLoadedCellsData();
        this.initListeners();
    }

    writeLoadedCellsData() {
        a("Cells data loaded: ")
        a(this.cellsData);
        a("Items in cellsData loaded: ")
        for (let item in this.cellsData) {
            let currentCell = this.cellsData[item];
            let targetRow = this.tbody.children[currentCell.rowIndex];
            let targetCell = targetRow.children[currentCell.colIndex];
            a("Cell value: " + currentCell.value);
            a(targetCell);
            targetCell.innerHTML = currentCell.value;
        }
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

    saveToLocalStorage() {

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
        }
        this.tableWrapper.addEventListener("scroll", dynamicAddCells);

        let input = document.createElement("input");

        let inputDone = (event) => {
                let colIndex = event.path[1].cellIndex,
                    rowIndex = event.path[2].rowIndex,
                    cellColPosition = Utils.getNameFromNumber(colIndex),
                cellRowPosition = rowIndex + 1,
                cellPosition = cellColPosition + cellRowPosition;

                if(!this.cellsData[cellPosition]) {
                    this.cellsData[cellPosition] = new Cell(colIndex, rowIndex);
                }

                input.parentNode.innerHTML = input.value;
                this.cellsData[cellPosition].value = input.value;

                a(this.cellsData)
                a(this.cellsData[cellPosition]);

                input.value = "";
            },
            inputKeyDone = (event) => {
                if (event.keyCode === Utils.keyCode.enter) {
                    input.blur();
                }
            };
        input.addEventListener("blur", inputDone);
        input.addEventListener("keydown", inputKeyDone);

        let invokeInput = (event) => {
            if (event.target === input ||
                event.keyCode === Utils.keyCode.backspace ||
                event.keyCode === Utils.keyCode.del) {
                return;
            }
            if (event.keyCode &&
                event.keyCode != Utils.keyCode.enter) {
                event.target.innerHTML = "";
            }

            input.value = event.target.innerHTML;
            event.target.innerHTML = "";
            event.target.appendChild(input);
            input.focus();
            a(event);
            a("CellIndex: " + event.target.cellIndex);
            a("RowIndex: " + event.target.parentElement.rowIndex);
        };
        let clearCellData = (event) => {
            if (event.keyCode === Utils.keyCode.alt) {
                event.preventDefault();
            }

            if (event.keyCode === Utils.keyCode.backspace ||
                event.keyCode === Utils.keyCode.del) {
                event.preventDefault();
                event.target.innerHTML = "";
            }
        }
        this.tableWrapper.addEventListener("dblclick", invokeInput);
        this.tableWrapper.addEventListener("keypress", invokeInput);
        this.tableWrapper.addEventListener("keydown", clearCellData);
    }

    //          OLD CODE !!!!!!!!!!!!!!!!!!!!!

                // function enterData() {
                //     let tableWrapper = document.getElementById("tableWrapper");

                //     tableWrapper.addEventListener("dblclick", invokeInput);
                //     tableWrapper.addEventListener("keydown", invokeInput);

                //     /*
                //     * Event handler for dblclick Listner
                //     * 
                //     */

                //     function invokeInput(e) {
                //         let currentID = e.target.id
                //         let input; 
                //         let backspace = 8;
                //         let deleteKey = 46;
                //         let storageValue = localStorage[e.target.id] || "";

                //         if ( currentID.startsWith("row-head") 
                //             || currentID.startsWith("col-head")) {
                //             return;
                //         }

                //         //backspace produce back sheet changing-------------------------------------------------------------------------------
                //         // if (e.keyCode === backspace) {
                //         //     e.target.innerHTML = "";
                //         //     localStorage.removeItem(currentID);
                //         //     return;
                //         // }

                //         if (e.keyCode === deleteKey) {
                //             e.target.innerHTML = "";
                //             localStorage.removeItem(currentID);
                //             return;
                //         }

                //         input = document.createElement("input");
                //         input.value = storageValue;
                //         e.target.innerHTML = "";
                //         e.target.appendChild(input);
                //         input.focus();

                //         // cant catch event exception------------------------------------------------------------------------------------------

                //         input.addEventListener("blur", doneClick);
                //         input.addEventListener("keydown", doneEnter);

                //         //need Add delete storage key after backspace to ""---------------------------------------------------------------------

                //         function doneClick() {
                //             this.parentNode.innerHTML = compute(this.value);

                //             if (!this.value) {
                //                 localStorage.removeItem(currentID);
                //                 return;
                //             }

                //             localStorage[currentID] = this.value;
                //         }

                //         function doneEnter(e) {
                //             let enterKey = 13;
                //             if (e.keyCode === enterKey) {
                //                 this.blur();
                //             }
                //         }
                //     }
                // }

    //                              OLD CODE ENDS!!!!!!!!!!!!!!!!!

}

class Cell {

    constructor(colIndex, rowIndex) {
        this.colIndex = colIndex;
        this.rowIndex = rowIndex;
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
}


let editor = new SheetEditor();

























































/*
    let editor = new SheetEditor({
        target: '.main2',
        maxColls: 14,
        maxRows: 'F',
        readOnly: true
    });
*/


/*Old code
    

    /*
    *
    *
    *Invoking input by double click on cell. Entering data, saving it to 
    *local storage and computing formulas after '=' sign.
    *
    *
    */

    //Maybe need to separate into few functions
    function enterData() {
        let tableWrapper = document.getElementById("tableWrapper");

        tableWrapper.addEventListener("dblclick", invokeInput);
        tableWrapper.addEventListener("keydown", invokeInput);

        /*
        * Event handler for dblclick Listner
        * 
        */

        function invokeInput(e) {
            let currentID = e.target.id
            let input; 
            let backspace = 8;
            let deleteKey = 46;
            let storageValue = localStorage[e.target.id] || "";

            if ( currentID.startsWith("row-head") 
                || currentID.startsWith("col-head")) {
                return;
            }

            //backspace produce back sheet changing-------------------------------------------------------------------------------
            // if (e.keyCode === backspace) {
            //     e.target.innerHTML = "";
            //     localStorage.removeItem(currentID);
            //     return;
            // }

            if (e.keyCode === deleteKey) {
                e.target.innerHTML = "";
                localStorage.removeItem(currentID);
                return;
            }

            input = document.createElement("input");
            input.value = storageValue;
            e.target.innerHTML = "";
            e.target.appendChild(input);
            input.focus();

            // cant catch event exception------------------------------------------------------------------------------------------

            input.addEventListener("blur", doneClick);
            input.addEventListener("keydown", doneEnter);

            //need Add delete storage key after backspace to ""---------------------------------------------------------------------

            function doneClick() {
                this.parentNode.innerHTML = compute(this.value);

                if (!this.value) {
                    localStorage.removeItem(currentID);
                    return;
                }

                localStorage[currentID] = this.value;
            }

            function doneEnter(e) {
                let enterKey = 13;
                if (e.keyCode === enterKey) {
                    this.blur();
                }
            }
        }
    }
    //need verification of value in storage(ket = data-cell....)

    /*
    *
    *Ad event listener to "reset" button.  
    *Clearing all databases on click;
    *
    */
    function resetDBs() {
        let resetButton = document.getElementsByClassName("menu-button")[2];

        resetButton.addEventListener("click", reset); 

        function reset(e) {
            for (let elem in localStorage) {
                document.getElementById(elem).innerHTML = "";
            }
            localStorage.clear();
        }
    }

    /*
    *
    *Ad event listener to "save" button.  
    *Saving current local storage state to json db text file on server.
    *
    */
    function saveDB() {
        let saveButton = document.getElementsByClassName("menu-button")[1];

        saveButton.addEventListener("click", save); 

        function save(e) {
            postServerData('jsonpost.php', localStorage, function(data) {
                alert(data);
            });
        }
        

        // function save(e) {
        //     postServerData("jsonpost.php", localStorage, function(data) {
        //         alert(data);
        //     });
        // }
    }

    /*
    *
    *Loading saved data. Firs looking in localStorage, if localSorage is empty,
    *loading from json database from server.
    *
    */
    function loadData() {
        let value;
        if (localStorage.length) {
            for (let elem in localStorage) {
                value = compute( localStorage[elem] );
                document.getElementById(elem).innerHTML = value || "";
            }
        } 
        else {
            getServerData("jsonget.php", function(data) {
                for (let elem in data) {
                    localStorage[elem] = data[elem];
                    value = compute( data[elem] );
                    document.getElementById(elem).innerHTML = value || "";
                }
            });
            
        }
    }

    /*
    *
    *Computing expressions from storage or database
    *
    *@param {string} expression
    *
    *@return {primitive} computed result
    */

    // Formula handler will add here

    //Maybe need varification of JSON objects from storage and text file
    //somewhere because if input in file was not from save functions in this
    //app it may produce errors (not a string values, charAt verif not work);
    function compute(value) {
        if (typeof(value) === "string" && value.charAt(0) === "=") {
                value = eval(value.substring(1));
            }
        return value;
    }


    /*
    *
    *Getting json object with last saved spreadshit with server
    *POST request. Information saved in the txt file.
    *
    *
    *@param {string} path to php file(server);
    *@param {function} callback function with response handler
    */
    function getServerData(path, callback) {
        let httpRequest = new XMLHttpRequest();

        httpRequest.onreadystatechange = function () {
            if (httpRequest.readyState === 4) {
                if (httpRequest.status === 200) {
                    let JSONData = JSON.parse(httpRequest.responseText);
                    if (callback) callback(JSONData);
                }
            }
        };

        httpRequest.open("POST", path);
        httpRequest.send();
    }
    /*
    *
    *Post json object with saved spreadshit to server
    *with POST send. Information saving in the txt file.
    *
    *
    *@param {string} path to php file(server);
    *@param {object} json-object to send;
    *@param {function} callback function with response handler
    */
    function postServerData(path, object, callback) {
        let transition = JSON.stringify(object);
        let params = "nameKey=" + transition;
        let httpRequest = new XMLHttpRequest();

        httpRequest.onreadystatechange = function() {
            if (httpRequest.readyState === 4) {
                if (httpRequest.status === 200) {
                    let data = httpRequest.responseText;
                    if (callback) callback(data);
                }
            }
        };

        httpRequest.open('POST', path);
        httpRequest.setRequestHeader("Content-type",
                                     "application/x-www-form-urlencoded");
        httpRequest.send(params); 
    }
})();