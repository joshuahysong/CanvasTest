let fieldCanvas;
let fieldCanvasCTX;
let pawnCanvas;
let pawnCanvasCTX;
let statCanvas;
let statCanvasCTX;
let goalCanvas;
let goalCanvasCTX;
let pawn;
let goal;
let tiles = [];
let manualControl = false;
let isLooping = false;

const tileSize = 10; // pixels per tile
const borderColor = "rgba(230, 230, 230, 1)";
const tileTypes = {
    EMPTY: 0,
    PAWN: 1,
    FOOD: 2,
    WALL: 3
};
const tileData = [
    {color: "rgba(238, 238, 238, 1)"}, // EMPTY
    {color: "rgba(255, 0, 0, 1)"}, // PAWN
    {color: "rgba(0, 0, 255, 1)"}, // FOOD
    {color: "rgba(0, 0, 0, 1)"}, // WALL
]

function setupCanvasTest() {

    fieldCanvas = document.getElementById("fieldCanvas");
    fieldCanvasCTX = fieldCanvas.getContext("2d");

    generateTerrain();

    // Create pawn
    pawn = new Pawn(null, null);

    spawnFood();
}

function generateTerrain() {

    let terrainImageData = fieldCanvasCTX.createImageData(
        fieldCanvas.width, fieldCanvas.height);
    let d  = terrainImageData.data;
    let openColor = {r: 238, g: 238, b: 238, a: 255};
    let closedColor = {r: 0, g: 0, b: 0, a: 255};
    let canvasTilesX = Math.round(fieldCanvas.width / tileSize)
    let canvasTilesY = Math.round(fieldCanvas.height / tileSize)

    let i = 0;
    // For now the world is blank so just populate the tiles object by amount
    for (let x = 0; x < canvasTilesX; x++) {
        tiles[x] = []

        for (var y = 0; y < canvasTilesY; y++) {

            let type = tileTypes.EMPTY;
            let walkable = true;

            // walled border
            if (x <= 20 || x == canvasTilesX - 1 ||
              y == 0 || y == canvasTilesY - 1) {
                type = tileTypes.WALL;
                walkable = false;
            }

            tiles[x][y] = {
                type: type,
                walkable: walkable
            };

            drawTile(x, y);
        }
    }
}

function Pawn(x, y) {
    this.x = x;
    this.y = y;
    this.moveSpeed = 1;
    this.actionSpeed = 200;
    this.food = 200;
    this.maxFood = 200;
    this.viewDistance = 25 * tileSize;
    this.direction = .75;
    this.waitTicks = 0;
    this.huntTime = 0;
    this.viewArc;

    // Get random coordinates


    const that = this; // javascript bug for accessing 'this' in private funcs.
    let isHunting = false;

    getSpawnPoint();
    tiles[this.x][this.y].type = tileTypes.PAWN
    drawTile(this.x, this.y);

    // N = 1.5, E = 0, S = .5, W = 1
    this.setDirection = function(direction)
    {
        this.direction = direction;
    }

    function getSpawnPoint() {
        if (!that.x || !that.y) {
            let randCoords = getRandomCoords();
            if (!isPointWalkable(randCoords.x, randCoords.x)) {

                console.log("hey")
                return getSpawnPoint();
            }
            //console.log(tiles[randCoords.x][randCoords.y])
            console.log(tiles)
            that.x = randCoords.x;
            that.y = randCoords.y;
            console.log(that.x, that.y)
        }
    }
}

function drawTile(x, y) {

    fieldCanvasCTX.fillStyle = tileData[tiles[x][y].type].color;
    fieldCanvasCTX.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    fieldCanvasCTX.strokeStyle = borderColor;
    fieldCanvasCTX.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
}

function updatePawns() {

    if (manualControl) {
        pawn.move();
    } else {
        pawn.think();
    }
}

function doLoop() {
    updatePawns()
}

function spawnFood() {

    let randCoords = getRandomCoords(true);

    if (randCoords.x == pawn.x ||
        randCoords.y == pawn.y) {
        // Don't spawn the goal on our pawn. Try Again
        spawnFood();
    } else {

        tiles[randCoords.x][randCoords.y].type = tileTypes.FOOD;
        drawTile(randCoords.x, randCoords.y);
    }
}

function isPointWalkable(x,y) {
    if (tiles[x][y]) {
        return tiles[x][y].walkable
    }

    return false;
}

function getRandomCoords() {

    var randXY = {x:0, y:0}

    randXY.x = Math.floor(Math.random() *
        Math.round(fieldCanvas.width / tileSize));
    randXY.y = Math.floor(Math.random() *
        Math.round(fieldCanvas.height / tileSize));

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
