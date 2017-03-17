let fieldCanvas;
let fieldCanvasCTX;
let pawnCanvas;
let pawnCanvasCTX;
let statCanvas;
let statCanvasCTX;
let pawn = {};
let goal = {};
let isLooping = false;
let isHunting = false;
let isGoalSeen = false;
let tiles = [];
let manualControl = false;
const tileSize = 1; // pixels per tile
let pawn2;
function setupCanvasTest() {

    fieldCanvas = document.getElementById("fieldCanvas");
    fieldCanvasCTX = fieldCanvas.getContext("2d");
    pawnCanvas = document.getElementById("pawnCanvas");
    pawnCanvasCTX = pawnCanvas.getContext("2d");
    statCanvas = document.getElementById("statCanvas");
    statCanvasCTX = statCanvas.getContext("2d");

    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);

    // Create pixel (This is reportedly significantly faster than fillRect)
    let id = pawnCanvasCTX.createImageData(1,1);
    let d  = id.data;
    for (var i = 0; i < id.data.length; i += 4) {
        d[i+0]   = 255;
        d[i+1]   = 0;
        d[i+2]   = 0;
        d[i+3]   = 255;
    }

    let randCoords = getRandomCoords();

    pawn = {
        image: id,
        x: randCoords.x,
        y: randCoords.y,
        redraw: false, // Boolean if pawn needs to be redrawn
        moveSpeed: .10, // Ticks to cover 1 tile
        moveCount: 0, // Ticks since last move
        moveDirection: {x: 0, y:0}, // Direction of pawn movment in coords
        actionSpeed: 10, // Ticks per action
        hunger: 100, // Actions till hungry
        viewDistance: 50, // Tile view distance
        viewDirection: .5, // N = 1.5, E = 0, S = .5, W = 1
        searchTime: 0, // How many actions searching
        maxSearchTime: 200 // Maximum search actions
    }

    pawn2 = new Pawn(id, randCoords.x, randCoords.y);

    // For now the world is blank so just populate the tiles object by amount
    for (var c = 0; c < fieldCanvas.height; c++) {
        tiles[c] = []
        for (var r = 0; r < fieldCanvas.width; r++) {
            tiles[c][r] = {x: c, y: r, type: 0} // 0 means open
        }
    }

    pawnCanvasCTX.putImageData(id, pawn.x, pawn.y);

    spawnGoal();
}

function Pawn(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.moveSpeed = 10;
    this.actionSpeed = 10;
    this.hunger = 100;
    this.viewDistance = 50;
    this.direction = .75;
    const moveWaitTicks = 0;
}
{
    const draw = function(showView) {

        // clear layer
        pawnCanvasCTX.clearRect(0, 0, pawnCanvas.width, pawnCanvas.height);
        pawnCanvasCTX.putImageData(pawn.image, pawn.x, pawn.y);

        if (showView) {

            // draw view angle
            pawnCanvasCTX.beginPath();
            pawnCanvasCTX.moveTo(pawn.x, pawn.y);
            pawnCanvasCTX.arc(pawn.x, pawn.y, pawn.viewDistance,
                Math.PI * (pawn.viewDirection - .25),
                Math.PI *(pawn.viewDirection + .25))
            pawnCanvasCTX.lineTo(pawn.x, pawn.y);
            pawnCanvasCTX.fillStyle = "rgba(255, 255, 0, .5)";
            pawnCanvasCTX.fill();

            pawnCanvasCTX.closePath();
        }
    }
    // N = 1.5, E = 0, S = .5, W = 1
    Pawn.prototype.setDirection = function(direction)
    {
        this.direction = direction;
    }

    Pawn.prototype.move = function(target)
    {
        this.moveWaitTicks++;

        if (this.moveWaitTicks >= this.moveSpeed) {
            if (target) {

                // We have a target
                // Head straight towards it using the power of MATH
                var tx = target.x - pawn.x,
                    ty = target.y - pawn.y,
                    dist = Math.sqrt(tx*tx+ty*ty),
                    rad = Math.atan2(ty,tx),
                    angle = rad/Math.PI * 180;;

                dx = (tx/dist) * tileSize;
                dy = (ty/dist) * tileSize;

                // if we are mathematically within 1 of the goal then
                // jump to it, otherwise it's often missed.
                if (dist < 1) {
                    dx = 0;
                    dy = 0;

                    pawn.x = goal.x;
                    pawn.y = goal.y;
                }

                // change pawns view to match his movement direction
                this.direction = rad/Math.PI;

            } else {

                // calculate the next tile along the angle
                var theta = this.direction * Math.PI;

                dx = Math.cos(theta) * tileSize;
                dy = Math.sin(theta) * tileSize;
            }

            pawn.x += (dx * this.moveSpeed);
            pawn.y += (dy * this.moveSpeed);

            this.draw();
        }
    }
}

function drawPawn() {

    //if (pawn.redraw) {

        // clear layer
        pawnCanvasCTX.clearRect(0, 0, pawnCanvas.width, pawnCanvas.height);
        pawnCanvasCTX.putImageData(pawn.image, pawn.x, pawn.y);

        if (isHunting) {

            // draw view angle
            pawnCanvasCTX.beginPath();
            pawnCanvasCTX.moveTo(pawn.x, pawn.y);
            pawnCanvasCTX.arc(pawn.x, pawn.y, pawn.viewDistance,
                Math.PI * (pawn.viewDirection - .25),
                Math.PI *(pawn.viewDirection + .25))
            pawnCanvasCTX.lineTo(pawn.x, pawn.y);
            pawnCanvasCTX.fillStyle = "rgba(255, 255, 0, .5)";
            pawnCanvasCTX.fill();

            // Check if goal point is within this path
            isGoalSeen = pawnCanvasCTX.isPointInPath(goal.x, goal.y);

            pawnCanvasCTX.closePath();
        }
    //}
}

function movePawn() {

    if (manualControl) {



    } else {
        //hunt();
        pawn2.move();
    }
}

function doLoop() {

    if (pawn.x == goal.x && pawn.y == goal.y) {
        pawn.hunger = 100;
        spawnGoal();
        isGoalSeen = false;
    }

    adjustBars();
    movePawn()
    drawPawn();
}


function spawnGoal() {

    let randCoords = getRandomCoords();

    if (randCoords.x == pawn.x || randCoords.y == pawn.y) {
        // Don't spawn the goal on our pawn. Try Again
        spawnGoal();
    } else {

        // clear previous goal if any
        fieldCanvasCTX.clearRect(0, 0, fieldCanvas.width, fieldCanvas.height);

        // Create goal
        id = fieldCanvasCTX.createImageData(1,1);
        d  = id.data;
        for (var i = 0; i < id.data.length; i += 4) {
            d[i+0]   = 0;
            d[i+1]   = 0;
            d[i+2]   = 255;
            d[i+3]   = 255;
        }

        goal = {image: id, x: randCoords.x, y: randCoords.y, moveSpeed: 0};
        fieldCanvasCTX.putImageData(id, goal.x, goal.y);
    }
}

function getRandomCoords() {
    var randXY = {x:0, y:0}

    randXY.x = Math.floor((Math.random() * fieldCanvas.width) + 1);
    randXY.y = Math.floor((Math.random() * fieldCanvas.height) + 1);

    return randXY;
}

function hunt() {

    if (pawn.hunger == 0) {

        isHunting = true;

        if (pawn.searchTime >= pawn.maxSearchTime && !isGoalSeen) {
            pawn.searchTime = 0
            // Get random direction
            //pawn.viewDirection = Math.floor((Math.random() * 4)) / 2;
            pawn.viewDirection = Math.random() * 4;

        } else {

            pawn.searchTime += 1
            let dx = 0;
            let dy = 0;

            if (isGoalSeen) {

                // We see the goal!
                // Head straight towards it using the power of MATH
                var tx = goal.x - pawn.x,
                    ty = goal.y - pawn.y,
                    dist = Math.sqrt(tx*tx+ty*ty),
                    rad = Math.atan2(ty,tx),
                    angle = rad/Math.PI * 180;;

                dx = (tx/dist) * tileSize;
                dy = (ty/dist) * tileSize;

                // if we are mathematically within 1 of the goal then
                // jump to it, otherwise it's often missed.
                if (dist < 1) {
                    dx = 0;
                    dy = 0;

                    pawn.x = goal.x;
                    pawn.y = goal.y;
                }

                // change pawns view to match his movement direction
                pawn.viewDirection = rad/Math.PI;

            } else {

                // calculate the next tile along the angle
                var theta = pawn.viewDirection * Math.PI;

                dx = Math.cos(theta) * tileSize;
                dy = Math.sin(theta) * tileSize;
            }

            pawn.x += (dx * pawn.moveSpeed);
            pawn.y += (dy * pawn.moveSpeed);


            // Wall collisions
            if (pawn.x >= fieldCanvas.width - 1) pawn.x = fieldCanvas.width - 1;
            if (pawn.x <= 0) pawn.x = 0;
            if (pawn.y >= fieldCanvas.height - 1) pawn.y = fieldCanvas.height - 1;
            if (pawn.y <= 0) pawn.y = 0;

            // if (pawn.x >= fieldCanvas.width || pawn.x <= 0) {
            //     if (pawn.viewDirection == 0) {
            //         pawn.viewDirection = 1
            //     } else if(pawn.viewDirection == 1) {
            //         pawn.viewDirection = 0
            //     };
            // }
            // if (pawn.y >= fieldCanvas.height || pawn.y <= 0) {
            //     if (pawn.viewDirection == 0.5) {
            //         pawn.viewDirection = 1.5
            //     } else if(pawn.viewDirection == 1.5) {
            //         pawn.viewDirection = 0.5
            //     };
            // }
        }
    } else {

        isHunting = false;
    }
}

function adjustBars() {

    // Hunger bar
    if (pawn.hunger > 0) pawn.hunger -= 1;
    let hungerX = Math.round((pawn.hunger / statCanvas.width) * 100);

    statCanvasCTX.clearRect(0, 0, 100, 5);
    statCanvasCTX.beginPath();
    statCanvasCTX.rect(0, 0, hungerX, 5);
    statCanvasCTX.fillStyle = "rgba(0, 255, 0, 1)";
    statCanvasCTX.fill();
    statCanvasCTX.closePath();
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

function keyDownHandler(e) {
    if (e.keyCode >= 37 && e.keyCode <= 40) {
        //switch(e.keyCode)
    }
}

function keyUpHandler(e) {
    if (e.keyCode == 39) {
        rightPressed = false;
    } else if (e.keyCode == 37) {
        leftPressed = false;
    }
}
