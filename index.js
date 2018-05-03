
function *range(begin, end) {
    for (let i = begin; i < end; i++) {
        yield i;
    }
}

function getCssVariable(name) {
    return window.getComputedStyle(document.body).getPropertyValue(name);
}

function getCssVariableAsNumber(name) {
    return parseInt(getCssVariable(name), 10);
}

function shuffle(array) {
    for (let i = 0; i < array.length - 1; i++) {
        let otherIndex = i + Math.floor(Math.random() * (array.length - 1 - i));
        let position = array[i];
        array[i] = array[otherIndex];
        array[otherIndex] = position;
    }
}

class Domino {

    /**
     * @param {Dominoes} app
     * @param {Number} x
     * @param {Number} y
     * @param {String} rotationClass
     */
    constructor (app, x, y, rotationClass) {
        this.element = document.createElement("div");
        this.element.classList.add("domino", rotationClass);
        const canvasX = x * app.tileSize + app.tilePadding;
        const canvasY = y * app.tileSize + app.tilePadding;
        this.element.style.top = `${canvasY}px`;
        this.element.style.left = `${canvasX}px`;

        app.container.appendChild(this.element);
    }
}

class Dominoes {

    constructor () {
        this.container = document.getElementById("board");
        this.canvas = /** @type{HTMLCanvasElement} */ document.getElementById("board-background");
        this.canvas.setAttribute("width", getComputedStyle(this.canvas).getPropertyValue("width"));
        this.canvas.setAttribute("height", getComputedStyle(this.canvas).getPropertyValue("height"));
        this.context = this.canvas.getContext("2d");

        this.tileSize = getCssVariableAsNumber("--tile-size");
        this.tilePadding = getCssVariableAsNumber("--tile-padding");
        this.boardWidth = getCssVariableAsNumber("--board-width");
        this.boardHeight = getCssVariableAsNumber("--board-height");

        const shuffledPositions = Array.from(Array(this.boardWidth * this.boardHeight), (e, i) => {
            const y = Math.trunc(i / this.boardWidth);
            const x = i % this.boardWidth;
            return [x, y];
        });
        shuffle(shuffledPositions);

        this.board = Array.from(Array(this.boardWidth), () => Array(this.boardHeight));
        for (const [x, y] of shuffledPositions) {
            if (this.board[x][y]) {
                continue;  // there's a domino there
            }

            let availableNeighborTiles = [];
            if ((x + 1) < this.boardWidth && !this.board[x + 1][y]) {
                availableNeighborTiles.push([1, 0, "east"]);
            }
            if ((y + 1) < this.boardHeight && !this.board[x][y + 1]) {
                availableNeighborTiles.push([0, 1, "south"]);
            }
            if (x > 0 && !this.board[x - 1][y]) {
                availableNeighborTiles.push([-1, 0, "west"]);
            }
            if (y > 0 && !this.board[x][y - 1]) {
                availableNeighborTiles.push([0, -1, "north"]);
            }

            if (availableNeighborTiles.length === 0) {
                continue;
            }

            const index = Math.trunc(Math.random() * availableNeighborTiles.length);
            const otherTile = availableNeighborTiles[index];
            const dx = otherTile[0];
            const dy = otherTile[1];
            const rotationClass = otherTile[2];
            const domino = new Domino(this, x, y, rotationClass);
            this.board[x][y] = domino;
            this.board[x + dx][y + dy] = domino;
        }

        this.drawGrid();
    }

    drawGrid() {
        this.context.beginPath();
        this.context.strokeStyle = "#acacac";
        for (const y of range(0, this.boardHeight)) {
            for (const x of range(0, this.boardWidth)) {
                this.context.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
            }
        }
        this.context.closePath();
    }
}

window.addEventListener("load", () => new Dominoes());
