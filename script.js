;(function() {
    "use dtrict";

    let table = document.getElementById("table");
    let header = table.createTHead();
    let row = table.insertRow(0);

    addHeader();
    
    function addHeader() {
        for (let i = 0; i < 11; i++) {
            if (i === 0) {
                row.insertCell(i);
                continue;
            }
            let cell = row.insertCell(i);
            cell.innerHTML = String.fromCharCode("A".charCodeAt(0) + i - 1);
        }
    }

})();