/**
 * Created by Brumkorn on 27.05.2016.
 */
import firebase from "firebase";

import editorTemplate from "./editor.template.html!";
import FormulaBar from './formula-bar.class.js';
import Sheet from './sheet.class.js';
import {_editorListeners} from './editor-listeners.js';

let a = console.log.bind(console);

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
    //editor.switchSheet(sheet.ID);

    if (!loading) {
      editor.saveData();
    }
  }

  saveData() {
    let editor = this,
      sheetsData = [];

    editor[sheetListSymbol].forEach(ForEachCB, editor);

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


/* Privat functions */
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