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


        table.addEventListener("dblclick", dblClickCell);

/*
* Event handler for dblclick Listner
*/
        function dblClickCell(e) {
            var input; 

            if ( e.target.id.startsWith("row-head") 
                || e.target.id.startsWith("col-head")) {
                return;
            }

            input = document.createElement("input");
            input.value = e.target.innerHTML;
            e.target.innerHTML = "";
            e.target.appendChild(input);
            input.focus();
            input.addEventListener("blur", doneClick);
            input.addEventListener("keyup", doneEnter);

            function doneClick(e) {
                this.parentNode.innerHTML = this.value;
            }

            function doneEnter(e) {
                if (e.keyCode === 13) this.blur();
            }
        }
    }

/*
*
*
*
*
*
*
*/


})();