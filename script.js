;(function() {
    "use dtrict";

    let table = document.getElementById("table");
    

    addHeader(15);
    addRows(10);

    /*Create header for the table with editable quontity of columns
    *
    *@param quontity - integer number of columns
    *
    */
    function addHeader(quontity) {
        let header = table.createTHead();
        header.id = "header";
        let row = header.insertRow(-1);
        for (let i = 0; i <= quontity; i++) {
            let cell;

            if (i === 0) {
                row.insertCell(i);
                continue;
            }

            cell = row.insertCell(i);
            cell.innerHTML = String.fromCharCode("A".charCodeAt(0) + i - 1);
        }
    }

    /*Create rows by speify needed number
    *
    *@param quontity - integer number of rows
    *
    */
    function addRows(quontity) {
        let body = table.appendChild( document.createElement("tbody") );
        let columns = document.getElementById("header").firstChild;
        columns = columns.childElementCount - 1;

        for (let i = 0; i < quontity; i++) {
            let row = body.insertRow(-1);

            for (let j = 0; j <= columns; j++) {
                let cell;

                if (j === 0) {
                    let cell = row.insertCell(j);
                    cell.innerHTML = i+1;
                    continue;
                }

                cell = row.insertCell(j);
                cell.innerHTML = "<input type='text'>";
            }
        }
    }

})();