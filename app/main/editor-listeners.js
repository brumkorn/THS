/**
 * Created by Brumkorn on 29.05.2016.
 */
export function _editorListeners() {
  console.log("Editor initListeners", this);

  let select,
    newSheetButton,
    sheetBookmarks,
    saveButton,
    resetButton,
    deleteSheetButton;

  select = this.footerToolbar.querySelector("select");
  newSheetButton = this.footerToolbar.querySelector(".new-sheet-button");
  sheetBookmarks = this.footerToolbar.querySelector(".sheet-bookmarks");
  saveButton = document.getElementsByClassName("menu-button")[1];
  resetButton = document.getElementsByClassName("menu-button")[2];
  deleteSheetButton = document.getElementsByClassName("menu-button")[3];

  let switchSheetHandler,
    resetDataBasesHandler,
    deleteSheetHandler;

  switchSheetHandler = (event) => {
    if (event.target.parentElement.className === "sheet-bookmarks" ||
      event.target.tagName === "SELECT") {
      let sheetIndex = event.target.value || parseFloat(event.target.id);
      this.switchSheet(sheetIndex);
    }
  };

  resetDataBasesHandler = () => {
    localStorage.setItem(this.name, "");
  };

  deleteSheetHandler = () => {

    let decision = confirm(
      `                       Warning!

Are you shure you want to delete ${this._currentSheet.name}?
`
    );
    if (!decision) return;
    let delSheetID = this._currentSheet.ID;
    this.switchSheet(this._currentSheet.ID - 1);
    this.deleteSheet(delSheetID);
  };
  newSheetButton.addEventListener("click", () => this.addNewSheet());
  select.addEventListener("change", switchSheetHandler);
  sheetBookmarks.addEventListener("click", switchSheetHandler);
  deleteSheetButton.addEventListener("click", deleteSheetHandler);
  resetButton.addEventListener("click", resetDataBasesHandler);
  saveButton.addEventListener("click", () => this.saveData());


}