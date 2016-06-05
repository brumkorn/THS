/**
 * Created by Brumkorn on 27.05.2016.
 */
let a = console.log.bind(console);

import firebase from "firebase";

import editorTemplate from "./editor.template.html!";
import FormulaBar from './formula-bar.class.js';
import Sheet from './sheet.class.js';


let currentSheetSymbol = Symbol();
let sheetListSymbol = Symbol();

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
    this.formulaBar = new FormulaBar(this);

    this[currentSheetSymbol] = null;
    this[sheetListSymbol] = [];
    this.footerToolbar = document.querySelector(".footer-toolbar");
    this.serverData = null;

    _start.call(this);
    _editorListeners.call(this);
  }

  get name() {
    return `Editor-for-${this.target.className}-window`;
  }

  get currentSheet() {
    return this[currentSheetSymbol];
  }

  get sheetList() {
    return this[sheetListSymbol];
  }


  loadSheets() {
    let loadedData = this.loadData() || this.serverData;
    loadedData.forEach(function (item) {
      _initTable();
      this.createSheet(item._currentColumns, item._currentRows, true);
    }, this);
    this.switchSheet(0);
  }

  loadData() {
    return JSON.parse(localStorage.getItem(this.name));
  }

  createSheet(columns = this.columns,
              rows = this.rows,
              loading = false) {
    let editor,
      toolbar,
      sheetID,
      sheetCellsData,
      option,
      sheet,
      sheetBookmarksList;

    editor = this;
    toolbar = editor.footerToolbar;
    sheetID = editor[sheetListSymbol].length;
    sheetCellsData = {};

    if (loading) {
      sheetCellsData = editor.loadData() ?
        editor.loadData()[sheetID].cellsList :
        editor.serverData[sheetID].cellsList;
    }

    sheet = new Sheet(columns, rows, sheetID, sheetCellsData, this.formulaBar);
    editor[currentSheetSymbol] = sheet;

    option = toolbar.querySelector("select > option:last-child");
    option.setAttribute("value", sheet.ID);
    option.textContent = sheet.name;

    sheetBookmarksList = toolbar.querySelectorAll(".sheet-bookmarks > div");
    sheetBookmarksList[sheet.ID].id = `${sheet.ID}-sheet-bookmark`;
    sheetBookmarksList[sheet.ID].textContent = option.textContent;

    editor[sheetListSymbol].push(sheet);

    if (!loading) {
      editor.saveData();
    }
  }

  saveData() {
    let cls = this,
      sheetsData = [];

    for (let sheet of cls[sheetListSymbol]) {
      let cellsData = {};

      for (let cell in sheet.cellsList) {
        if (sheet.cellsList.hasOwnProperty(cell)) {
          cellsData[cell] = {
            value: sheet.cellsList[cell].value,
            computedValue: sheet.cellsList[cell].computedValue,
            colIndex: sheet.cellsList[cell].colIndex,
            rowIndex: sheet.cellsList[cell].rowIndex
          };
        }
      }

      let sheetData = {
        cellsList: cellsData,
        currentRows: sheet.currentRows,
        currentColumns: sheet.currentColumns
      };

      sheetsData.push(sheetData);
    }

    localStorage.setItem(this.name, JSON.stringify(sheetsData));
    firebase.database().ref().set(sheetsData);
  }

  addNewSheet(columns, rows) {
    _initTable();
    this.createSheet(columns, rows);
  }

  switchSheet(sheetIndex) {
    console.log("sitching sheet");
    let sheetBookmarksList,
      sheetSelectList;

    sheetBookmarksList = this.footerToolbar.querySelectorAll(".sheet-bookmarks > div");
    sheetSelectList = this.footerToolbar.querySelectorAll("select > option");

    for (let i = 0; i < this[sheetListSymbol].length; i++) {
      sheetBookmarksList[i].classList.remove("bookmark-current-sheet");
      sheetSelectList[i].removeAttribute("selected");
      this[sheetListSymbol][i].sheetContainer.style.display = "none";
    }

    sheetBookmarksList[sheetIndex].classList.add("bookmark-current-sheet");
    sheetSelectList[sheetIndex].setAttribute("selected", "true");

    this[currentSheetSymbol].removeListeners();
    this[currentSheetSymbol] = this[sheetListSymbol][sheetIndex];
    this[currentSheetSymbol].addListeners();
    this.formulaBar.switchTargetSheet(this[currentSheetSymbol]);
    this[currentSheetSymbol].sheetContainer.style.display = "initial";
  }

  deleteSheet(delSheetIndex) {
    let sheetBookmarks,
      sheetBookmarksList,
      sheetSelect,
      sheetSelectList,
      removedSheet;

    sheetBookmarks = this.footerToolbar.querySelector(".sheet-bookmarks");
    sheetBookmarksList = this.footerToolbar.querySelectorAll(".sheet-bookmarks > div");
    sheetSelect = this.footerToolbar.querySelector("select");
    sheetSelectList = this.footerToolbar.querySelectorAll("select > option");
    removedSheet = this[sheetListSymbol].splice(delSheetIndex)[0];
    this.target.removeChild(removedSheet.sheetContainer);
    sheetBookmarks.removeChild(sheetBookmarksList[delSheetIndex]);
    sheetSelect.removeChild(sheetSelectList[delSheetIndex]);
    this.saveData();
  }
}

/* Private functions */
function _start() {

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

function _initTable() {
  let windowFrame,
    sheetContainer,
    tableWrapper,
    colHeaderWrapper,
    colHeader,
    rowHeader,
    table,
    toolbar,
    select;

  windowFrame = document.querySelector(".main");

  sheetContainer = windowFrame.appendChild(document.createElement("div"));

  colHeaderWrapper = sheetContainer.appendChild(document.createElement("div"));

  rowHeader = sheetContainer.appendChild(document.createElement("div"));
  rowHeader.appendChild(document.createElement("ol"));
  
  tableWrapper = sheetContainer.appendChild(document.createElement("div"));
  tableWrapper.appendChild(document.createElement("table"))
    .appendChild(document.createElement("tbody"));

  colHeaderWrapper.appendChild(document.createElement("div"));

  colHeader = colHeaderWrapper.appendChild(document.createElement("div"));
  colHeader.appendChild(document.createElement("ol"));

  colHeaderWrapper.appendChild(document.createElement("div"));

  toolbar = document.querySelector(".footer-toolbar");
  toolbar.querySelector(".sheet-bookmarks")
    .appendChild(document.createElement("div"));

  toolbar.querySelector("select")
    .appendChild(document.createElement("option"));

  colHeaderWrapper.classList.add("col-header-wrapper");
  tableWrapper.classList.add("table-wrapper");
  colHeader.classList.add("col-header");
  rowHeader.classList.add("row-header");
}

function _editorListeners() {
  let cls = this;

  let select,
    newSheetButton,
    sheetBookmarks,
    saveButton,
    resetButton,
    deleteSheetButton;

  select = cls.footerToolbar.querySelector("select");
  newSheetButton = cls.footerToolbar.querySelector(".new-sheet-button");
  sheetBookmarks = cls.footerToolbar.querySelector(".sheet-bookmarks");
  saveButton = document.getElementsByClassName("menu-button")[1];
  resetButton = document.getElementsByClassName("menu-button")[2];
  deleteSheetButton = document.getElementsByClassName("menu-button")[3];

  newSheetButton.addEventListener("click", () => cls.addNewSheet());
  select.addEventListener("change", switchSheetHandler);
  sheetBookmarks.addEventListener("click", switchSheetHandler);
  deleteSheetButton.addEventListener("click", deleteSheetHandler);
  resetButton.addEventListener("click", resetDataBasesHandler);
  saveButton.addEventListener("click", () => cls.saveData());

  function switchSheetHandler(event) {

    if (event.target.parentElement.className === "sheet-bookmarks" ||
      event.target.tagName === "SELECT") {

      let sheetIndex = event.target.value || parseFloat(event.target.id);
      cls.switchSheet(sheetIndex);
    }
  }

  function resetDataBasesHandler() {
    localStorage.setItem(cls.name, "");
  }

  function deleteSheetHandler() {

    let decision,
      delSheetID;

    decision = confirm(
      `                       Warning!

Are you shure you want to delete ${cls.currentSheet.name}?
`
    );

    if (!decision) return;


    delSheetID = cls.currentSheet.ID;
    cls.switchSheet(cls.currentSheet.ID - 1);
    cls.deleteSheet(delSheetID);
  }
}