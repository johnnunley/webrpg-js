/*

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

// library object used to contain functions
var webrpg = {
  _internalFunctions = {};
};

webrpg.stage = 0;

/*
 * Stats:
 * hp = Hit Points
 * atk = Attack
 * def = Defense
 * spd = Speed
 * acc = Accuracy
 * dog = Dodge
 * lck = Luck
*/

webrpg.Entity = function(hp,atk,def,spd,acc,dog,lck,name,x,y) {
  if (!(this instanceof webrpg.Entity)) return new webrpg.Entity(hp,atk,def,spd,acc,dog,lck,name,x,y);

  this.hp = hp;
  this.atk = atk;
  this.def = def;
  this.spd = spd;
  this.acc = acc;
  this.dog = dog;
  this.lck = lck;
  this.name = name;
  this.x = x;
  this.y = y;
};

webrpg.Entity.prototype.damage = function(dmg) {
  this.hp -= dmg;
  return this.hp <= 0;
};

webrpg.tileTypes = {};
webrpg.tileTypes.standard = 0;
webrpg.tileTypes.warp = 1;
webrpg.tileTypes.trigger = 2;

webrpg.Tile = function(x,y,type,cbOrRmIndex,destX,destY) {
  if (!(this instanceof webrpg.Tile)) return new webrpg.Tile(x,y,type,cbOrRmIndex,destX,destY);

  this.x = x;
  this.y = y;
  this.type = type;

  if (type === webrpg.tileTypes.trigger) {
    this.callback = cbOrRmIndex;
  }
  
  if (type === webrpg.tileTypes.warp) {
    this.roomIndex = cbOrRmIndex;
    this.destX = destX;
    this.destY = destY;
  }
};

webrpg.Room = function(width,height) {
  if (!(this instanceof webrpg.Room)) return new webrpg.Room(width,height);

  this.width = width;
  this.height = height;
  this.tiles = [];

  for (var i = 0; i < width; i++) {
    var tileRow = [];
    for (var j = 0; j < width; j++) {
      tileRow[j] = webrpg.Tile(i,j,webrpg.tileTypes.standard);
    }
    this.tiles[i] = tileRow;
  }

  this.entities = [];
};

webrpg.rooms = [];

webrpg.frameProperties = {
  frameCSS: 'border: dashed 1px #2d8bc9; width: 600px; padding: 5px 15px; margin: 10px 10px 10px 35px; background-color: #f4f4f4; border-color: #999999';
  cellCSS: 'width: 33%';
};

webrpg._internalFunctions.createButton = function(form,text) {
  var button = document.createElement("INPUT");
  button.setAttribute("type","button");
  button.setAttribute("value",text);
  form.appendChild(button);
  return button;
};

webrpg._internalFunctions.createElement = function(name,container) {
  var elem = document.createElement(name);
  container.appendChild(elem);
  return elem;
};

webrpg.Frame = function(container) {
  if (!(this instanceof webrpg.Frame)) return new webrpg.Frame(container);

  this.container = document.createElement("BLOCKQUOTE");
  this.container.setAttribute("style",webrpg.frameProperties.frameCSS);

  var table = document.createElement("TABLE");
  var tbody = document.createElement("TBODY");
  var trow = document.createElement("TR");
  this.leftCell = document.createElement("TD");
  this.middleCell = document.createElement("TD");
  this.rightCell = document.createElement("TD");
  this.leftCell.setAttribute("style",webrpg.frameProperties.cellCSS); 
  this.middleCell.setAttribute("style",webrpg.frameProperties.cellCSS);
  this.rightCell.setAttribute("style",webrpg.frameProperties.cellCSS);

  var form = document.createElement("FORM");
  this.interactButton = webrpg._internalFunctions.createButton(form,"Interact");
  
  this.buttonTable = document.createElement("TABLE");
  var buttonTBody = document.createElement("TBODY");
  var buttonRow1 = document.createElement("TR");
  webrpg._internalFunctions.createElement("TD",buttonRow1);
  var upArrowCont = document.createElement("TD");
  this.upArrow = webrpg._internalFunctions.createButton(upArrowCont,"↑");
  buttonRow1.appendChild(upArrowCont);
  webrpg._internalFunctions.createElement("TD",buttonRow1);
  buttonTBody.appendChild(buttonRow1);

  var buttonRow2 = document.createElement("TR");
  var leftArrowCont = document.createElement("TD");
  this leftArrow = webrpg._internalFunctions.createButton(leftArrowCont,"←");
  buttonRow2.appendChild(leftArrowCont); 
  var downArrowCont = document.createElement("TD");
  this.downArrow = webrpg._internalFunctions.createButton(downArrowCont,"↓");
  buttonRow2.appendChild(downArrowCont);
  var rightArrowCont = document.createElement("TD");
  this.rightArrow = webrpg._internalFunctions.createButton(rightArrowCont,"→");
  buttonRow2.appendChild(rightArrowCont);
  buttonTBody.appendChild(buttonRow2);

  this.buttonTable.appendChild(buttonTBody);
  form.appendChild(this.buttonTable);
  this.leftCell.appendChild(form);

  var actionBoxContainer = document.createElement("DIV");
  var actionBoxLabel = document.createElement("P");
  actionBoxLabel.innerHTML = "Activity Log:";
  actionBoxContainer.appendChild(actionBoxLabel);
  this.actionBox = document.createElement("DIV");
  this.actionBox.setAttribute("overflow","scroll");
  this.actionBox.setAttribute("style",webrpg.frameProperties.frameCSS);
  actionBoxContainer.appendChild(this.actionBox);
  this.rightCell.appendChild(actionBoxContainer);

  trow.appendChild(this.leftCell);
  trow.appendChild(this.middleCell);
  trow.appendChild(this.rightCell);
  tbody.appendChild(trow);
  table.appendChild(tbody);
  this.container.appendChild(table);
  container.appendChild(this.container);
};
