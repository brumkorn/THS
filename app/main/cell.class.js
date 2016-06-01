/**
 * Created by Brumkorn on 27.05.2016.
 */
import Utils from "./utils.class.js";


export default class Cell {

  constructor(rowIndex, colIndex, tbody, value, computedValue) {
    this.rowIndex = rowIndex;
    this.colIndex = colIndex;
    this.value = value;
    this.computedValue = computedValue;

    this.tbody = tbody;

  }

  get cellNode() {
    return Utils.findCellOnSheet(this.rowIndex, this.colIndex, this.tbody)
  }

  get name() {
    return `${Utils.getCellName(this.rowIndex, this.colIndex)}`;
  }

  get value() {
    return this._value;
  }

  set value(value) {
    if(value && value.charAt(0) === "=") {
      value = value.toUpperCase();
    }
    this._value = value;
  }

  set computedValue(value) {
    this._computedValue = value;
  }

  get computedValue() {
    let newValue = this.value;
    if (newValue.startsWith("=")) {
      newValue = Utils.computeValue(newValue.slice(1), this.tbody);
    }
    this._computedValue = newValue;
    return this._computedValue;
  }
}