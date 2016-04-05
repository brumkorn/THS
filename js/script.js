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


;(function() {
    "use dtrict";
    createTable();
    loadData();
    enterData();

    /*
    *Create table with speifying number of columns and rows.
    *Table first row is tHead with column naming.
    *Table first column is header with row index.
    *Other table body consists of cells.
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

        var table = document.getElementById("table");
        var header = table.createTHead();
        header.id = "header";
        var body = table.appendChild( document.createElement("tbody") );

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
        var table = document.getElementById("table");

        table.addEventListener("dblclick", invokeInput);
        table.addEventListener("keydown", invokeInput);

        /*
        * Event handler for dblclick Listner
        * 
        */

        function invokeInput(e) {
            var input; 
            var backspace = 8;
            var storageValue = localStorage[e.target.id] || "";

            if ( e.target.id.startsWith("row-head") 
                || e.target.id.startsWith("col-head")) {
                return;
            }

            // backspace produce back page changing-------------------------------------------------------------------------------

            // if (e.keyCode === backspace) {
            //     e.target.innerHTML = "";
            //     localStorage[e.target.id] = "";
            //     return;
            // }

            input = document.createElement("input");
            input.value = storageValue;
            e.target.innerHTML = "";
            e.target.appendChild(input);
            input.focus();

            // cant catch event exception------------------------------------------------------------------------------------------

            input.addEventListener("blur", doneClick);
            input.addEventListener("keydown", doneEnter);

            function doneClick() {
                this.parentNode.innerHTML = compute(this.value);
                if (this.value) {
                    localStorage[e.target.id] = this.value;
                } 
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

    function loadData() {
        if (localStorage.length) {
            for(elem in localStorage) {
                var value = localStorage[elem];
                value = compute(value);
                document.getElementById(elem).innerHTML = value || "";
            }
        } else {

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
    function compute(value) {
        if (value.charAt(0) == "=") {
                value = eval(value.substring(1));
            }
        return value;
    }

})();