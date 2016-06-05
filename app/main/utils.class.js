/**
 * Created by Brumkorn on 27.05.2016.
 */
let a = console.log.bind(console);

export default class Utils {
  static get keyCode() {
    return {
      alt: 18,
      arrows: [37, 38, 39, 40],
      arrowRight: 39,
      arrowLeft: 37,
      arrowUp: 38,
      arrowDown: 40,
      backspace: 8,
      ctrl: 17,
      del: 46,
      enter: 13,
      escape: 27,
      equalSign: 187,
      shift: 16
    };
  }

  static get regExp() {
    return {
      operators: /[\+\-\*\/]/,
      cellLink: /([A-Z]+[0-9]+)/gi,
      cellLinkParts: /([A-Z]+)|([0-9]+)/gi,
      cellLinkEnding: /([A-Z]+[0-9]+)$/i,
      pickingInputEnding: /([=\+\-\*\/])$|([=\+\-\*\/]+[A-Z]+[0-9]+)$/i,
      validInput: /([A-Z]+[0-9]+)|([0-9]+)|([\+\-\*\/]+)|([\(\)])/gi,
      invalidInput: /([A-Z]+[^0-9]+)/gi,
      doublePlusesAndMinuses: /([\-]{2})|([\+]{2})/g,
      plusMinus: /(\+\-)|(\-\+)/g
    }
  }

  static get pickedCellColors() {
    return [
      "#edaf00",
      "#ed2bb4",
      "#1dd4ed",
      "#8e411c",
      "#41ed1e",
      "#385ded",
      "#eda1dc",
      "#958ded",
      "#ed1a7f",
      "#a9ed2d",
      "#318ced",
      "#db6fed",
      "#ed6811"
    ]
  }

  static getNameFromNumber(num) {
    if (typeof num !== "number") {
      console.error("Wrong type in getNameFromNumber", typeof num);
      debugger;
      return;
    }
    let upperLatinLetters = 26,
      upperLatinAUnicode = 65,
      numeric = num % upperLatinLetters;
    let letter = String.fromCodePoint(upperLatinAUnicode + numeric);
    let num2 = Math.floor(num / upperLatinLetters);
    if (num2 > 0) {
      return this.getNameFromNumber(num2 - 1) + letter;
    } else {
      return letter;
    }
  }

  static getNumberFromName(letter) {
    let numeric = 0,
      upperLatinAUnicode = 65;

    for (let i = 0; i < letter.length; i++) {
      numeric += letter.charCodeAt(i) - upperLatinAUnicode;
    }
    return numeric;
  }

  static findCellOnSheet(rowIndex, colIndex, tbody) {
    let targetRow = tbody.children[rowIndex];
    return targetRow.children[colIndex];
  }

  static getCellName(rowIndex, colIndex) {
    let cellColName = Utils.getNameFromNumber(colIndex);
    let cellRowName = rowIndex + 1;
    return cellColName + cellRowName;
  }

  static getCellCoordinates(data) {

    let cellInfo = {};



    if (data instanceof HTMLElement && data.nodeName === "TD") {
      let cellNode = data;
      let rowIndex = cellNode.parentElement.rowIndex;
      let colIndex = cellNode.cellIndex;
      let cellName = Utils.getCellName(rowIndex, colIndex);

      cellInfo.rowIndex = rowIndex;
      cellInfo.colIndex = colIndex;
      cellInfo.cellName = cellName;

    } else if (typeof data === "object" && data.path) {
      let event = data,
        colIndex,
        rowIndex,
        cellName;

      if (event.path[0].cellIndex >= 0) {
        colIndex = event.path[0].cellIndex;
        rowIndex = event.path[1].rowIndex;
      } else {
        colIndex = event.path[1].cellIndex;
        rowIndex = event.path[2].rowIndex;
      }

      cellName = Utils.getCellName(rowIndex, colIndex);

      cellInfo.rowIndex = rowIndex;
      cellInfo.colIndex = colIndex;
      cellInfo.cellName = cellName;

    } else if (typeof data === "string") {
      let cellNameArr = data.match(Utils.regExp.cellLinkParts);
      let rowIndex = cellNameArr[1] - 1;
      let colIndex = Utils.getNumberFromName(cellNameArr[0]);


      cellInfo.rowIndex = rowIndex;
      cellInfo.colIndex = colIndex;
      cellInfo.cellName = data;
    }

    cellInfo.cellName = cellInfo.cellName.toUpperCase();
    cellInfo.findNode = function (tbody) {
      return Utils.findCellOnSheet(cellInfo.rowIndex, cellInfo.colIndex, tbody);
    };

    return cellInfo;
  }

  static parseExpression(inputExp, tbody) {
    let inputArr,
      inputErrors,
      parsedInput,
      linksCellNodes,
      linksCellNames;

    inputArr = inputExp.match(Utils.regExp.validInput) || [];
    inputErrors = inputExp.match(Utils.regExp.invalidInput) || [];
    linksCellNodes = [];
    linksCellNames = [];

    parsedInput = inputArr.map(function (current) {
      let matched = current.match(Utils.regExp.cellLink);

      if (matched) {
        let cellName = matched[0].toUpperCase();
        linksCellNames.push(cellName);
        let {rowIndex, colIndex} =
          Utils.getCellCoordinates(cellName);


        let linkNode = Utils.findCellOnSheet(rowIndex, colIndex, tbody);
        linksCellNodes.push(linkNode);

        return linkNode;
      }

      return current
    });
    
    return {
      parsedInput,
      linksCellNodes,
      linksCellNames,
      inputErrors
    };
  }
}