;(function() {
    "use dtrict";
    createTable(10, 10);

    /*Create table with speifying number of columns and rows.
    *Table first row is tHead with column naming.
    *Table first column is header with row index.
    *Other table body consists of cells with input tags.
    *
    *Each input tag have ID wich consists of column letter and row index.
    *
    *@param columns - integer number of columns
    *@param rows - integer number of rows
    */

    function createTable(columns, rows) {
        let table = document.getElementById("table");
        let header = table.createTHead();
        header.id = "header";
        let body = table.appendChild( document.createElement("tbody") );
        let cell;

        for (let i = 0; i <= rows; i++) {
            let row;
            
            if (i === 0) {
                row = header.insertRow(-1);
            } else {
                row = body.insertRow(-1);
            }

            for (let j = 0; j <= columns; j++) {
                let cell = row.insertCell(-1);
                let letter = String.fromCharCode("A".charCodeAt(0) + j - 1);

                if (i === 0 && j === 0) {
                continue;
                }

                if (j === 0) {
                    cell.innerHTML = i;
                    continue;
                }

                if (i === 0) {
                    cell.innerHTML = letter;
                } else {
                    cell.innerHTML = "<input id=" + letter + (i) + " type='text'>";
                }
            }
        }
    }
})();