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
  _internalFunctions: {}
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

webrpg.Entity = function(hp,atk,def,spd,acc,dog,lck,name,x,y,color) {
  if (!(this instanceof webrpg.Entity)) return new webrpg.Entity(hp,atk,def,spd,acc,dog,lck,name,x,y,color);

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
  this.color = color;
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
webrpg.currentRoom = null;

webrpg.Cutscene = function(cutscenes) {
  if (!(this instanceof webrpg.Cutscene)) return new webrpg.Cutscene(cutscenes);
 
  this.cutscenes = cutscenes;
};

// note: NEEDS to be set, otherwise the entire game will crash
webrpg.startingCutscene = null;

webrpg.frameProperties = {
  frameCSS: 'border: dashed 1px #2d8bc9; width: 600px; height: 600px; padding: 5px 15px; margin: 10px 10px 10px 35px; background-color: #f4f4f4; border-color: #999999',
  cellCSS: 'border: solid 1px black; width: ',
  centerCSS: 'float: center',

  rmCharacter: '█'
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
  this.leftCell.setAttribute("style",webrpg.frameProperties.cellCSS + '25%'); 
  this.middleCell.setAttribute("style",webrpg.frameProperties.cellCSS + '75%');
//  this.rightCell.setAttribute("style",webrpg.frameProperties.cellCSS + '25%');
  this.gameBox = document.createElement("DIV");
  this.middleCell.appendChild(this.gameBox);
  var actionBoxDiv = document.createElement("DIV");

  var form = document.createElement("FORM");
  this.interactButton = webrpg._internalFunctions.createButton(form,"Interact");
  this.interactButton.setAttribute("style", webrpg.frameProperties.centerCSS);
  
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
  this.leftArrow = webrpg._internalFunctions.createButton(leftArrowCont,"←");
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
  actionBoxDiv.appendChild(actionBoxContainer);
  this.middleCell.appendChild(actionBoxDiv);

  trow.appendChild(this.leftCell);
  trow.appendChild(this.middleCell);
//  trow.appendChild(this.rightCell);
  tbody.appendChild(trow);
  table.appendChild(tbody);
  this.container.appendChild(table);
  container.appendChild(this.container);

  this.stage = webrpg.stage;
  this.cutscene = webrpg.startingCutscene;
  this.room = webrpg.currentRoom;
};

webrpg.Frame.prototype.clearMiddleFrame = function() {
  while (this.middleCell.firstChild) {
    this.middleCell.removeChild(this.middleCell.firstChild);
  }
};

webrpg.Frame.prototype.displayCutscene = function() {
   this.cutsceneText.innerHTML = this.cutscene.cutscenes[this.cutsceneIndex];
};

// prototype function
webrpg.Frame.prototype.startGame = function() { console.log("fatal error"); };
webrpg.Frame.prototype.advanceCutscene = function() { console.log("fatal error"); };

webrpg.Frame.prototype.assignButtonCallback = function() {
  var frame = this;
  if (this.cutsceneIndex < this.cutscene.cutscenes.length - 1) {
    this.advancebutton.onclick = function() { frame.advanceCutscene(); };
  }
  else {
    this.advancebutton.onclick = function() { frame.startGame(); };
  }
};

webrpg.Frame.prototype.runCutscene = function() {
  this.stage = 0;
  this.cutsceneIndex = 0;
  this.clearMiddleFrame();
  this.cutsceneText = document.createElement("P");
  this.cutsceneText.setAttribute("style",webrpg.frameProperties.centerCSS);
  this.displayCutscene(); 

  var form = document.createElement("FORM");
  var center = document.createElement("CENTER");
  this.advancebutton = webrpg._internalFunctions.createButton(center,"Next");
  this.assignButtonCallback();
  form.appendChild(center);
  this.middleCell.appendChild(this.cutsceneText);
  this.middleCell.appendChild(form);
};

webrpg.Frame.prototype.advanceCutscene = function() {
  this.cutsceneIndex++;
  this.displayCutscene();
  this.assignButtonCallback();
};

webrpg._internalFunctions.roomArray = function(width,height) {
  var rm = [];
  for (var i = 0; i < width; i++) {
    var rmRow = [];
    for (var j = 0; j < height; j++) {
      rmRow[j] = webrpg.frameProperties.rmCharacter;
    }
    rm[i] = rmRow;
  }
  return rm;
};

webrpg.Frame.prototype.render = function() {
  var room = webrpg._internalFunctions.roomArray(this.room.width,this.room.height);
  for (var i = 0; i < this.room.entities.length; i++) {
    var entity = this.room.entities[i];
    room.tiles[entity.x][entity.y] = '<span style="color: ' + entity.color+'">' + webrpg.frameProperties.rmCharacter + '</span>';
  }
  for (var i = 0; i < room.length; i++) {
    var str = '';
    var row = room.tiles[i];
    for (var j = 0; j < row.length; j++) {
      str += row[j];
      str += ' ';
    }
    this.roomBox.innerHTML += str;
    this.roomBox.innerHTML += "<br />";
  }
};

webrpg.Frame.prototype.movePlayer = function(direction) {
  if (direction === "left") {
    webrpg.player.x -= 1;
    if (webrpg.player.x < 0) webrpg.player.x = 0;
  }
  else if (direction === "right") {
    webrpg.player.x += 1;
    if (webrpg.player.x >= this.room.width) webrpg.player.x = this.room.width - 1;
  }
  else if (direction === "up") {
    webrpg.player.y -= 1;
    if (webrpg.player.y < 0) webrpg.player.y = 0;
  }
  else if (direction === "down") {
    webrpg.player.y += 1;
    if (webrpg.player.y >= this.room.height) webrpg.player.y = this.room.height - 1;
  }
  this.render();
};

webrpg.Frame.prototype.startGame = function() {
  this.stage = 1;
  this.clearMiddleFrame();
  this.roomBox = document.createElement("P");
  this.middleCell.appendChild(this.roomBox);
  var frame = this;
  this.upArrow.onclick = function() { frame.movePlayer("up"); };
  this.leftArrow.onclick = function() { frame.movePlayer("left"); };
  this.downArrow.onclick = function() { frame.movePlayer("down"); };
  this.rightArrow.onclick = function() { frame.movePlayer("right"); };
};

webrpg.Frame.prototype.start = function() {
  this.stage = 0;
  this.runCutscene();
};
