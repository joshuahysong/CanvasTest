let fieldCanvas;
let fieldCanvasCTX;
let statCanvas;
let statCanvasCTX;
let canvasTilesX;
let canvasTilesY;
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
    statCanvas = document.getElementById("statCanvas");
    statCanvasCTX = statCanvas.getContext("2d");

    generateTerrain();

    // Create pawn
    pawn = new Pawn(null, null);

    spawnFood();
    drawScene();
}

function generateTerrain() {

    canvasTilesX = Math.round(fieldCanvas.width / tileSize)
    canvasTilesY = Math.round(fieldCanvas.height / tileSize)

    // For now the world is blank so just populate the tiles object by amount
    for (let x = 0; x < canvasTilesX; x++) {
        tiles[x] = []

        for (var y = 0; y < canvasTilesY; y++) {

            let type = tileTypes.EMPTY;
            let walkable = true;

            // walled border
            if (x == 0 || x == canvasTilesX - 1 ||
              y == 0 || y == canvasTilesY - 1) {
                type = tileTypes.WALL;
                walkable = false;
            }

            tiles[x][y] = {
                type: type,
                walkable: walkable
            };
        }
    }
}

function Pawn(x, y) {
    this.x = x;
    this.y = y;
    this.moveSpeed = 10; // ticks per 1 tile.
    this.moveTicks = 0;
    this.food = 10; // in seconds
    this.maxFood = 10; // in seconds
    this.viewDistance = 20 * tileSize;
    this.direction = .5; // N = 1.5, E = 0, S = .5, W = 1
    this.huntPath = []

    const that = this; // javascript bug for accessing 'this' in private funcs.
    let isHunting = false;

    getSpawnPoint();
    tiles[this.x][this.y].type = tileTypes.PAWN;

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

        // this.waitTicks++;

        // if (this.waitTicks >= this.actionSpeed) {
        //
        //     this.waitTicks = 0;
        //     this.food--; // Reduce hunger by 1 each action.
        //     if (this.food < 0) this.food = 0;
        //     let foodX = Math.round((
        //         (this.food / this.maxFood) *
        //         statCanvas.width));
        //
        //     statCanvasCTX.clearRect(0, 0,
        //         statCanvas.width, statCanvas.height);
        //     statCanvasCTX.beginPath();
        //     statCanvasCTX.rect(0, 0, foodX, 5);
        //     statCanvasCTX.fillStyle = "rgba(0, 255, 0, 1)";
        //     statCanvasCTX.fill();
        //     statCanvasCTX.closePath();
        // }
    }

    this.move = function()
    {
        // calculate the next tile along the angle
        var theta = this.direction * Math.PI;

        // MATHMAGICAL!
        dx = Math.cos(theta) * tileSize;
        dy = Math.sin(theta) * tileSize;

        if (collisionDetection()) {
            console.log('collided')
            this.direction = getRandomDirection();

        } else {

            this.x += (dx * this.moveSpeed);
            this.y += (dy * this.moveSpeed);
        }

        draw();
    }

    function hunt() {

        // get new hunting path if needed
        if (that.huntPath.length == 0) {

        }

        // move along this path


        isHunting = true;

        that.moveTicks++;

        if (isGoalSeen()) {

            // We see the goal!
            // Head straight towards it using the power of MATH
            var tx = goal.x - that.x,
                ty = goal.y - that.y,
                dist = Math.sqrt(tx*tx+ty*ty),
                rad = Math.atan2(ty,tx);

            // if we are mathematically within 1 of the goal then
            // jump to it, otherwise it's often missed.
            if (dist < 1) {
                dx = 0;
                dy = 0;

                that.x = goal.x;
                that.y = goal.y;
                eat();
            }

            // change pawns view to match his movement direction
            that.direction = rad/Math.PI;

        } else {



            that.huntTime++;
            // Get a random direction to search every X Ticks
            if (that.huntTime >= 50) {
                that.huntTime = 0;
                that.direction = getRandomDirection();
            }
        }

        that.move();
    }

    function getHuntingPath() {


    }

    function eat() {
        that.food = that.maxFood;
        spawnGoal();
    }
}

function drawTile(x, y) {

    fieldCanvasCTX.fillStyle = tileData[tiles[x][y].type].color;
    fieldCanvasCTX.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
    fieldCanvasCTX.strokeStyle = borderColor;
    fieldCanvasCTX.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
}

function drawScene() {
    fieldCanvasCTX.clearRect(0,0,500,500)
    for (let x = 0; x < canvasTilesX; x++) {
        for (var y = 0; y < canvasTilesY; y++) {
            drawTile(x,y);
        }
    }
}

function updatePawns() {

    if (manualControl) {
        pawn.move();
    } else {
        pawn.think();
    }
}

function doLoop() {
    drawScene();
}

function spawnFood() {

    let randCoords = getRandomCoords(true);

    if (randCoords.x == pawn.x ||
        randCoords.y == pawn.y) {
        // Don't spawn the goal on our pawn. Try Again
        spawnFood();
    } else {

        tiles[randCoords.x][randCoords.y].type = tileTypes.FOOD;
    }
}

function isPointWalkable(x,y) {
    if (tiles[x][y]) {
        return tiles[x][y].walkable
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
