/**
 * Created by Brumkorn on 01.06.2016.
 */

let inputNodeSymbol = Symbol();
let inputListenersSymbol = Symbol();

export default class InputCell {

  constructor() {
    this[inputNodeSymbol] = document.createElement("input");
    this[inputListenersSymbol] = []
  }

  get inputNode() {
    return this[inputNodeSymbol];
  }
  
  addListeners(sheet) {
    let cls = this;

    cls[inputListenersSymbol] = [
      {e: "blur", func: sheet.forcedFormulaModeFocusHdlr.bind(sheet)},
      {e: "keydown", func: sheet.inputKeyDoneHdlr.bind(sheet)},
      {e: "input", func: sheet.inputValueChangeHdlr.bind(sheet)}
    ];

    for (let {e, func} of cls[inputListenersSymbol]) {
      cls.inputNode.addEventListener(e, func);
    }
  }
  
  removeListeners() {
    let cls = this;

    for (let {e, func} of cls[inputListenersSymbol]) {
      cls.inputNode.removeEventListener(e, func);
    }
  }

}