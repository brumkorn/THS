/**
 * Created by Brumkorn on 27.05.2016.
 */
import firebase from "firebase";

import editorTemplate from "./editor.template.html!";
import FormulaBar from './formula-bar.class.js';
import Sheet from './sheet.class.js';


export default class SheetEditor {

  constructor(params) {
    this.target = document.querySelector("#ths-target");

    this.columns = Math.abs(26);
    this.rows = Math.abs(50);

    if (params && typeof params === "object") {
      this.target = params.target;
      this.maxColls = params.maxColls;
      this.maxRows = params.maxRows;
      this.readOnly = params.readOnly;
      this.columns = Math.abs(params.columns);
      this.rows = Math.abs(params.rows);
    }

    this.target.innerHTML = editorTemplate;

    this._currentSheet = null;
    this.sheetList = [];
    this.footerToolbar = document.querySelector(".footer-toolbar");
    this.serverData = null;

    this.start();
    initListeners.call(this);
  }

  get name() {
    return `Editor-for-${this.target.className}-window`;
  }

  start = start;

  loadSheets = loadSheets;

  loadData = loadData;

  initTable = initTable;

  createSheet = createSheet;

  saveData = saveData;

  addNewSheet = addNewSheet;

  switchSheet = switchSheet;

  deleteSheet = deleteSheet;
  /* init listeners method
   initListeners() {
   let select = this.footerToolbar.querySelector("select"),
   newSheetButton =
   this.footerToolbar.querySelector(".new-sheet-button"),
   sheetBookmarks =
   this.footerToolbar.querySelector(".sheet-bookmarks"),
   saveButton = document.getElementsByClassName("menu-button")[1],
   resetButton = document.getElementsByClassName("menu-button")[2],
   deleteSheetButton = document.getElementsByClassName("menu-button")[3];

   let switchSheetHandler = (event) => {
   if (event.target.parentElement.className === "sheet-bookmarks" ||
   event.target.tagName === "SELECT") {
   let sheetIndex = event.target.value || parseFloat(event.target.id);
   this.switchSheet(sheetIndex);
   }
   };
   let resetDataBasesHandler = () => {
   localStorage.setItem(this.name, "");
   };
   let deleteSheetHandler = () => {

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


   // window.onunload = () => {
   //     this.saveData();
   // }
   }
   */
}

function start() {

  if (localStorage[`${this.name}`]) {
    this.loadSheets();
    return;
  }

  firebase.database().ref().once('value', (snapshot) => {
    this.serverData = snapshot.val();
  }).then(() => {
    if (this.serverData) {
      alert("Loading from server");
      this.loadSheets();
      this.saveData();
      return;
    }

    localStorage.setItem(this.name, "");
    this.addNewSheet();
  });


}

function loadSheets() {
  let loadedData = this.loadData() || this.serverData;
  loadedData.forEach(function (item) {
    this.initTable();
    this.createSheet(item._currentColumns, item._currentRows, true);
  }, this);
  this.switchSheet(0);
}

function  loadData() {
  return JSON.parse(localStorage.getItem(this.name));
}

function initTable() {
  let windowFrame = document.querySelector(".main");
  let sheetContainer =
      windowFrame.appendChild(document.createElement("div")),
    tableWrapper =
      sheetContainer.appendChild(document.createElement("div"));
  tableWrapper.classList.add("table-wrapper");

  let colHeaderWrapper =
    sheetContainer
      .insertBefore(document.createElement("div"), tableWrapper);
  colHeaderWrapper.classList.add("col-header-wrapper");
  colHeaderWrapper.appendChild(document.createElement("div"));
  let colHeader =
    colHeaderWrapper.appendChild(document.createElement("div"));
  colHeaderWrapper.appendChild(document.createElement("div"));
  colHeader.classList.add("col-header");
  colHeader.appendChild(document.createElement("ol"));

  let rowHeader =
    sheetContainer
      .insertBefore(document.createElement("div"), tableWrapper);
  rowHeader.classList.add("row-header");
  rowHeader.appendChild(document.createElement("ol"));

  let table = tableWrapper.appendChild(document.createElement("table"));
  table.appendChild(document.createElement("tbody"));

  let toolbar = document.querySelector(".footer-toolbar"),
    select = toolbar.querySelector("select");
  select.appendChild(document.createElement("option"));
  let sheetBoormarks = toolbar.querySelector(".sheet-bookmarks");
  sheetBoormarks.appendChild(document.createElement("div"));
}

function   createSheet(
  columns = this.columns,
  rows = this.rows,
  loading = false
) {
  let editor = this;
  let toolbar = editor.footerToolbar,
    sheetID = editor.sheetList.length,
    sheetCellsData = {};

  if (loading) {
    sheetCellsData = editor.loadData() ?
      editor.loadData()[sheetID].cellsList :
      editor.serverData[sheetID].cellsList;
  }

  let sheet = new Sheet(columns, rows, sheetID, sheetCellsData);
  editor._currentSheet = sheet;

  let option = toolbar.querySelector("select > option:last-child");
  option.setAttribute("value", sheet.ID);
  option.textContent = sheet.name;

  let sheetBookmarksList =
    toolbar.querySelectorAll(".sheet-bookmarks > div");
  sheetBookmarksList[sheet.ID].id = `${sheet.ID}-sheet-bookmark`;
  sheetBookmarksList[sheet.ID].textContent = option.textContent;

  editor.sheetList.push(sheet);
  editor.switchSheet(sheet.ID);

  if (!loading) {
    editor.saveData();
  }
}

function saveData() {
  let editor = this;
  let sheetsData = [];
  editor.sheetList.forEach(ForEachCB, editor);

  localStorage.setItem(this.name, JSON.stringify(sheetsData));
  firebase.database().ref().set(sheetsData);

  function ForEachCB(sheet) {
    let cellsData = {};

    for (let cell in sheet.cellsList) {
      cellsData[cell] = {
        value: sheet.cellsList[cell].value,
        computedValue: sheet.cellsList[cell].computedValue,
        colIndex: sheet.cellsList[cell].colIndex,
        rowIndex: sheet.cellsList[cell].rowIndex
      };
    }

    let sheetData = {
      cellsList: cellsData,
      currentRows: sheet._currentRows,
      currentColumns: sheet._currentColumns
    };

    sheetsData.push(sheetData);
  }
}

function addNewSheet(columns, rows) {
  this.initTable();
  this.createSheet(columns, rows);
}

function switchSheet(sheetIndex) {
  let sheetBookmarksList =
      this.footerToolbar.querySelectorAll(".sheet-bookmarks > div"),
    sheetSelectList =
      this.footerToolbar.querySelectorAll("select > option");

  for (let i = 0; i < this.sheetList.length; i++) {
    sheetBookmarksList[i].classList.remove("bookmark-current-sheet");
    sheetSelectList[i].removeAttribute("selected");
    this.sheetList[i].sheetContainer.style.display = "none";
  }

  sheetBookmarksList[sheetIndex].classList.add("bookmark-current-sheet");
  sheetSelectList[sheetIndex].setAttribute("selected", "true");

  this._currentSheet = this.sheetList[sheetIndex];
  this._currentSheet.sheetContainer.style.display = "initial";
}

function  deleteSheet(delSheetIndex) {
  let sheetBookmarks =
      this.footerToolbar.querySelector(".sheet-bookmarks"),
    sheetBookmarksList =
      this.footerToolbar.querySelectorAll(".sheet-bookmarks > div"),
    sheetSelect =
      this.footerToolbar.querySelector("select"),
    sheetSelectList =
      this.footerToolbar.querySelectorAll("select > option"),
    removedSheet = this.sheetList.splice(delSheetIndex)[0];
  this.target.removeChild(removedSheet.sheetContainer);
  sheetBookmarks.removeChild(sheetBookmarksList[delSheetIndex]);
  sheetSelect.removeChild(sheetSelectList[delSheetIndex]);
  this.saveData();
}




/* private functions */
function initListeners() {
  console.log("initListeners", this);

  let select = this.footerToolbar.querySelector("select"),
    newSheetButton =
      this.footerToolbar.querySelector(".new-sheet-button"),
    sheetBookmarks =
      this.footerToolbar.querySelector(".sheet-bookmarks"),
    saveButton = document.getElementsByClassName("menu-button")[1],
    resetButton = document.getElementsByClassName("menu-button")[2],
    deleteSheetButton = document.getElementsByClassName("menu-button")[3];

  let switchSheetHandler = (event) => {
    if (event.target.parentElement.className === "sheet-bookmarks" ||
      event.target.tagName === "SELECT") {
      let sheetIndex = event.target.value || parseFloat(event.target.id);
      this.switchSheet(sheetIndex);
    }
  };
  let resetDataBasesHandler = () => {
    localStorage.setItem(this.name, "");
  };
  let deleteSheetHandler = () => {

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


  // window.onunload = () => {
  //     this.saveData();
  // }
}