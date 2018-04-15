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

webrpg.Interactive = function(x,y,desc,color,collision) {
  if (!(this instanceof webrpg.Interactive)) return new webrpg.Interactive(x,y,desc,color,collision);

  this.x = x;
  this.y = y;
  this.desc = desc;
  this.collision = collision | false;
  this.color = color;
};

webrpg.Interactive.prototype.isInRange = function(px,py) {
  var xIsEqual = this.x === px;
  var yIsEqual = this.y === py;

  if (xIsEqual && yIsEqual) return true;

  var xIsMinus = (this.x - 1) === px;
  var yIsMinus = (this.y - 1) === py;
  var xIsPlus  = (this.x + 1) === px;
  var yisPlus  = (this.y + 1) === py;

  var xIsAligned = xIsMinus || xIsPlus;
  var yIsAligned = yIsMinus || yIsPlus;

  if (xIsEqual && yIsAligned) return true;
  if (yIsEqual && xIsAligned) return true;
  return false;
};

webrpg.Room = function(width,height) {
  if (!(this instanceof webrpg.Room)) return new webrpg.Room(width,height);

  this.width = width;
  this.height = height;
  this.tiles = [];
  this.interactives = [];

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
  frameCSS: 'border: dashed 1px #2d8bc9; padding: 5px 15px; margin: 10px 10px 10px 35px; background-color: #f4f4f4; border-color: #999999',
  cellCSS: 'border: solid 1px black; width: ',
  centerCSS: 'float: center',
  gameBoxCSS: 'padding: 5px 5px 5px 5px',

  rmCharacter: '█',

  logLength: 6
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
  this.container.setAttribute("style",webrpg.frameProperties.frameCSS + "width: 600px; height: 200pxv;");

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
  this.gameBox.setAttribute("style",webrpg.frameProperties.gameBoxCSS);
  this.middleCell.appendChild(this.gameBox);
  var actionBoxDiv = document.createElement("DIV");

  var form = document.createElement("FORM");
  var cnter = document.createElement("CENTER");
  this.interactButton = webrpg._internalFunctions.createButton(cnter,"Interact");
  this.interactButton.setAttribute("style", webrpg.frameProperties.centerCSS);
  form.appendChild(cnter);
  
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
  this.actionBox = document.createElement("P");
  this.actionBox.setAttribute("overflow","scroll");
  this.actionBox.setAttribute("style",webrpg.frameProperties.frameCSS);
  this.actionBox.setAttribute("id","actionBox");
  actionBoxContainer.appendChild(this.actionBox);
  actionBoxDiv.appendChild(actionBoxContainer);
  var hr = document.createElement("HR");
  this.middleCell.appendChild(hr);
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
  this.log = [];
};

webrpg.Frame.prototype.clearMiddleFrame = function() {
  while (this.gameBox.firstChild) {
    this.gameBox.removeChild(this.gameBox.firstChild);
  }
};

webrpg.Frame.prototype.updateActionLog = function() {
  while (this.actionBox.firstChild) {
    this.actionBox.removeChild(this.actionBox.firstChild);
  }
  var newLog = [];
  for (var i = this.log.length - (webrpg.frameProperties.logLength + 1); i < this.log.length; i++) {
    newLog.push(this.log[i]);
  }
  this.log = newLog;

  for (var i = 0; i < this.log.length; i++) {
    if (this.log[i]) this.actionBox.innerHTML += this.log[i] + "<br />";
  }
};

webrpg.Frame.prototype.displayCutscene = function() {
   this.cutsceneText.innerHTML = this.cutscene.cutscenes[this.cutsceneIndex];
};

webrpg._internalFunctions.eeError = function() {
  alert("Haha! We have hacked your computer to make it not work! Now, Are We Cool Yet? (Seriously, this error should never show. If you're a user, god speed.)");
};

// prototype function
webrpg.Frame.prototype.startGame = function() { webrpg._internalFunctions.eeError(); };
webrpg.Frame.prototype.advanceCutscene = function() { webrpg._internalFunctions.eeError(); };

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
  var center2 = document.createElement("CENTER");
  center2.appendChild(this.cutsceneText);
  this.gameBox.appendChild(center2);
  this.gameBox.appendChild(form);
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
      rmRow.push(webrpg.frameProperties.rmCharacter);
    }
    rm.push(rmRow);
  }
  return rm;
};

webrpg.Frame.prototype.render = function() {
  this.roomBox.innerHTML = '';
  var room = webrpg._internalFunctions.roomArray(this.room.width,this.room.height);
  for (var i = 0; i < this.room.interactives.length; i++) {
    var interactive = this.room.interactives[i];
    room[interactive.y][interactive.x] = '<span style="color: ' + interactive.color+'">' + webrpg.frameProperties.rmCharacter + '</span>';
  }
  for (var i = 0; i < this.room.entities.length; i++) {
    var entity = this.room.entities[i];
    room[entity.y][entity.x] = '<span style="color: ' + entity.color+'">' + webrpg.frameProperties.rmCharacter + '</span>';
  } 
  for (var i = 0; i < room.length; i++) {
    var str = '';
    var row = room[i];
    for (var j = 0; j < row.length; j++) {
      str += row[j];
      str += ' ';
    }
    this.roomBox.innerHTML += str;
    this.roomBox.innerHTML += "<br />";
  }
  this.updateActionLog(); 
};

webrpg.Frame.prototype.movePlayer = function(direction) {
  var px = webrpg.player.x;
  var py = webrpg.player.y;
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
  for (var i = 0; i < this.room.entities.length; i++) {
    var entity = this.room.entities[i];
    if (entity !== webrpg.player && entity.x === webrpg.player.x && entity.y === webrpg.player.y) {
      webrpg.player.x = px;
      webrpg.player.y = py;
    }
  }
  for (var j = 0; j < this.room.interactives.length; j++) {
    var interactive = this.room.interactives[j];
    if (interactive.collision && interactive.x === webrpg.player.x && interactive.y === webrpg.player.y) {
      webrpg.player.x = px;
      webrpg.player.y = py;
    }
  }
  this.render();
};

webrpg.Frame.prototype.interactMsg = "There's nothing here.";
webrpg.Frame.prototype.interact = function() {
  var foundSomething = false;
  for (var i = 0; i < this.room.interactives.length; i++) {
    var interactive = this.room.interactives[i];
    var exactCoords = (interactive.x === webrpg.player.x && interactive.y === webrpg.player.y);
    var onXAxis = ((interactive.x + 1 >= webrpg.player.x) && (interactive.x - 1 <= webrpg.player.x));
    var onYAxis = ((interactive.y + 1 >= webrpg.player.y) && (interactive.y - 1 <= webrpg.player.y));
    if (exactCoords || ((onXAxis && !onYAxis) || (!onXAxis && onYAxis))) {
      this.log.push(interactive.desc);
      foundSomething = true
    }
  }
  if (!foundSomething) {
    this.log.push(this.interactMsg);
  }
  this.updateActionLog();
};

webrpg.Frame.prototype.startGame = function() {
  this.stage = 1;
  this.clearMiddleFrame();
  this.roomBox = document.createElement("P");
  var center = document.createElement("CENTER");
  center.appendChild(this.roomBox);
  this.gameBox.appendChild(center);
  var frame = this;
  this.upArrow.onclick = function() { frame.movePlayer("up"); };
  this.leftArrow.onclick = function() { frame.movePlayer("left"); };
  this.downArrow.onclick = function() { frame.movePlayer("down"); };
  this.rightArrow.onclick = function() { frame.movePlayer("right"); };
  this.interactButton.onclick = function() { frame.interact(); };
  this.render();
};

webrpg.Frame.prototype.start = function() {
  this.stage = 0;
  this.runCutscene();
};
