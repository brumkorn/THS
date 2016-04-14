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

//         var c = new Cell;

//         FormulaCell.call(c)

// }

// SheetEditor.DEFAULT_ROWS = 10;
var a = console.log.bind(console);

;(function() {
"use strict";
function SheetEditor() {
    this._currentSheet;
}
function Sheet(sheetID) {
    this.name = "List " + (sheetID + 1);
    this.ID = sheetID;
    this._currentRows = 0;
    this._currentColumns = 0;
}

SheetEditor.prototype._DEFAULT_COLUMNS = 26;
SheetEditor.prototype._DEFAULT_ROWS = 60;
SheetEditor.prototype.sheetList = [];

SheetEditor.prototype.createTable = function() {
    var windowFrame = document.querySelector(".main");
    var sheetContainer =
         windowFrame.appendChild( document.createElement("div") );

    var tableWrapper = sheetContainer.appendChild( document.createElement("div") );
    tableWrapper.classList.add("table-wrapper");

    var colHeaderWrapper =
        sheetContainer.insertBefore(document.createElement("div"), tableWrapper);
    colHeaderWrapper.classList.add("col-header-wrapper");
    colHeaderWrapper.appendChild( document.createElement("div") );
    var colHeader = 
        colHeaderWrapper.appendChild( document.createElement("div") );
    colHeaderWrapper.appendChild( document.createElement("div") );
    colHeader.classList.add("col-header");
    colHeader.appendChild( document.createElement("ol") );

    var rowHeader = 
        sheetContainer.insertBefore(document.createElement("div"), tableWrapper);
    rowHeader.classList.add("row-header");
    rowHeader.appendChild( document.createElement("ol") );

    var table = tableWrapper.appendChild( document.createElement("table") )
    table.appendChild( document.createElement("tbody") );

    tableWrapper.addEventListener("scroll", pullHeaders);
    tableWrapper.addEventListener("scroll", dynamicAddCells);

    function pullHeaders () {
        rowHeader.style.top = 24 - this.scrollTop + "px";
        colHeader.style.left =  40 - this.scrollLeft + "px";
    }

    function dynamicAddCells () {
        var needMoreCols = 
            this.scrollWidth - (this.clientWidth + this.scrollLeft);
        var needMoreRows =
            this.scrollHeight - (this.clientHeight + this.scrollTop);

        if( needMoreCols < 200 ) {
            editor._currentSheet.addColumns(5);
        }

        if( needMoreRows < 120 ) {
            editor._currentSheet.addRows(5);
        }

    }
}
Sheet.prototype.insertColHeader = function(columns) {
            document.querySelector(".col-header ol")
                .appendChild( document.createElement("li") );
}
Sheet.prototype.insertRowHeader = function() {
            document.querySelector(".row-header ol")
                .appendChild( document.createElement("li") );
}
SheetEditor.prototype.createSheet = function(columns, rows) {
    var rows = rows || this._DEFAULT_ROWS,
        columns = columns || this._DEFAULT_COLUMNS;

    var sheet = new Sheet(this.sheetList.length);
    this._currentSheet = sheet;
    this.sheetList.push(sheet);
    
    var sheetContainer = document.querySelector(".main div:last-child");
    sheetContainer.id = sheet.ID + "-sheet-container"
    var tbody = sheetContainer.querySelector("tbody");

    sheet.addRows(rows);
    sheet.addColumns(columns);
}

Sheet.prototype.addRows = function(rows) {
    var tbody = document.querySelector("tbody");

    rows = rows || 1;
    this._currentRows += rows;

    for (var i = 0; i < rows; i++) {
        var row = tbody.insertRow(-1);
        this.insertRowHeader();
        for (var j = 0; j < this._currentColumns; j++) {
            var cell = row.insertCell(-1);

            cell.classList.add("data-cell");
            cell.tabIndex = i + this._currentRows + "";
        }
    }
}

Sheet.prototype.addColumns = function(columns) {
    var tbody = document.querySelector("tbody");
    var rowList = tbody.querySelectorAll("tr");

    columns = columns || 1;
    this._currentColumns += columns;

    for (var i = 0; i < this._currentRows; i++) {
        for (var j = 0; j < columns; j++) {
            if (i === 0) {
                this.insertColHeader();
            }

            var cell = rowList[i].insertCell(-1);
            cell.classList.add("data-cell");
            cell.tabIndex = this._currentRows + "";
        }
    }
}

var editor = new SheetEditor();
editor.createTable();
editor.createSheet();

a(editor._currentSheet.name);
a("rows: " + editor._currentSheet._currentRows);
a("columns: " + editor._currentSheet._currentColumns);
/*Old code*/
    /*
    *Create tableWrapper with speifying number of columns and rows.
    *tableWrapper first row is tHead with column naming.
    *tableWrapper first column is header with row index.
    *Other tableWrapper body consists of cells.
    *
    *Each input tag have ID wich consists of column letter and row index.
    *
    *@param columns - integer number of columns
    *@param rows - integer number of rows
    */

    // Seems Need to refactor. Dont like this complex nested loop with so much if
    // There must be an error.
    function createTable(columns, rows) {
        rows = rows || 1000;
        columns = columns || 26;

        var tableWrapper = document.getElementById("tableWrapper");
        var header = tableWrapper.createTHead();
        header.id = "header";
        var body = tableWrapper.appendChild( document.createElement("tbody") );

        for (var i = 0; i <= rows; i++) {
            var row;
            
            if (i === 0) {
                row = header.insertRow(-1);
            } else {
                row = body.insertRow(-1);
            }

            for (var j = 0; j <= columns; j++) {
                var cell = row.insertCell(-1);
                var letter = String.fromCharCode("A".charCodeAt(0) + j - 1);

                if (i === 0 && j === 0) {
                continue;
                }

                if (j === 0) {
                    cell.innerHTML = i;
                    cell.id = "row-head-" + i;
                    continue;
                }

                if (i === 0) {
                    cell.innerHTML = letter;
                    cell.id = "col-head-" + letter;
                } else {
                    cell.classList.add("data-cell");
                    cell.id = "data-cell-" + letter + (i);
                    cell.tabIndex = 1;
                }
            }
        }
    }

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
        var tableWrapper = document.getElementById("tableWrapper");

        tableWrapper.addEventListener("dblclick", invokeInput);
        tableWrapper.addEventListener("keydown", invokeInput);

        /*
        * Event handler for dblclick Listner
        * 
        */

        function invokeInput(e) {
            var currentID = e.target.id
            var input; 
            var backspace = 8;
            var deleteKey = 46;
            var storageValue = localStorage[e.target.id] || "";

            if ( currentID.startsWith("row-head") 
                || currentID.startsWith("col-head")) {
                return;
            }

            //backspace produce back page changing-------------------------------------------------------------------------------
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
                var enterKey = 13;
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
        var resetButton = document.getElementsByClassName("menu-button")[2];

        resetButton.addEventListener("click", reset); 

        function reset(e) {
            for (var elem in localStorage) {
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
        var saveButton = document.getElementsByClassName("menu-button")[1];

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
        var value;
        if (localStorage.length) {
            for (var elem in localStorage) {
                value = compute( localStorage[elem] );
                document.getElementById(elem).innerHTML = value || "";
            }
        } 
        else {
            getServerData("jsonget.php", function(data) {
                for (var elem in data) {
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
        var httpRequest = new XMLHttpRequest();

        httpRequest.onreadystatechange = function () {
            if (httpRequest.readyState === 4) {
                if (httpRequest.status === 200) {
                    var JSONData = JSON.parse(httpRequest.responseText);
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
        var transition = JSON.stringify(object);
        var params = "nameKey=" + transition;
        var httpRequest = new XMLHttpRequest();

        httpRequest.onreadystatechange = function() {
            if (httpRequest.readyState === 4) {
                if (httpRequest.status === 200) {
                    var data = httpRequest.responseText;
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