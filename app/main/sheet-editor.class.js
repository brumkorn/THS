/**
 * Created by Brumkorn on 27.05.2016.
 */


import firebase from "firebase";

import editorTemplate from "./templates/editor.template.html!";
import sheetContainerTemplate from "./templates/sheet-containter.template.html!"
import sheetTab from "./templates/sheet-tab.template.html!"
import FormulaBar from './formula-bar.class.js';
import Sheet from './sheet.class.js';


let currentSheetSymbol = Symbol();
let sheetListSymbol = Symbol();

export default class SheetEditor {

  constructor(params) {


    this.columns = Math.abs(26);
    this.rows = Math.abs(50);

    // if (params && typeof params === "object") {
    //   this.target = params.target;
    //   this.maxColls = params.maxColls;
    //   this.maxRows = params.maxRows;
    //   this.readOnly = params.readOnly;
    //   this.columns = Math.abs(params.columns);
    //   this.rows = Math.abs(params.rows);
    // }
    this.creationCounter = 0;
    this[currentSheetSymbol] = null;
    this[sheetListSymbol] = [];
    this.serverData = null;

    this.target = document.querySelector("#ths-target");
    this.target.innerHTML = editorTemplate;
    this.formulaBar = new FormulaBar(this);
    this.toolBar = document.querySelector(".tools-wrapper");
    this.footerToolbar = document.querySelector(".footer-toolbar");



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
    console.log(this[sheetListSymbol]);
    return this[sheetListSymbol];
  }


  loadSheets() {
    let loadedData = this.loadData() || this.serverData;
    loadedData.forEach(function (item) {
      _initTable();
      this.createSheet(item.currentColumns, item.currentRows, true);
    }, this);
    this.switchSheet(0);
  }

  loadData() {
    return JSON.parse(localStorage.getItem(this.name));
  }

  createSheet(columns = this.columns,
              rows = this.rows,
              loading = false) {
    let cls = this;

    let sheetID,
      sheetCellsData,
      sheet,
      sheetBookmarksList;


    sheetID = guid();
    sheetCellsData = {};

    this.creationCounter++;

    if (loading) {
      sheetCellsData = cls.loadData() ?
        cls.loadData()[cls.sheetList.length].cellsList :
        cls.serverData[cls.sheetList.length].cellsList;
    }

    cls[currentSheetSymbol] = new Sheet(columns, rows, sheetID, sheetCellsData, this.formulaBar, cls);


   cls.footerToolbar
     .querySelector("#dropdownSheetsList ul")
     .appendChild(document.createElement("li"))
     .innerHTML = `<a href="#">${cls[currentSheetSymbol].name}</a>`;

    sheetBookmarksList = cls.footerToolbar.querySelectorAll(".sheet-bookmarks > div");
    sheetBookmarksList[cls.sheetList.length].querySelector("span.tab-title").textContent = cls[currentSheetSymbol].name;

    cls.sheetList.push(cls[currentSheetSymbol]);

    if (!loading) {
      cls.saveData();
    }

    function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      return s4() + s4();
    }
  }

  saveData() {
    let cls = this,
      sheetsData = [];

    for (let sheet of cls.sheetList) {
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
    console.log(sheetIndex);
    let cls = this;
    let sheetBookmarksList;

    sheetBookmarksList = cls.footerToolbar.querySelectorAll(".sheet-bookmarks > div");


    for (let i = 0; i < cls.sheetList.length; i++) {
      sheetBookmarksList[i].classList.remove("bookmark-current-sheet");
      cls.sheetList[i].sheetContainer.style.display = "none";
    }

    sheetBookmarksList[sheetIndex].classList.add("bookmark-current-sheet");


    cls[currentSheetSymbol].removeListeners();
    cls[currentSheetSymbol] = cls.sheetList[sheetIndex];
    cls[currentSheetSymbol].addListeners();
    cls.formulaBar.switchTargetSheet(cls[currentSheetSymbol]);
    cls[currentSheetSymbol].sheetContainer.style.display = "initial";

  }

  deleteSheet(delSheetIndex) {
    let cls = this;

    let sheetBookmarksList,
      dropdownSheetsList;

    sheetBookmarksList = cls.footerToolbar.querySelectorAll(".sheet-bookmarks div.sheet-tab");
    dropdownSheetsList = cls.footerToolbar.querySelectorAll("#dropdownSheetsList li");
debugger;

    let [removedSheet] = cls.sheetList.splice(delSheetIndex, 1);

    removedSheet.sheetContainer.remove();
    sheetBookmarksList[delSheetIndex].remove();
    dropdownSheetsList[delSheetIndex].remove();

    cls.saveData();
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
    toolbar;

  windowFrame = document.querySelector(".main");

  sheetContainer = windowFrame.appendChild(document.createElement("div"));

  sheetContainer.innerHTML = sheetContainerTemplate;

  toolbar = document.querySelector(".footer-toolbar");
  toolbar.querySelector(".sheet-bookmarks")
    .appendChild(document.createElement("div")).outerHTML = sheetTab;

}

function _editorListeners() {
  let cls = this;

  let select,
    dropdownSheetsList,
    addSheetButton,
    sheetBookmarks,
    saveButton,
    resetButton,
    deleteSheetButton;

  select = cls.footerToolbar.querySelector("select");
  dropdownSheetsList = cls.footerToolbar.querySelector("#dropdownSheetsList ul")
  addSheetButton = cls.footerToolbar.querySelector("#add-sheet-button");
  sheetBookmarks = cls.footerToolbar.querySelector(".sheet-bookmarks");
  saveButton = cls.toolBar.querySelector("div.btn-save");
  resetButton = cls.toolBar.querySelector("div.btn-reset");
  deleteSheetButton = cls.toolBar.querySelector("div.btn-delete");

  addSheetButton.addEventListener("click", () => cls.addNewSheet());
  dropdownSheetsList.addEventListener("click", switchSheetHdlr);
  sheetBookmarks.addEventListener("click", switchSheetHdlr);
  sheetBookmarks.addEventListener("click", displayDropdownHdlr);
  deleteSheetButton.addEventListener("click", deleteSheetHdlr);
  resetButton.addEventListener("click", resetDataBasesHdlr);
  saveButton.addEventListener("click", () => cls.saveData());
  document.addEventListener("click", hideDropDownHdlr);
  sheetBookmarks.addEventListener("click", deleteSheetHdlr);

  function hideDropDownHdlr() {
    let isOpen = sheetBookmarks.querySelector(".dropdown-menu.opened");

    if(isOpen && event.target.className !== "caret") {
      let dropdowns = sheetBookmarks.querySelectorAll(".dropdown-menu");
      for (let item of dropdowns) {
        item.style.display = "none";
        item.classList.remove("opened");
      }
    }
  }

  function displayDropdownHdlr(event) {
    if(event.target.className === "caret") {
      let menu =   event.path[2].querySelector(".dropdown-menu");
      menu.style.display = "initial";
      menu.classList.add("opened");
    }

  }
  function switchSheetHdlr(event) {
    console.log(event);
    if(event.target.nodeName === "DIV" || event.target.className === "tab-title") {
      let list,
        node,
        targetSheetIndex,
        currentSheetIndex;

      list = event.path[2].children;
      node = event.path[1];

      if (event.target.classList.contains("sheet-tab")) {
        list = event.path[1].children;
        node = event.path[0];
      }

      if (event.target.classList.contains("tab-title") ||
        event.target.classList.contains("caret")) {
        list = event.path[3].children;
        node = event.path[2];
      }

      targetSheetIndex = Array.prototype.indexOf.call(list, node);
      currentSheetIndex = cls.sheetList.indexOf(cls.currentSheet);

      if (targetSheetIndex !== currentSheetIndex) {
        cls.switchSheet(targetSheetIndex);

      }
    }
  }

  function resetDataBasesHdlr() {
    localStorage.removeItem(cls.name);
    firebase.database().ref().set("");
  }

  function deleteSheetHdlr(event) {
    if (event.target.className !== "sheet-tab-delete-btn") return;

    let decision,
      delSheetID;

    decision = confirm(
      `                       Warning!

Are you shure you want to delete ${cls.currentSheet.name}?
`
    );

    if (!decision) return;


    delSheetID = cls.sheetList.indexOf(cls.currentSheet);
    cls.switchSheet(delSheetID - 1);
    cls.deleteSheet(delSheetID);
  }
}