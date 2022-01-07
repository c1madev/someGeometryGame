let tileSideLength = 50
let canvas = document.getElementById("someGeometryGame")

window.addEventListener("resize", function(){
    canvas.style.width ='100%';
    canvas.style.height='100%';
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}, false);



class tileEdge {
    constructor(orientation){
        this.orientation = orientation
        this.hasConnect = (Math.random() < 0.5)

    }
}

class SqrTile {
    constructor(){
        this.foundation = new Path()
        this.lines = new Path()
        this.movable = true
        this.edges = []
        for(let x = 0; x < 4; x++){
            this.edges.push(new tileEdge(x*2))
        }
    }

    rotateEdges() {

    }

    visualize(centerPoint){
        this.foundation = new Path.Rectangle([centerPoint[0]-tileSideLength/2,centerPoint[1]-tileSideLength/2],[tileSideLength,tileSideLength])
        this.foundation.strokeColor = "rgb(50,50,150)"
        this.foundation.strokeWidth = 2
        this.foundation.fillColor = "rgb(150,150,200)"

        for(let x = 0; x < 4; x++) {
            if(this.edges[x].hasConnect) this.lines.join(new Path([centerPoint , [ (this.foundation.segments[x].point.x+this.foundation.segments[(x+1)%4].point.x)/2 , (this.foundation.segments[x].point.y+this.foundation.segments[(x+1)%4].point.y)/2 ]]))
            console.log(this.edges[x].hasConnect)
        }
        this.lines.strokeColor = "rgb(0,0,0)"
        this.lines.strokeWidth = 4

        this.initialiseMouseEvents()
    }

    initialiseMouseEvents(){
        this.foundation.onMouseDrag = (event) => {
            if(this.movable){
                this.foundation.position.x += event.delta.x;
                this.foundation.position.y += event.delta.y;
                this.lines.position.x += event.delta.x;
                this.lines.position.y += event.delta.y;
            }
        }
        this.foundation.onClick = (event) => {
            if(this.movable && Math.abs(event.delta.x)+Math.abs(event.delta.y) == 0){
                this.foundation.rotate(45)
                this.lines.rotate(45)
            }
        }
    }
}

class HexTile {
    constructor(){
        this.foundation = new Path()
        this.movable = true
    }

    visualize(centerPoint){
        let plmin = [1,-1]
        //getting top&bottom triangle hypothenuse
        let h = Math.sqrt(2*tileSideLength**2)

        //getting corner points
        let corners = []
        plmin.forEach(i => {
            corners.push([centerPoint[0]-(i*h/2),centerPoint[1]+(i*tileSideLength/2)])
            corners.push([centerPoint[0]-(i*h/2),centerPoint[1]-(i*tileSideLength/2)])
            corners.push([centerPoint[0], centerPoint[1]-i*(tileSideLength+h)/2])
        })
        corners.push([centerPoint[0]-(h/2),centerPoint[1]+(tileSideLength/2)])

        //drawing the shape
        this.foundation = new Path()
        corners.forEach(i=>{
            this.foundation.add(i)
        })

        this.foundation.strokeColor = "rgb(50,50,150)"
        this.foundation.strokeWidth = 2
        this.foundation.fillColor = "rgb(150,150,200)"

        this.initialiseMouseEvents()
    }

    initialiseMouseEvents(){
        this.foundation.onMouseDrag = (event) => {
            if(this.movable){
                this.foundation.position.x += event.delta.x;
                this.foundation.position.y += event.delta.y;
            }
        }
        this.foundation.onClick = (event) => {
            if(this.movable && Math.abs(event.delta.x)+Math.abs(event.delta.y) == 0){
                this.foundation.rotate(45)
            }
        }
    }
}

class OctTile {
    constructor(){

    }

    visualize(centerPoint){
        let plmin = [1,-1]
        //getting incircle radius
        let r = (tileSideLength/2) / Math.tan((22.5*Math.PI)/180)
    
        //getting corner points
        let corners = []
        plmin.forEach(i => {
            let oneSide = []
            let x = centerPoint[0] + (r*i)
            let y = centerPoint[1] + (r*i)
    
            oneSide.push([centerPoint[0]+(1*i)*(tileSideLength/2),centerPoint[1] - (r*i)]) //point of the geometrically other half
    
            oneSide.push([x,centerPoint[1]-(1*i)*(tileSideLength/2)]) //points of one half of the octagon
            oneSide.push([x,centerPoint[1]+(1*i)*(tileSideLength/2)])
            oneSide.push([centerPoint[0]+(1*i)*(tileSideLength/2),y])
            oneSide.push([centerPoint[0]-(1*i)*(tileSideLength/2),y])
    
            corners.push(oneSide)
        })
    
        let octagon = new Path
        
        for(let x=0;x<2;x++) {
            let side = new Path()
            corners[x].forEach(corner => {
                side.add(corner[0],corner[1])
            })
            side.strokeColor = "rgb(" + (100-(plmin[x]*50)).toString() + "," + (200-(plmin[x]*50)).toString() + "," + (100-(plmin[x]*50)).toString() + ")"
            side.strokeWidth = 3
            side.strokeCap = "round"
            octagon.addSegments(side.segments)
        }
        octagon.fillColor = "rgb(150,200,150)"
    }
}

class AllTiles {
    constructor(){

    }
}

//start
start = () => {

    document.body.style.background = "rgb(101, 104, 121)";

    /*let p = new Path()
    p.strokeColor = 'black';
    p.add(new Point(0, 0));
    p.add(new Point(0, view.size.height));
    p.add(new Point(view.size.width, view.size.height))
    p.add(new Point(view.size.width, 0))*/

    let startTile = new OctTile()
    startTile.visualize([view.size.width/2, view.size.height/2])

    let testHex = new HexTile()
    testHex.visualize([350,250])

    let testHex2 = new HexTile()
    testHex2.visualize([350,250])

    let testSqr = new SqrTile()
    testSqr.visualize([500,500])

    let testSqr2 = new SqrTile()
    testSqr2.visualize([500,500])

    console.debug("loaded")
}