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
    "use strict"; 
    createTable();
    loadData();
    enterData();
    resetDBs();
    saveDB();



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