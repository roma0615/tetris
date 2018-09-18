var canvas = document.getElementById("canvas");
window.onresize = resizeCanvas;
var ctx = canvas.getContext("2d");

function adjustColor(c, percent) { // + for lighten, - for darken
	var color = c.substring(1);
	var num = parseInt(color,16),
		amt = Math.round(2.55 * percent),
		R = (num >> 16) + amt,
		B = (num >> 8 & 0x00FF) + amt,
		G = (num & 0x0000FF) + amt;
	return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
}

function drawGhostSquare(color, x, y, w) {
	ctx.fillStyle = color;
	ctx.fillRect(x, y, w, w);
	ctx.fillRect(x+w/10, y+w/10, w/10*8, w/10*8);
}

function drawSquare(color, x, y, w) {
	ctx.fillStyle = color;
	ctx.fillRect(x, y, w, w);
	// top
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x+w/7, y+w/7);
	ctx.lineTo(x+w/7*6, y+w/7);	
	ctx.lineTo(x+w, y);
	ctx.fillStyle = adjustColor(color, 60);
	ctx.fill();
	// left
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x+w/7, y+w/7);
	ctx.lineTo(x+w/7, y+w/7*6);	
	ctx.lineTo(x, y+w);
	ctx.fillStyle = adjustColor(color, 50);
	ctx.fill();
	// right
	ctx.beginPath();
	ctx.moveTo(x+w, y);
	ctx.lineTo(x+w/7*6, y+w/7);
	ctx.lineTo(x+w/7*6, y+w/7*6);	
	ctx.lineTo(x+w, y+w);
	ctx.fillStyle = adjustColor(color, -15);
	ctx.fill();
	// bottom
	ctx.beginPath();
	ctx.moveTo(x, y+w);
	ctx.lineTo(x+w/7, y+w/7*6);
	ctx.lineTo(x+w/7*6, y+w/7*6);	
	ctx.lineTo(x+w, y+w);
	ctx.fillStyle = adjustColor(color, -30);
	ctx.fill();
}

var frame = 0;

pieces = {
	i: {
		shape: ["    ","XXXX","    ","    "],
		color: "#4EC3FF"
	},
	o: {
		shape: ["XX","XX"],
		color: "#FFFA39"
	},
	l: {
		shape: ["  X","XXX","   "],
		color: "#FD8528"
	},
	j: {
		shape: ["X  ", "XXX","   "],
		color: "#0000FF"
	},
	t: {
		shape: [" X ", "XXX", "   "],
		color: "#AA00FF"
	},
	z: {
		shape: ["XX "," XX","   "],
		color: "#FC0006"
	},
	s: {
		shape: [" XX","XX ","   "],
		color: "#1EE709"
	}
};

rotation = [
	{
		"0->1": [[ 0, 0], [-1, 0], [-1,-1], [ 0,+2], [-1,+2]],
		"1->0": [[ 0, 0], [+1, 0], [+1,+1], [ 0,-2], [+1,-2]],
		"1->2": [[ 0, 0], [+1, 0], [+1,+1], [ 0,-2], [+1,-2]],
		"2->1": [[ 0, 0], [-1, 0], [-1,-1], [ 0,+2], [-1,+2]],
		"2->3": [[ 0, 0], [+1, 0], [+1,-1], [ 0,+2], [+1,+2]],
		"3->2": [[ 0, 0], [-1, 0], [-1,+1], [ 0,-2], [-1,-2]],
		"3->0": [[ 0, 0], [-1, 0], [-1,+1], [ 0,-2], [-1,-2]],
		"0->3": [[ 0, 0], [+1, 0], [+1,-1], [ 0,+2], [+1,+2]]
	},
	{
		"0->1": [[ 0, 0], [-2, 0], [+1, 0], [-2,+1], [+1,-2]],
		"1->0": [[ 0, 0], [+2, 0], [-1, 0], [+2,-1], [-1,+2]],
		"1->2": [[ 0, 0], [-1, 0], [+2, 0], [-1,-2], [+2,+1]],
		"2->1": [[ 0, 0], [+1, 0], [-2, 0], [+1,+2], [-2,-1]],
		"2->3": [[ 0, 0], [+2, 0], [-1, 0], [+2,-1], [-1,+2]],
		"3->2": [[ 0, 0], [-2, 0], [+1, 0], [-2,+1], [+1,-2]],
		"3->0": [[ 0, 0], [+1, 0], [-2, 0], [+1,+2], [-2,-1]],
		"0->3": [[ 0, 0], [-1, 0], [+2, 0], [-1,-2], [+2,+1]]
	}
];

function Piece(name, pieceShape, pieceColor) {
	this.name = name;
	this.rotateStage = 0; // 0, 1, 2, 3
	this.shape = pieceShape.map(function(arr) {
		return arr.slice();
	});
	this.color = pieceColor;

	this.draw = function(x, y, offGrid) {
		for (var i = 0; i < this.shape.length; i++) {
			for (var j = 0; j < this.shape[i].length; j++) {
				if (this.shape[i][j] !== 'X') continue;
				if (offGrid) {
					drawSquare(this.color, x+j*board.width/10, y+i*board.width/10, board.width/10);
				} else {
					// draw a square at the (x+j)*s, (y+i)*s
					drawSquare(this.color, (x+j)*board.width/10, (y+i)*board.width/10, board.width/10);
				}
			}
		}
	};
	this.resetRotation = function() {
		while (this.rotateStage !== 0) {
			this.shape = this.rotateMatrix("left");
		}
	}
	this.rotateMatrix = function(dir) {
		var newShape = [];
		if (dir === "left") {
			this.rotateStage = (this.rotateStage+3)%4;
			for (var i = this.shape[0].length-1; i >= 0; i--) {
				var s = "";
				for (var j = 0; j < this.shape.length; j++) {
					s += this.shape[j].charAt(i);
				}
				newShape.push(s);
			}
		} else {
			this.rotateStage = (this.rotateStage+1)%4;
			for (var i = 0; i < this.shape[0].length; i++) {
				var s = "";
				for (var j = this.shape.length-1; j >= 0; j--) {
					s += this.shape[j].charAt(i);
				}
				newShape.push(s);
			}
		}
		return newShape;
	}
	// https://tetris.wiki/SRS#Wall_Kicks
	this.rotate = function(board, rotDir) {
		var oldRotateStage = this.rotateStage;
		var newShape = this.rotateMatrix(rotDir);
		
		// final move values
		var moveX = -100;
		var moveY = -100;

		var dictNum = 0;
		if (this.name == "i") dictNum = 1;
		var mappingString = oldRotateStage + "->" + this.rotateStage;
		for (var test = 0; test < 5; test++) {
			var fail = false;

			// test if translation by x and y results in valid position
			// rotation[dictNum][mappingString][test][x:0, y:1]
			var shiftX = rotation[dictNum][mappingString][test][0];
			var shiftY = rotation[dictNum][mappingString][test][1];
			// go thru shape
			for (var i = 0; i < newShape.length; i++) {
				for (var j = 0; j < newShape[i].length; j++) {
					var x = board.fallingX + j + shiftX,
						y = board.fallingY + i + shiftY;

					// ignore blank spots
					if (newShape[i].charAt(j) !== "X") continue;
					// if out of bounds, fail
					if (y < 0 || y >= board.grid.length || x < 0 || x >= board.grid[0].length) {
						fail = true;
						break;
					}
					if (board.grid[y][x] !== 0) {
						// theres a block there! Fail!
						fail = true;
						break;
					}
				} // end j
				if (fail) break;
			} // end i
			if (!fail) { // this is a valid spot!
				moveX = shiftX;
				moveY = shiftY;
				break;
			}
		}
		if (moveX !== -100) { // found a valid rotation
			board.fallingX += moveX;
			board.fallingY += moveY;
			this.shape = newShape;
			return true;
		} else { 
			// {dont}
			return false;
		}
	};
	this.addToGrid = function(board) {	
		for (var i = 0; i < this.shape.length; i++) {
			for (var j = 0; j < this.shape[i].length; j++) {
				if (this.shape[i][j] !== 'X') continue;
				// convert to block and add to grid
				board.grid[board.fallingY+i][board.fallingX+j] = new Block(this.color);
			}
		}
	};
	this.touchingBottom = function(board) {
		for (var i = 0; i < this.shape.length; i++) {
			for (var j = 0; j < this.shape[i].length; j++) {
				if (this.shape[i][j] !== 'X') continue;
				// the pos of current block is: (board.fallingX + j, board.fallingY + i)
				if (board.fallingY+i+1 == 20) return true;
				if (board.grid[board.fallingY+i+1][board.fallingX+j] !== 0) {
					if (board.fallingY == 0) {
						// we just started falling, already touching something
						// end the game
						game.gameOver = true;
						stopSound("theme");
					}
					return true;
				}
			}
		}
		return false;
	};
	this.touchingSide = function(board, dx) {
		for (var i = 0; i < this.shape.length; i++) {
			for (var j = 0; j < this.shape[i].length; j++) {
				if (this.shape[i][j] !== 'X') continue;
				if (board.fallingX+j+dx < 0 || board.fallingX+j+dx >= board.grid[0].length) return true;
				if (board.grid[board.fallingY+i][board.fallingX+j+dx] !== 0) return true;
			}
		}
		return false;
	};
	this.getGhost = function(board) {
		var wouldBeFallenPiece = new Piece("", this.shape, this.color);
		var fakeBoard = {grid: board.grid, fallingX: board.fallingX, fallingY: board.fallingY};
		while (!wouldBeFallenPiece.touchingBottom(fakeBoard)) {
			fakeBoard.fallingY++;
		}
		var ghost = new Ghost(this.shape, fakeBoard.fallingX, fakeBoard.fallingY);
		return ghost;
	};
	return this;
}
function Ghost(shape, x, y) {
	this.shape = shape;
	this.x = x;
	this.y = y;
	this.color = "#7774"; // translucent
	this.draw = function() {
		for (var i = 0; i < this.shape.length; i++) {
			for (var j = 0; j < this.shape[i].length; j++) {
				if (this.shape[i][j] !== 'X') continue;
				// draw a square at the (x+j)*s, (y+i)*s
				drawGhostSquare(this.color, (this.x+j)*board.width/10, (this.y+i)*board.width/10, board.width/10);
			}
		}
	};
	return this;
}
function Block(color) {
	this.color = color;
	this.draw = function(gridX, gridY) {
		drawSquare(this.color, gridX*board.width/10, gridY*board.width/10, board.width/10);
	};
	return this;
}


function randomPiece() {
	var prop = pickRandomProperty(pieces);
	return getPiece(prop);
}
function getPiece(name) {
	return new Piece(name, pieces[name].shape, pieces[name].color); // random piece
}

function pickRandomProperty(obj) {
    var result;
    var count = 0;
    for (var prop in obj)
        if (Math.random() < 1/++count)
           result = prop;
    return result;
}

board = {
	grid: [...Array(20)].map(e => Array(10).fill(0)), // 10x20, starts as 0
	fallingPiece: randomPiece(),
	fallingX: 4,
	fallingY: 0,
	width: canvas.width/2,
	height: canvas.height,
	reset: function() {
		this.grid = [...Array(20)].map(e => Array(10).fill(0)); // 10x20, starts as 0
		this.newPiece();
	},
	newPiece: function() {
		game.swapped = false;
		this.fallingPiece = game.getNextPiece();
		this.fallingX = 4;
		this.fallingY = 0;
	},
	drawBlocks: function() {
		for (var i = 0; i < this.grid.length; i++) {
			for (var j = 0; j < this.grid[i].length; j++) {
				if (this.grid[i][j] === 0) continue; // if no block
				// else, its a block!
				this.grid[i][j].draw(j, i);
			}
		}
	},
	moveFalling: function(dx) {
		if (!this.fallingPiece.touchingSide(this, dx)) {
			this.fallingX += dx;
			playSound("move");
		}
	},
	fall: function() {
		if (this.fallingPiece.touchingBottom(this)) {
			if (game.gameOver) return false;
			// add the piece to the real grid and create a new falling piece
			this.fallingPiece.addToGrid(this);

			// get new block and start at top
			this.newPiece();

			board.checkClear();
			playSound("drop");
			return false;
		} else {
			this.fallingY++;
			board.checkClear();
			return true;
		}
	},
	checkClear: function() {
		fullRows = [];
		// go through each row, if all are not undefined then save its index and 
		for (var i = 0; i < this.grid.length; i++) {
			var full = true;
			for (var j = 0; j < this.grid[i].length; j++) {
				if (this.grid[i][j] === 0) {
					full = false;
					break;
				}
			}
			if (full) fullRows.push(i);
		}
		if (fullRows.length == 0) return;
		for (var i = 0; i < fullRows.length; i++) {
			var row = fullRows[i];
			for (var j = 0; j < this.grid[row].length; j++) {
				this.grid[row][j] = 0;
			}
		}
		// now we have gaps, shift them down
		var shiftAmount = 0;
		for (var i = this.grid.length-1; i >= 0; i--) {
			if (fullRows.includes(i)) {
				shiftAmount++;
			} else {
				if (shiftAmount == 0) continue;
				for (var j = 0; j < this.grid[i].length; j++) {
					this.grid[i+shiftAmount][j] = this.grid[i][j];
					this.grid[i][j] = 0;
				}
			}
		}
		// make it faster!
		game.speed -= game.speed * 0.03 << 0;
	},
	initWithGrid: function(arr) {
		for (var i = 0; i < arr.length; i++) {
			for (var j = 0; j < arr[i].length; j++) {
				if (arr[i][j] === 1) {
					this.grid[i][j] = new Block("#777777");
				}
			}
		}
	},
	clearAllButGray: function() {
		for (var i = 0; i < this.grid.length; i++) {
			for (var j = 0; j < this.grid[i].length; j++) {
				if (this.grid[i][j] === 0) continue;
				if (this.grid[i][j].color !== "#777777") this.grid[i][j] = 0;
			}
		}
	}
};

function resizeCanvas() {
	var d = Math.min(document.body.clientWidth/5*4, document.body.clientHeight/5*4);
	canvas.width = d;
	canvas.height = d;
	board.width = d/2;
	board.height = d;
}

window.onkeydown = function(e) {
	if (game.firstTimeBeforeStart) {
		if (e.keyCode == 32) {
			game.firstTimeBeforeStart = false;
			playSound("theme");
		}
	} else {
		if (game.paused) {
			// to get out of pause:
			// space, P, esc, or enter
			if (e.keyCode == 32 || e.keyCode == 80 || e.keyCode == 27 || e.keyCode == 13) {
				game.paused = false;
				playSound("theme");
			}
		} else {
			if (!game.gameOver) {
				if (e.keyCode == 38) { // up
					board.fallingPiece.rotate(board, "right");
				} else if (e.keyCode == 16) { // shift
					board.fallingPiece.rotate(board, "left");
				} else if (e.keyCode == 37) { // left
					board.moveFalling(-1);
				} else if (e.keyCode == 39) { // right
					board.moveFalling(1);
				} else if (e.keyCode == 40) { // down
					// drop a little
					board.fall();
					frame = 1;
				} else if (e.keyCode == 32) { // space
					// drop all the way
					while (board.fall());
					frame = 1;
				} else if (e.keyCode == 67) { // c
					if (game.hold === 0) { // first time hold
						board.fallingPiece.resetRotation()
						game.hold = board.fallingPiece;
						board.newPiece();
					} else if (!game.swapped) { // swap the hold and current falling piece
						game.swapped = true;
						var temp = game.hold;
						board.fallingPiece.resetRotation();
						game.hold = board.fallingPiece;
						board.fallingPiece = temp;
						board.fallingX = 4;
						board.fallingY = 0;
					}
				} else if (e.keyCode == 71 && game.troubleshooting) {
					board.fallingPiece = getPiece(prompt("Piece"));
				}
			} else {
				if (e.keyCode == 32) { // space
					// restart the game
					board.reset();
					game.reset();
					frame = 1;
					playSound("theme");
				}
			}
			if (e.keyCode == 80) { // p
				pauseSound("theme");
				game.paused = true;
			}
		}
	}
};

game = {
	speed: 240,
	gameOver: false,
	firstTimeBeforeStart: true,
	swapped: false,
	troubleshooting: false,
	hold: 0, // later will be a piece object
	queue: [randomPiece(), randomPiece(), randomPiece()],
	getNextPiece: function(board) {
		var next = this.queue[0];
		this.queue[0] = this.queue[1];
		this.queue[1] = this.queue[2];
		this.queue[2] = randomPiece();
		return next;
	},
	reset: function() {
		this.speed = 240;
		this.gameOver = false;
		this.hold = 0;
		this.queue = [randomPiece(), randomPiece(), randomPiece()];
		this.swapped = false;
	}
}

function updateGame() {
	// background
	ctx.fillStyle = "#1A1A1A";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.strokeStyle = "white";
	ctx.lineWidth = 2;
	ctx.strokeRect(1, 1, board.width-2, board.height-2);

	// hold box
	ctx.strokeRect(canvas.width/12*7, 0, canvas.width/12*5, canvas.width/12*3);

	// queue box
	ctx.strokeRect(canvas.width/12*7, canvas.width/12*4, canvas.width/12*5, canvas.width/12*8);

	// draw hold piece, if there is one
	if (game.hold !== 0) {
		game.hold.draw(canvas.width/12*7+canvas.width/16, canvas.width/16, true);
	}

	if (game.firstTimeBeforeStart) {
		ctx.fillStyle = "#0007";
		ctx.fillRect(0, 0, board.width, board.height); // light shade over everything
		ctx.font = board.width/6 + "px Arial";
		ctx.fillStyle = "white";
		ctx.textAlign = "center";
		ctx.fillText("T E T R I S", board.width/2, board.height/2);
		ctx.font = board.width/10 + "px Arial";
		ctx.fillText("– Press SPACE –", board.width/2, board.height/2+board.width/8);
	} else {
		if (!game.paused) frame++;
		if (!game.gameOver) {
			// update piece
			if (frame % game.speed == 0) {
				board.fall();
				frame = 1;
			}
		}
		// draw everything
		board.drawBlocks();
		board.fallingPiece.getGhost(board).draw();
		board.fallingPiece.draw(board.fallingX, board.fallingY, false);

		// draw queue
		for (var i = 0; i < game.queue.length; i++) {
			game.queue[i].draw(canvas.width/12*7+canvas.width/8, canvas.width/12*5 + canvas.width/6*i, true);
		}

		if (game.gameOver) {
			ctx.fillStyle = "#0007";
			ctx.fillRect(0, 0, board.width, board.height); // light shade over everything
			ctx.font = board.width/4 + "px Arial";
			ctx.fillStyle = "white";
			ctx.textAlign = "center";
			ctx.fillText("GAME", board.width/2, board.height/2);
			ctx.fillText("OVER", board.width/2, board.height/2+board.width/4);
		} else if (game.paused) {
			ctx.fillStyle = "#0007";
			ctx.fillRect(0, 0, board.width, board.height); // light shade over everything
			ctx.fillStyle = "white";
			ctx.fillRect(board.width/9*2  , board.height/3, board.width/6, board.height/3);
			ctx.fillRect(board.width/9*5.5, board.height/3, board.width/6, board.height/3);
		}
	}
}

function playSound(id) {
	document.getElementById(id).play();
}
function pauseSound(id) {
	document.getElementById(id).pause();
}
function stopSound(id) {
	document.getElementById(id).pause();
	document.getElementById(id).currentTime = 0;
}
function setVolume(id, vol) {
	document.getElementById(id).volume = vol;
}

// BEGIN THE GAME //
setInterval(updateGame, 5);
setVolume("theme", 0.1);
resizeCanvas();
