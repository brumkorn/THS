/**
 * Created by Brumkorn on 04.06.2016.
 */
export class ThsException extends Error {
  constructor() {
    super();
    this.type = "#ERROR!";
    this.message = "SOME ERROR"
  }
}  
  
export class WrongValueException extends ThsException {
  constructor(parameter = "#uknown") {
    super();
    this.type = "#VALUE!";
    this.message = 
      `Error! Parameter expects to be a number. '${parameter}' is a string and can't be coerced to a number`;
  }
}

export  class WrongRangeException extends ThsException {
  constructor(parameter = "#uknown") {
    super();
    this.type = "#NAME?";
    this.message = `Error! Unknown range names detected '${parameter}'`;
  }
}