/**
 * Created by Brumkorn on 27.05.2016.
 */
import Utils from "./utils.class.js";
import {WrongRangeException, WrongValueException, ThsException}  from "./exceptions/exceptions.js";


let valueSymbol = Symbol();
let computedValueSymbol = Symbol();
let parentSheetNodeSymbol = Symbol();

let linkedCellNodesSymbol = Symbol();
let linkedListenersCacheSymbol = Symbol();

export default class Cell {

  constructor(rowIndex, colIndex, tbody, value, computedValue) {
    this.rowIndex = rowIndex;
    this.colIndex = colIndex;
    this[parentSheetNodeSymbol] = tbody;

    this[valueSymbol] = value;
    this[computedValueSymbol] = computedValue;


    this[linkedCellNodesSymbol] = [];
    this[linkedListenersCacheSymbol] = [];

  }

  get linksCellNodes() {
    return this[linkedCellNodesSymbol];
  }

  get cellNode() {
    return Utils.findCellOnSheet(this.rowIndex, this.colIndex, this.parentSheetNode)
  }

  get name() {
    return `${Utils.getCellName(this.rowIndex, this.colIndex)}`;
  }

  get value() {
    return this[valueSymbol];
  }

  get parentSheetNode() {
    return this[parentSheetNodeSymbol];
  }

  set value(value) {
    this[valueSymbol] = value || '';

    this.computeValue();
  }
  
  get computedValue() {
    return this[computedValueSymbol];
  }
  
//TODO get rid of input text like variables
  computeValue() {
    let cls = this;
    let tempValue,
      linksCellNodes,
      parsedInput,
      inputErrors;

    if(cls.value.charAt(0) !== "=") {
      cls[computedValueSymbol] = cls.value;
      cls.cellNode.innerHTML = cls.value;
      // cls.cellNode.dispatchEvent(new Event("change"));
      return cls[computedValueSymbol];
    }
    
    tempValue = cls.value.slice(1).toUpperCase();
    ({parsedInput, linksCellNodes, inputErrors} = Utils.parseExpression(tempValue, cls.parentSheetNode));


    handleLinksSynchronize();

    try {
      if (inputErrors.length > 0) {
        throw new WrongRangeException(inputErrors.toString());
      }
      cls[computedValueSymbol] = eval(prepareExpression()) || 0;

    } catch (err) {
      if (err instanceof ThsException) {
        cls[computedValueSymbol] = err.type;
        console.error(err.message);
      } else {
        cls[computedValueSymbol] = "#ERROR";
        console.error(err);
      }
    }

    cls.cellNode.innerHTML = cls[computedValueSymbol];

    cls.cellNode.dispatchEvent(new Event("change"));
    return cls[computedValueSymbol];
    
    //////////////////////////////////////

    function handleLinksSynchronize() {


      for (let {cellNode, func} of cls[linkedListenersCacheSymbol]) {
        cellNode.removeEventListener("change", func)
      }

      cls[linkedCellNodesSymbol] = linksCellNodes;
      for (let linkCellNode of linksCellNodes ) {
        cls[linkedListenersCacheSymbol]
          .push({"cellNode" : linkCellNode, "func": linkedCellChangeHdlr, "cellName": cls.name});
        linkCellNode.addEventListener('change', linkedCellChangeHdlr)
      }


      function linkedCellChangeHdlr() {
        setTimeout(function () {
          cls.computeValue();
        }, 0);
      }
    }
    
    function prepareExpression() {
      let expressionStr,
        operators,
        doublePlusesAndMinuses,
        plusMinus;

      expressionStr = "";
      operators = Utils.regExp.operators;
      doublePlusesAndMinuses = Utils.regExp.doublePlusesAndMinuses;
      plusMinus = Utils.regExp.plusMinus;

      for (let i = 0; i < parsedInput.length; i++) {
        let item = parsedInput[i];

        if (typeof item === "object" || item.search(operators) === -1) {
          continue;
        }
        while (item.length > 1) {
          if (item.search(doublePlusesAndMinuses) >= 0) {
            item = item.replace(doublePlusesAndMinuses, "+");
          }

          if (item.search(plusMinus) >= 0) {
            item = item.replace(plusMinus, "-")
          }
        }
        parsedInput[i] = item;
      }

      for (let item of parsedInput) {
        if (item instanceof HTMLElement) {
          if (item.innerHTML &&  isNaN(item.innerHTML) ) {
            throw new WrongValueException(item.innerHTML);
          }
          expressionStr += item.innerHTML || 0;
        } else {
          expressionStr += item;
        }
      }

      if (expressionStr.charAt(0).search(operators) >= 0) {
        expressionStr = `${0 + expressionStr}`;
      }
      if (expressionStr[expressionStr.length - 1].search(operators) >= 0) {
        expressionStr = `${expressionStr + 0}`;
      }

      if (expressionStr.search(Utils.regExp.cellLink) >= 0) return "";

      return  expressionStr;
      
    }
  }
}