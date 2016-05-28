/**
 * Created by Brumkorn on 27.05.2016.
 */
import Utils from "main/utils.js";
export default class Cell {

  constructor(rowIndex, colIndex, tbody, value, computedValue) {
    this.colIndex = colIndex;
    this.rowIndex = rowIndex;
    this.value = value;
    this.tbody = tbody;
    this.computedValue = computedValue;
  }

  get cellNode() {
    return Utils.findCellOnSheet(this.rowIndex, this.colIndex, this.tbody)
  }

  get name() {
    return `${Utils.getCellName}`;
  }

  get value() {
    return this._value;
  }

  set value(value) {
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