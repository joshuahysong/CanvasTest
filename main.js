let fieldCanvas;
let fieldCanvasCTX;
let statCanvas;
let statCanvasCTX;
let canvasTilesX;
let canvasTilesY;
let pawn;
let food;
let world = []; // Array of tiles in the world
let manualControl = false;
let isLooping = false;

const drawBorders = true;
const tileSize = 10; // pixels per tile
const borderColor = "rgba(230, 230, 230, 1)";
const tileTypes = {
    EMPTY: 0,
    PAWN: 1,
    FOOD: 2,
    WALL: 3,
    VISION: 4
};
// const tileData = [
//     {visibleColor: "rgba(238, 238, 238, 1)",
//       hiddenColor: "rgba(200, 200, 200, 1)"}, // EMPTY
//     {visibleColor: "rgba(255, 0, 0, 1)",
//       hiddenColor: "rgba(255, 0, 0, 1)"}, // PAWN
//     {visibleColor: "rgba(0, 200, 0, 1)",
//       hiddenColor: "rgba(0, 200, 0, 1)"}, // FOOD
//     {visibleColor: "rgba(0, 0, 0, 1)",
//       hiddenColor: "rgba(0, 0, 0, 1)"}, // WALL
// ]
const tileData = [
    {visibleColor: {r: 238, g: 238, b: 238, a: 255},
      hiddenColor: {r: 200, g: 200, b: 200, a: 255}}, // EMPTY
    {visibleColor: {r: 255, g: 0, b: 0, a: 255},
      hiddenColor: {r: 255, g: 0, b: 0, a: 255}}, // PAWN
    {visibleColor: {r: 0, g: 200, b: 0, a: 255},
      hiddenColor: {r: 0, g: 200, b: 0, a: 255}}, // FOOD
    {visibleColor: {r: 0, g: 0, b: 0, a: 255},
      hiddenColor: {r: 0, g: 0, b: 0, a: 255}}, // WALL
]

function setupCanvasTest() {

    fieldCanvas = document.getElementById("fieldCanvas");
    fieldCanvasCTX = fieldCanvas.getContext("2d");
    statCanvas = document.getElementById("statCanvas");
    statCanvasCTX = statCanvas.getContext("2d");

    generateTerrain();

    // Create pawn
    pawn = new Pawn(null, null);
    calculateFOV(pawn.x, pawn.y);
    //spawnFood();
    drawScene();
}

function generateTerrain() {

    canvasTilesX = Math.round(fieldCanvas.width / tileSize)
    canvasTilesY = Math.round(fieldCanvas.height / tileSize)

    for (let x = 0; x < canvasTilesX; x++) {
        world[x] = []

        for (var y = 0; y < canvasTilesY; y++) {

            let type = tileTypes.EMPTY;
            let walkable = true;

            // random wall spots
            if (Math.random() > 0.80) {
                type = tileTypes.WALL;
                walkable = false;
            }

            // walled border
            if (x == 0 || x == canvasTilesX - 1 ||
              y == 0 || y == canvasTilesY - 1) {
                type = tileTypes.WALL;
                walkable = false;
                visible = false;
            }

            world[x][y] = {
                type: type,
                walkable: walkable
            };

            //drawTile(x, y);
        }
    }
}

function Pawn(x, y) {
    this.x = x;
    this.y = y;
    this.moveSpeed = 20; // ticks per 1 tile.
    this.moveTicks = 0;
    this.food = 10; // in seconds
    this.maxFood = 10; // in seconds
    this.viewDistance = 10;
    this.direction = .5; // N = 1.5, E = 0, S = .5, W = 1
    this.huntPath = []

    const that = this; // javascript bug for accessing 'this' in private funcs.
    let isHunting = false;

    getSpawnPoint();
    world[this.x][this.y].type = tileTypes.PAWN;
    //drawTile(this.x, this.y);

    // N = 1.5, E = 0, S = .5, W = 1
    this.setDirection = function(direction)
    {
        this.direction = direction;
    }

    function getSpawnPoint() {
        if (!that.x || !that.y) {
            let randCoords = getRandomCoords(true);
            that.x = randCoords.x;
            that.y = randCoords.y;
        }
    }

    this.think = function() {

        // Eventually some super awesome magic stuff
        // here to make the pawn seem not unlike an idiot.
        hunt();
    }

    function hunt() {

        if (that.huntPath.length == 0) {
            spawnFood();
            that.huntPath = findPath(world, pawn.x, pawn.y, food.x, food.y)
        }

        that.moveTicks++;
        if (that.moveTicks >= that.moveSpeed) {
            that.moveTicks = 0;

            // Replace previous tile with empty and redraw
            world[that.x][that.y].type = tileTypes.EMPTY;
            //drawTile(that.x, that.y);

            // grab new coordinates from huntPath, set pawn and redraw.
            let newCoords = that.huntPath.splice(0,1);
            that.x = newCoords[0][0];
            that.y = newCoords[0][1];
            world[that.x][that.y].type = tileTypes.PAWN;
            //drawTile(that.x, that.y);

            calculateFOV(that.x, that.y, that.viewDistance);
            drawScene();
        }
    }
}

function drawTile(x, y) {
  // let color;
  // if (world[x][y].visible) {
  //   color = tileData[world[x][y].type].visibleColor
  // } else {
  //   color = tileData[world[x][y].type].hiddenColor
  // }
  //
  // fieldCanvasCTX.fillStyle = color;
  // fieldCanvasCTX.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
  fieldCanvasCTX.strokeStyle = borderColor;
  fieldCanvasCTX.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
}

function drawScene2() {
    //fieldCanvasCTX.clearRect(0,0,500,500)
    for (let x = 0; x < canvasTilesX; x++) {
        for (var y = 0; y < canvasTilesY; y++) {
            drawTile(x,y);
        }
    }
}

function drawScene() {

  //fieldCanvasCTX.clearRect(0, 0, fieldCanvas.width, fieldCanvas.height)
  var imgData = fieldCanvasCTX.createImageData(
    fieldCanvas.width, fieldCanvas.height);

  let x = -1;
  let y = 0;
  let index = 0;
  let xRow = 0
  for (var i = 0; i < imgData.data.length; i += 4)
  {
    // Find which tile this pixel falls in
    if (index % tileSize === 0) {
      x++;
      if (x >= canvasTilesX) {
         x = 0;
         xRow++;
      }
      if (xRow > tileSize) {
        xRow = 0;
        y++;
      }
    }

    if (drawBorders &&
      (index % tileSize === 0 || index % tileSize === 9)) {

      imgData.data[i + 0] = 230;
      imgData.data[i + 1] = 230;
      imgData.data[i + 2] = 230;
      imgData.data[i + 3] = 255;

    } else if (index % fieldCanvas.height === 0) {

      console.log("hey")

      imgData.data[i + 0] = 0;
      imgData.data[i + 1] = 255;
      imgData.data[i + 2] = 0;
      imgData.data[i + 3] = 255;

    } else {

      let color;
      if (world[x][y].visible) {
        color = tileData[world[x][y].type].visibleColor
      } else {
        color = tileData[world[x][y].type].hiddenColor
      }

      imgData.data[i + 0] = color.r;
      imgData.data[i + 1] = color.g;
      imgData.data[i + 2] = color.b;
      imgData.data[i + 3] = color.a;
    }

      index++;
  }

  fieldCanvasCTX.putImageData(imgData, 0, 0);
}

function updatePawns() {

    if (manualControl) {
        pawn.move();
    } else {
        pawn.think();
    }
}

function doLoop() {
    pawn.think();
}

function spawnFood() {

    let randCoords = getRandomCoords(true);

    if (randCoords.x == pawn.x ||
        randCoords.y == pawn.y) {
        // Don't spawn the food on our pawn. Try Again
        spawnFood();
    } else {

        world[randCoords.x][randCoords.y].type = tileTypes.FOOD;
        food = {x: randCoords.x, y: randCoords.y};

        // draw food at these coords
        //drawTile(randCoords.x, randCoords.y);
    }
}

function isPointWalkable(x,y) {
    if (world[x][y]) {
        return world[x][y].walkable
    }

    return false;
}

function getRandomCoords(walkable) {

    var randXY = {x:0, y:0}

    randXY.x = Math.floor(Math.random() *
        Math.round(fieldCanvas.width / tileSize));
    randXY.y = Math.floor(Math.random() *
        Math.round(fieldCanvas.height / tileSize));

    if (walkable) {
        if (!isPointWalkable(randXY.x, randXY.y))
            return getRandomCoords(true);
    }

    return randXY;
}

function toggleState(button) {
    if (isLooping) {
        button.innerText = "GO";
        clearTimeout(testLoop);
        isLooping = false;
    } else {
        button.innerText = "STOP";
        testLoop = setInterval(doLoop, 1);
        isLooping = true;
    }
}
