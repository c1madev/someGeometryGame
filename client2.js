let tileSideLength = 50                                     // All of the tiles should have the same side length
let canvas = document.getElementById("someGeometryGame")
document.body.style.background = "rgb(101, 104, 121)";

window.addEventListener("resize", function(){
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}, false);

document.oncontextmenu = () => {
    return false;
}

class LocalEventEmitter {
    constructor() {
        this._events = {};
    }

    on(evt, listener) {
        (this._events[evt] || (this._events[evt] = [])).push(listener);
        return this;
    }

    emit(evt, arg) {
        (this._events[evt] || []).slice().forEach(lsn => lsn(arg));
    }
}


// model
class TileEdge {
    constructor(hasConnect, rotationLeft) {
        this._orientation = 0
        this.rotate(rotationLeft)
        this._hasConnect = hasConnect
        this.canAccess = true
        this.isConnected = false
        this.parentTile = null
    }

    getOrientation() {
        return this._orientation
    }

    hasConnect() {
        return this._hasConnect
    }

    isDiagonal() {
        return (this.orientation ==4 || (this.orientation%5)%2 == 1)
    }

    rotate(rotateBy) {
        rotateBy = ((rotateBy%8)+8)%8 // breaking down every Input to be positive and < 8
        this.orientation = Math.sign(this._orientation-3.4) * ((Math.abs(rotateBy -3.5) -Math.trunc(rotateBy /4) *4) +3.5)
    }
}

class Segment {
    constructor(ends) {
        this._ends = ends
        this.open = true
        this.parentTile = null
    }
    
    getEnds() {
        return this.ends
    }
}

class Pathway {
    constructor(firstSegment) {
        this._segments = []
        this._segments.push(firstSegment)
        this._openEnds = []
        this._openEnds.push(this._segments[0].getEnds())
    }

    getSegments() {
        return this._segments
    }

    getOpenEnds() {
        return this._openEnds
    }

    getSegmentEnds() { //necessary?
        let ends = []
        this._segments.forEach( segment => {
            ends.push(segment.getEnds())
        })
    }
}

class Tile{
    constructor(edges, pathSegments) {
        this._edges = edges
        this._pathSegments = pathSegments
        this._mainConnect = null
    }

    getEdges = () => {
        return this._edges
    }

    getSegments = () => {
        return this._pathSegments
    }

    getMainConnect = () => {
        return this._mainConnect
    }

    setMainConnect = (tileEdge) => {
        if (this._mainConnect == null) {
            this._mainConnect = tileEdge
            return true
        } else {
            return false
        }
    }

    rotate = (steps) => {
        this.edges.forEach(edge => {
            edge.rotate(steps)
        })
    }
}

class SqrTile extends Tile{
    constructor(edges, pathSegments) {
        super(edges.slice(0,4), pathSegments)
    }
}

class HexTile extends Tile{
    constructor(edges, pathSegments){
        super(edges.slice(0,6), pathSegments)
    }
}

class Board {
    constructor(edges, pathways) {
        this._edges = edges
        this._accessibleEdges = edges
        this._pathways = pathways
        this._unfinishedPathways = pathways
    }

    getEdges() {
        return this._edges
    }

    getPathways() {
        return this._pathways
    }

    getAccessibleEdges() {
        return this._accessibleEdges
    }

    getUnfinishedPathways() {
        return this._unfinishedPathways
    }

    addTile(tileToAdd, connectionEdge) {
        this._edges.push(tileToAdd.getEdges())
        tileToAdd.setMainConnect(connectionEdge) // lots to do
        
    }

    _addPathway(pathway) {
        this._pathways.push(pathway)
        this._unfinishedPathways.push(pathway)
    }
}


// graphics
class TeamColor extends String {
    constructor(r, g, b) {
        super(`rgb(${r},${g},${b})`)            // is the path color
        this._r = r
        this._g = g
        this._b = b
    }

    getColorValues() {
        return {r:this._r, g:this._g, b:this._b}
    }

    getBaseColor() {
        return `rgb(${Math.ceil(this._r/5)+150},${Math.ceil(this._g/5)+150},${Math.ceil(this._b/5)+150})`
    }

    getFrameTopColor() {
        return `rgb(${Math.ceil(this._r/5)+200},${Math.ceil(this._g/5)+200},${Math.ceil(this._b/5)+200})`
    }
    
    getFrameBotColor() {
        return `rgb(${Math.ceil(this._r/5)+100},${Math.ceil(this._g/5)+100},${Math.ceil(this._b/5)+100})`
    }
}

class GTile {
    constructor(teamColor) {
        this._teamColor = teamColor

        this._frameTop = new Path()
        this._frameTop.strokeColor = teamColor.getFrameTopColor()

        this._frameBot = new Path()
        this._frameBot.strokeColor = teamColor.getFrameBotColor()

        this._frame = new Group([this._frameTop, this._frameBot])
        this._frame.fillColor = teamColor.getBaseColor()
        this._frame.strokeWidth = 2

        this._pattern = new Group()
        this._pattern.strokeColor = teamColor
        this._pattern.strokeWidth = 4

        this._graphics = new Group([this._frame, this._pattern])
    }

    toBack() {
        this._graphics.sendToBack()
    }

    toFront() {
        this._graphics.bringToFront()
    }
}

class GSqrTile extends GTile {
    constructor(sqrTile, center, color) {
        super(color)
    }

}

class GHexTile extends GTile {
    constructor(hexTile, center, color) {
        super(color)


        let tileWidth =  Math.sqrt(2*tileSideLength**2)
        for(let i = -1; i < 2; i++) {
            this._frameTop.add([center.x - i*(tileWidth/2), center.y - tileSideLength/2 + (Math.abs(i)-1)*(tileWidth/2)])
                            //  center.x + offsetRight    , center.y - rectangleBorder  + only if i=0 - tileWidth/2
            this._frameBot.add([center.x + i*(tileWidth/2), center.y + tileSideLength/2 - (Math.abs(i)-1)*(tileWidth/2)])
        }
        this._frameTop.add(this._frameBot.segments[0])
        this._frameBot.add(this._frameTop.segments[0])
    }
}

class GSlot {
    constructor(tile) {

    }
}

class GSqrSlot extends GSlot{
    constructor(sqrTile) {
        super(sqrTile)
    }
}

class GHexSlot extends GSlot{
    constructor(hexTile) {
        super(hexTile)
    }
}

class GBoard {
    constructor(board) {

    }
}

// complete model & graphics
class GameModel {
    constructor(board, sqrStack, hexStack) {
        this._board = board
        this._sqrStack = sqrStack
        this._hexStack = hexStack
        this._remainingTiles = 25
    }

    _restock(tile) {
        if (typeof(tile) == SqrTile) this._sqrStack.push(tile);
        else if (typeof(tile) == HexTile) this._hexStack.push(tile);
    }

    getSqrStack() {
        return this._sqrStack
    }

    getHexStack() {
        return this._hexStack
    }

    getStacks() {
        return {sqr:this.getSqrStack, hex:this.getHexStack}
    }

    getBoard() {
        return this._board
    }
}

class GameGraphics {
    constructor(gameModel, friendlyColor, hostileColor) {
        this._board = new GBoard(gameModel.getBoard())

        this._gSqrStack = []
        gameModel.getSqrStack().forEach(tile => {
            this._gSqrStack.push(new GSqrTile(tile, {x:view.size.width-250 +5*this._gSqrStack.length, y:view.size.height-200 +25*this._gSqrStack.length} ,friendlyColor))
            this._gSqrStack[this._gSqrStack.length-1].toBack()
        })

        this._gHexStack = []
        gameModel.getSqrStack().forEach(tile => {
            this._gHexStack.push(new GHexTile(tile, {x:view.size.width-100 +5*this._gHexStack.length, y:view.size.height-200 +25*this._gHexStack.length} ,hostileColor))
            this._gHexStack[this._gHexStack.length-1].toBack()
        })
    }
}

const start = () => {
    let sqrStack = []
    for(let x = 0; x < 3; x++) {
        let edges = []
        let segments = [[]]
        for(let y = 0; y < 4; y++) {
            edges.push(new TileEdge(Math.random < 0.5, y*2))
            if(edges[y].hasConnect()) segments[0].push(edges[y])
        }
        sqrStack.push(new SqrTile(edges, segments))
    }

    let hexStack = []
    for(let x = 0; x < 3; x++) {
        let edges = []
        let segments = []
        for(let y = 0; y < 3; y++) {
            let segment = []
            edges.push(new TileEdge(Math.random < 0.5, y+1))
            edges.push(new TileEdge(Math.random < 0.5, -y-1))
            if(edges[edges.length-1].hasConnect()) segment.push(edges[edges.length-1])
            if(edges[edges.length-2].hasConnect()) segment.push(edges[edges.length-2])
            if(segment.length > 0) segments.push(segment)
        }
        hexStack.push(new HexTile(edges, segments))
    }

    let bEdges = []
    for (x = 0; x < 8; x++) {
        bEdges.push(new TileEdge(false, x))
    }

    let b = new Board(bEdges, [])

    const red = new TeamColor(230,30,30)
    const blue = new TeamColor(30,30,230)
    let model = new GameModel(b, sqrStack, hexStack)
    let graphics = new GameGraphics(model, blue, red)
    console.log(model)
}