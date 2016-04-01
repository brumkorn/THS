;(function() {
    "use dtrict";
    createTable(26, 1000);

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
                    continue;
                }

                if (i === 0) {
                    cell.innerHTML = letter;
                } else {
                    cell.id =letter + (i);
                }
            }
        }
    }

})();