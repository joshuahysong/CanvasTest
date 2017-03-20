function calculateFOV(startX, startY, viewDistance) {

  // start position is always visible
  world[startX][startY].visible = true;

  for (let x = 0; x < canvasTilesX; x++) {
    for (var y = 0; y < canvasTilesY; y++) {
      world[x][y].visible = false;
    }
  }

  for (let i = 0; i < 8; i++) {
    let line = new ShadowLine();
    let fullShadow = false;
    for (let row = 1; row < viewDistance; row++) {

      for (let col = 0; col <= row; col++) {

        var coords = getOctant(row, col, i);

        var x = startX + coords[0];
        var y = startY + coords[1];

        if (x > 0 && y > 0 &&
          x < canvasTilesX &&
          y < canvasTilesY) {

          if (fullShadow) {

          } else {
            let projection = projectTile(row, col);

            // set the visibility of the tile.
            let visible = !line.isInShadow(projection);
            world[x][y].visible = visible;

            if (visible && world[x][y].type == tileTypes.WALL) {
              line.add(projection);
              fullShadow = line.isFullShadow();
            }

            //drawTile(x,y);
          }
        }
      }
    }
  }
}


function getOctant(row, col, octant) {
  switch (octant) {
    case 0: return new Array( col, -row);
    case 1: return new Array( row, -col);
    case 2: return new Array( row,  col);
    case 3: return new Array( col,  row);
    case 4: return new Array(-col,  row);
    case 5: return new Array(-row,  col);
    case 6: return new Array(-row, -col);
    case 7: return new Array(-col, -row);
  }
}

function projectTile(row, col) {

  // The top edge of row 0 is 2 wide.
  let topLeft = col / (row + 2)

  // The bottom edge of row 0 is 1 wide
  let bottomRight = (col + 1) / (row + 1);

  return new Shadow(topLeft, bottomRight, col, row + 2, col + 1, row + 1);
}

function ShadowLine() {
  this.shadows = [];

  this.isInShadow = function(projection) {

    for (let i = 0; i < this.shadows.length; i++) {
      if (this.shadows[i].contains(projection)) {
        return true;
      }
    }
    return false;
  }

  this.add = function(shadow) {

    // Figure out where to put the new shadow
    let index = 0;
    for (; index < this.shadows.length; index++) {
      // Stop when we get to the spot to insert.
      if (this.shadows[index].start >= shadow.start) break;
    }

    // The new shadow is going here. See if it overlaps the prev or next.
    let overlappingPrevious;
    if (index > 0 && this.shadows[index - 1].end > shadow.start) {
      overlappingPrevious = this.shadows[index - 1];
    }

    var overlappingNext;
    if (index < this.shadows.length && this.shadows[index].start < shadow.end) {
      overlappingNext = this.shadows[index];
    }

    // insert and unify with overlapping shadows
    if (overlappingNext) {
      if (overlappingPrevious) {
        // Overlaps both, so unify one and delete the other
        overlappingPrevious.end = overlappingNext.end;
        overlappingPrevious.endPosX = overlappingNext.endPosX;
        overlappingPrevious.endPosY = overlappingNext.endPosY;
        this.shadows.splice(index, 1);
      } else {
        // Only overlaps the next shadow, so unify with that
        overlappingNext.start = shadow.start;
        overlappingNext.startPosX = shadow.startPosX;
        overlappingNext.startPosY = shadow.startPosY;
      }
    } else {
      if (overlappingPrevious) {
        // Only overlaps the previous shadow, so unify with that
        overlappingPrevious.end = shadow.end;
        overlappingPrevious.endPosX = shadow.endPosX;
        overlappingPrevious.endPosY = shadow.endPosY;
      } else {
        // Does not overlap anything, so insert.
        this.shadows.splice(index, 0, shadow);
      }
    }
  }

  this.isFullShadow = function() {
    return (this.shadows.length == 1 &&
      this.shadows[0].start == 0 &&
      this.shadows[0].end == 1);
  }
}

function Shadow(start, end, startPosX, startPosY, endPosX, endPosY) {
  this.start = start;
  this.end = end;
  this.startPosX = startPosX;
  this.startPosY = startPosY;
  this.endPosX = endPosX;
  this.endPosY = endPosY;

  this.contains = function(otherShadow) {
    return this.start <= otherShadow.start && this.end >= otherShadow.end;
  }
}
