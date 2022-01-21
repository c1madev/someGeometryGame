let tileSideLength = 100                                     // All of the tiles should have the same side length
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
        return (this._orientation ==4 || (this._orientation%5)%2 == 1)
    }

    getOrientation() {
        return this._orientation
    }

    /*rotate(rotateBy) {
        let functionX = (((rotateBy)%8)+8)%8 // breaking down every Input to be positive and < 8
        //this.orientation = Math.sign(this._orientation-3.4) * ((Math.abs(rotateBy -3.5) -Math.trunc(rotateBy /4) *4) +3.5)

        //this.orientation = (Math.sign(this._orientation-3.5) * (Math.abs(rotateBy -3.5))) + (Math.trunc(rotateBy /4) *4) +3.5

        //this.orientation = (Math.sign(this._orientation-3.5) * (Math.abs(rotateBy -3.5)-2)) + (Math.trunc(rotateBy /4) *4) +1.5

        //this.orientation = (Math.sign(orientation-3.5) * (Math.abs(rotateBy -3.5+orientation) -2)) + (Math.trunc((rotateBy+orientation)%8 /4) *4) +1.5

        //this.orientation = Math.abs(functionX-Math.floor((functionX/8)+0.5)*8) + Math.floor((functionX%8)/4)*3

        functionX -= Math.abs(this.orientation-Math.floor((this.orientation/8)+0.5)*8) + Math.floor((this.orientation%8)/4)*3 // finding the correct offset for function

        //this.orientation = ((rotateBy-3.5)/Math.abs(rotateBy-3.5))*(Math.abs(rotateBy-Math.floor((rotateBy/8)+0.5)*8)+Math.floor((rotateBy%8)/4)*3)+Math.floor((rotateBy%8)/4)

        this.orientation = Math.abs(functionX-Math.floor((functionX/8)+0.5)*8) + Math.floor((functionX%8)/4)*3
    }*/

    rotate(rotateBy) {
        let functionX = (((rotateBy)%8)+8)%8
		functionX += Math.abs(this._orientation-Math.floor((this._orientation/8)+0.5)*8) + Math.floor((this._orientation%8)/4)*3
        this._orientation = Math.abs(functionX-Math.floor((functionX/8)+0.5)*8) + Math.floor((functionX%8)/4)*3
    }
}

class Segment {
    constructor(ends) {
        this._ends = ends
        this.open = true
        this.parentTile = null
    }
    
    getEnds() {
        return this._ends
    }

    boardSort(board) {
        let bEdges = board.getEdges()
        let length = this._ends.length
        if(length != 1) {
            let d = 8+bEdges.indexOf(this._ends[0]) - bEdges.indexOf(this._ends[length-1]), iSplice = 0;
            for(let c = 1, i = bEdges.indexOf(this._ends[0]), iPlus1 /* = bEdges.indexOf(this._ends[1])*/; c < length; c++) {
                iPlus1 = bEdges.indexOf(this._ends[c])
                if(iPlus1 - i > d) {
                    d = iPlus1-i;
                    iSplice = c;
                }
                i = iPlus1
            }
            let sortedEnds = this._ends.splice(iSplice)
            this._ends = sortedEnds.concat(this._ends)
        }
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
        this._edges.forEach(edge => {
            edge.parentTile = this
        })

        this._pathSegments = []
        for(let x = 0; x < pathSegments.length; x++) {
            let segmentEnds = []
            pathSegments[x].forEach(edge => {
                if(this._edges.indexOf(edge) != -1) segmentEnds.push(edge)
            })
            this._pathSegments.push(new Segment(segmentEnds))
            this._pathSegments[this._pathSegments.length-1].parentTile = this
        }
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
        this._pathways.forEach(p => {
            p.getSegments()[0].boardSort(this)
        })
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
class TeamColor {
    constructor(r, g, b) {
        this._r = r
        this._g = g
        this._b = b
    }

    getColorValues() {
        return {r:this._r, g:this._g, b:this._b}
    }

    getPathColor() {
        return `rgb(${this._r/2},${this._g/2},${this._b/2})`
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
        this._frame.strokeWidth = 3
        this._frame.strokeCap = "round"

        this._pattern = new CompoundPath()
        this._pattern.strokeColor = teamColor.getPathColor()
        this._pattern.strokeWidth = 4
        this._pattern.strokeCap = "round"

        this._graphics = new Group([this._frame,this._pattern])

        this._rotation = 0
        this._movable = true
        this._initialiseMouseEvents()
    }

    toBack() {
        this._graphics.sendToBack()
    }

    toFront() {
        this._graphics.bringToFront()
    }

    _rotateLeft() {}

    _rotateRight() {}

    _initialiseMouseEvents() {
        this._graphics.onMouseDrag = (event) => {
            if(this._movable){
                this._graphics.position.x += event.delta.x;
                this._graphics.position.y += event.delta.y;
            }
        }
        this._graphics.onClick = (event) => {
            if(this._movable && Math.abs(event.delta.x)+Math.abs(event.delta.y) == 0){
                if(event.button == 0) this._rotateLeft() // event.button is not in the original paper.js, added it because I needed a right-click identifier
                else if(event.button == 2) this._rotateRight()
            }
        }
    }
}

class GSqrTile extends GTile {
    constructor(sqrTile, center, color) {
        super(color)

        for(let i = -1; i < 2; i++) {
            this._frameTop.add([center.x+ (i**i) * (tileSideLength/2), center.y- ((-i)**(-i)) * (tileSideLength/2)])
            this._frameBot.add([center.x- (i**i) * (tileSideLength/2), center.y+ ((-i)**(-i)) * (tileSideLength/2)])
        }

        let sqrSegment = new CompoundPath()
        let frameParts = this._frame.getChildren()
        sqrTile.getSegments()[0].getEnds().forEach((edge) => {
            let i = sqrTile.getEdges().indexOf(edge)
            let edgeCenterX = (i%2 == 1) ? ((frameParts[1-Math.ceil(i/2)%2].getSegments()[0+(i%2)].getPoint().x + (frameParts[1-Math.ceil(i/2)%2].getSegments()[1+(i%2)].getPoint().x))/2) : center.x
            let edgeCenterY = (i%2 == 0) ? ((frameParts[Math.ceil(i/2)%2].getSegments()[0+(i%2)].getPoint().y + (frameParts[Math.ceil(i/2)%2].getSegments()[1+(i%2)].getPoint().y))/2) : center.y
            sqrSegment.addChild(new Path([center, new Point(edgeCenterX, edgeCenterY)]))
        })
        this._pattern.addChild(sqrSegment)
        this._pattern.bringToFront()
    }

    _rotateRight() {
        this._graphics.rotate(45)
        this._rotation = (this._rotation+1)%2
        if(this._rotation == 1) this._frame.rotate(-90)
    }

    _rotateLeft() {
        this._graphics.rotate(-45)
        this._rotation = (this._rotation+1)%2
        if(this._rotation == 0) this._frame.rotate(90)
    }


}

class GHexTile extends GTile {
    constructor(hexTile, center, color) {
        super(color)

        let tileWidth =  Math.sqrt(2*tileSideLength**2)

        for(let i = -1.5; i < 2; i++) {
            this._frameTop.add([center.x+(1-Math.trunc(Math.abs(i)))*(tileWidth/2), center.y+ Math.sign(i)*(tileSideLength/2) + Math.trunc(i)*(tileWidth/2)])
            this._frameBot.add([center.x-(1-Math.trunc(Math.abs(i)))*(tileWidth/2)+1, center.y+ Math.sign(i)*(tileSideLength/2) + Math.trunc(i)*(tileWidth/2)])
        }

        let zoneConnect = new CompoundPath()
        hexTile.getSegments().forEach((segment) => {
            let hexSegment = new CompoundPath()
            let formerCenterConnect = new Point(center.x, center.y+ (tileSideLength/2) * ((segment.getEnds()[0].getOrientation()-1)%3 -1))
            segment.getEnds().forEach(edge => {
                let i = hexTile.getEdges().indexOf(edge)
                let o = edge.getOrientation()
                let relevantFramePart = this._frame.getChildren()[Math.floor(o/4)].getSegments()
                let centerConnect = new Point(center.x, center.y+ (tileSideLength/2) * ((o-1)%3 -1))
                if(centerConnect != formerCenterConnect) zoneConnect.addChild(new Path(centerConnect, formerCenterConnect))
                let edgeCenterX = (relevantFramePart[(o-1)%3].getPoint().x + relevantFramePart[(o-1)%3 +1].getPoint().x)/2
                let edgeCenterY = (relevantFramePart[(o-1)%3].getPoint().y + relevantFramePart[(o-1)%3 +1].getPoint().y)/2

                hexSegment.addChild(new Path(centerConnect, new Point(edgeCenterX, edgeCenterY)))
            })
            hexSegment.addChild(zoneConnect)
            this._pattern.addChild(hexSegment)
        })
        this._frameTop.insert(0, this._frameBot.segments[1])
        this._frameBot.insert(4, this._frameTop.segments[3])
        this._frameTop.removeSegment(4)
        this._frameBot.removeSegment(0)
    }

    _rotateLeft() {
        if(this._rotation != 3) {
            this._frameBot.insert(0, this._frameTop.segments[1])
            this._frameTop.insert(4, this._frameBot.segments[3])
            this._frameBot.removeSegment(4)
            this._frameTop.removeSegment(0)
        }
        this._graphics.rotate(-45)
        this._rotation = (this._rotation+3)%4
    }

    _rotateRight() {
        if(this._rotation != 2){
            this._frameTop.insert(0, this._frameBot.segments[1])
            this._frameBot.insert(4, this._frameTop.segments[3])
            this._frameTop.removeSegment(4)
            this._frameBot.removeSegment(0)
        }
        this._graphics.rotate(45)
        this._rotation = (this._rotation+1)%4
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

class GBoard extends GTile{
    constructor(board, startTileColor) {
        super(startTileColor)

        let center = new Point(view.size.width/2, view.size.height/2)
        let tileWidth =  Math.sqrt(2*tileSideLength**2)
        let midOccupied = false
        let tsl05 = tileSideLength * 0.5

        for(let i = -1.5; i < 2; i++) {
            this._frameTop.add([center.x+(1-Math.trunc(Math.abs(i)))*(tileWidth/2)+tsl05, center.y+ Math.sign(i)*(tsl05) + Math.trunc(i)*(tileWidth/2)])
            this._frameBot.add([center.x-(1-Math.trunc(Math.abs(i)))*(tileWidth/2)+1-tsl05, center.y- Math.sign(i)*(tsl05) - Math.trunc(i)*(tileWidth/2)])
        }
        this._frameTop.insert(0, this._frameBot.lastSegment)
        this._frameBot.insert(0, this._frameTop.lastSegment)

        board.getPathways().forEach(p => { // it doesn’t yet work, not even theoretically
            let sEnds = p.getSegments()[0].getEnds()
            let gSegment = new CompoundPath()
            let connLines = new CompoundPath()
            let iOccupyMid = false

            console.log(sEnds)

            sEnds.forEach(edge => {
                let index = board.getEdges().indexOf(edge)
                let line = new Path({x:center.x, y:center.y-tileWidth/2},{x:center.x, y:center.y-tsl05-tileWidth/2})
                line.rotate(index*45, center)
                gSegment.addChild(line)
            })

            if(sEnds.length > 1){
                let i = 0
                
                for(let c = 1; c < sEnds.length; c++) {
                    if (iOccupyMid) {
                        connLines.addChild(new Path(gSegment.getChildren()[c].getSegments()[0].getPoint(), this._graphics.position))
                    } else if(board.getEdges().indexOf(sEnds[i])%2 == board.getEdges().indexOf(sEnds[c])%2) {
                        connLines.addChild(new Path(gSegment.getChildren()[i].getSegments()[0].getPoint(),gSegment.getChildren()[c].getSegments()[0].getPoint()))
                        if(board.getEdges().indexOf(sEnds[i])%4 == board.getEdges().indexOf(sEnds[c])%4 && !midOccupied) {
                            iOccupyMid = true
                            midOccupied = true
                            for(let d = 0; d < connLines.getChildren().length-1; d++) {
                                connLines.getChildren()[d].getSegments()[1].setPoint(this._graphics.position)
                            }
                        }
                        i = c
                    } else if( ( (board.getEdges().indexOf(sEnds[c])-board.getEdges().indexOf(sEnds[i])) +8) %8 == 1) {
                        let meet = new Point(this._graphics.position.add({x:0, y:-tsl05}))
                        let conn = new Path(meet,this._graphics.position.add(-tsl05))
                        conn.rotate(45*board.getEdges().indexOf(sEnds[c]),this._graphics.position)
                        gSegment.getChildren()[c].getSegments()[0].setPoint(conn.getSegments()[0].getPoint())
                        connLines.addChild(conn)

                    } else if(board.getEdges().indexOf(sEnds[i+1])%2 == board.getEdges().indexOf(sEnds[c])%2 && sEnds[i+1] != sEnds[c] && !board.getEdges()[(board.getEdges().indexOf(sEnds[i+1])+1)%8].hasConnect()) {
                        let corner = new Point(this._graphics.position.add({x:tsl05, y:-tsl05}))
                        let conn1 = new Path({x:this._graphics.position.x, y:this._graphics.position.y-tsl05},corner)
                        let conn2 = new Path({x:this._graphics.position.x+tsl05, y:this._graphics.position.y},corner)
                        conn1.rotate(45*board.getEdges().indexOf(sEnds[c-1]), this._graphics.position); conn2.rotate(45*board.getEdges().indexOf(sEnds[c-1]), this._graphics.position)
                        gSegment.getChildren()[c].getSegments()[0].setPoint(conn2.getSegments()[0].getPoint())
                        connLines.addChildren([conn1, conn2])
                    } else if(!board.getEdges()[(board.getEdges().indexOf(sEnds[c])+7)%8].hasConnect()) {
                        let corner = new Point(this._graphics.position.add({x:tsl05, y:tsl05}))
                        let conn1 = new Path({x:this._graphics.position.x, y:this._graphics.position.y+tsl05},corner)
                        let conn2 = new Path({x:this._graphics.position.x+tsl05, y:this._graphics.position.y-tsl05},corner)
                        conn1.rotate(45*(board.getEdges().indexOf(sEnds[c])-4), this._graphics.position); conn2.rotate(45*(board.getEdges().indexOf(sEnds[c])-4), this._graphics.position)
                        gSegment.getChildren()[c].getSegments()[0].setPoint(conn1.getSegments()[0].getPoint())
                        gSegment.getChildren()[i].getSegments()[0].setPoint(conn2.getSegments()[0].getPoint())
                        connLines.addChildren([conn1, conn2])
                    } else if(!board.getEdges()[(board.getEdges().indexOf(sEnds[i])+1)%8].hasConnect()) {
                        let corner = new Point(this._graphics.position.add({x:tsl05, y:-tsl05}))
                        let conn2 = new Path({x:this._graphics.position.x, y:this._graphics.position.y-tsl05},corner)
                        let conn1 = new Path({x:this._graphics.position.x+tsl05, y:this._graphics.position.y+tsl05},corner)
                        conn1.rotate(45*board.getEdges().indexOf(sEnds[c-1]), this._graphics.position); conn2.rotate(45*board.getEdges().indexOf(sEnds[c-1]), this._graphics.position)
                        gSegment.getChildren()[i].getSegments()[0].setPoint(conn2.getSegments()[0].getPoint())
                        gSegment.getChildren()[c].getSegments()[0].setPoint(conn1.getSegments()[0].getPoint())
                        connLines.addChildren([conn1, conn2])
                    } else if (!midOccupied && connLines.getChildren().length == 0) {
                        connLines.addChild(new Path(gSegment.getChildren()[c].getSegments()[0].getPoint(), this._graphics.position))
                        connLines.addChild(new Path(gSegment.getChildren()[c-1].getSegments()[0].getPoint(), this._graphics.position))
                        iOccupyMid = true
                        midOccupied = true
                    } else alert("something went wrong")
                }
            }
            this._pattern.addChild(connLines)
            this._pattern.addChild(gSegment)
        })
        this._frame.rotate(-45)
    }

    


    _initialiseMouseEvents() {
        
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
    constructor(gameModel, friendlyColor, hostileColor, neutralColor) {
        this._friendlyColor = friendlyColor
        this._hostileColor = hostileColor
        this._neutralColor = neutralColor
        this._gBoard = new GBoard(gameModel.getBoard(), neutralColor)
        
        this._gSqrStack = []
        gameModel.getSqrStack().forEach(tile => {
            this._gSqrStack.push(new GSqrTile(tile, {x:view.size.width-250 +5*this._gSqrStack.length, y:view.size.height-200 +25*this._gSqrStack.length} ,hostileColor))
            this._gSqrStack[this._gSqrStack.length-1].toBack()
        })

        this._gHexStack = []
        gameModel.getHexStack().forEach(tile => {
            this._gHexStack.push(new GHexTile(tile, {x:view.size.width-100 +5*this._gHexStack.length, y:view.size.height-200 +25*this._gHexStack.length} ,friendlyColor))
            this._gHexStack[this._gHexStack.length-1].toBack()
        })

        this._gBoard.toBack()
    }
}

const start = () => {
    let sqrStack = []
    for(let x = 0; x < 3; x++) {
        let edges = []
        let segments = [[]]
        for(let y = 0; y < 4; y++) {
            edges.push(new TileEdge(Math.random() < 0.5, y*2))
            if(edges[y].hasConnect()) {
                segments[0].push(edges[y])
            }
        }
        sqrStack.push(new SqrTile(edges, segments))
    }

    let hexStack = []
    for(let x = 0; x < 3; x++) {
        let edges = []
        let segmentsProto = []
        for(let y = 0; y < 3; y++) {
            let segment = []
            edges.push(new TileEdge(Math.random() < 0.5, y+1))
            edges.push(new TileEdge(Math.random() < 0.5, -y-1))
            if(edges[edges.length-2].hasConnect()) segment.push(edges[edges.length-2])
            if(edges[edges.length-1].hasConnect()) segment.push(edges[edges.length-1])
            if(segment.length > 0) segmentsProto.push(segment)
        }
        let segments = []
        if(segmentsProto.length>0) segments.push(segmentsProto[0])
        for(let y = 0; y < segmentsProto.length-1; y++) {
            (Math.random() < 0.5) ? segmentsProto[y+1].forEach(edge=>{segments[segments.length-1].push(edge)}) : segments.push(segmentsProto[y+1])
        }
        hexStack.push(new HexTile(edges, segments))
    }

    let bEdges = []
    let bSegmentArrays = []
    let bSegments = []
    for (x = 0; x < 8; x++) {
        bEdges.push(new TileEdge(Math.random() < 0.5, x))
    }

    for ( x = 0; x < 8; x++) {
        if (bEdges[x].hasConnect()) {
            if(bSegmentArrays == []) {
                bSegmentArrays.push([bEdges[x]])
            } else {
                let z = -1;
                let connected = false;
                bSegmentArrays.forEach(segment => {
                    if(bEdges.indexOf(segment[segment.length-1]) > z && !connected) {
                        z = bEdges.indexOf(segment[segment.length-1])
                        if(Math.random() < (1/(bSegmentArrays.length+1))) {
                            segment.push(bEdges[x])
                            connected = true;
                        }
                    }
                })
                if(!connected) bSegmentArrays.push([bEdges[x]])
            }
        }
    }
    bSegmentArrays.forEach(segment => {
        bSegments.push(new Pathway(new Segment(segment)))
    })

    let b = new Board(bEdges, bSegments)

    const red = new TeamColor(224, 17, 95)
    const blue = new TeamColor(0,95*2,106*2)
    const green = new TeamColor(173,255,47)
    let model = new GameModel(b, sqrStack, hexStack)
    let graphics = new GameGraphics(model, blue, red, green)
    console.log(model)
}