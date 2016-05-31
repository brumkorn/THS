/**
 * Created by Brumkorn on 01.06.2016.
 */

let inputNodeSymbol = Symbol();
export default class InputCell {

  constructor() {
    this[inputNodeSymbol] = document.createElement("input");
  }


}