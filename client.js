const strokeTetr = (context, xMid,yMid, sideLength) => {
    context.strokeRect(xMid-sideLength/2,yMid-sideLength/2,sideLength,sideLength)
}

const strokeHex = (context, xMid,yMid, sideLength) => {
    let plmin = [1,-1]
    //getting top&bottom triangle hypothenuse
    let h = Math.sqrt(2*sideLength**2)

    //getting corner points
    let corners = []
    plmin.forEach(i => {
        corners.push([xMid-(i*h/2),yMid+(i*sideLength/2)])
        corners.push([xMid-(i*h/2),yMid-(i*sideLength/2)])
        corners.push([xMid, yMid-i*(sideLength+h)/2])
    })

    //drawing the shape
    context.beginPath()
    context.moveTo(corners[5][0], corners[5][1])
    corners.forEach(x => {
        context.lineTo(x[0],x[1])
    })
    context.closePath()
    context.stroke()
}

const strokeOct = (context, xMid,yMid, sideLength) => {
    let plmin = [1,-1]
    //getting incircle radius
    let r = (sideLength/2) / Math.tan((22.5*Math.PI)/180)

    //getting corner points
    let corners = []
    plmin.forEach(i => {
        x = xMid + (r*i)
        y = yMid + (r*i)
        corners.push([x,yMid-(1*i)*(sideLength/2)])
        corners.push([x,yMid+(1*i)*(sideLength/2)])
        corners.push([xMid+(1*i)*(sideLength/2),y])
        corners.push([xMid-(1*i)*(sideLength/2),y])
    })
    console.log(corners.length)

    //drawing the shape
    context.beginPath()
    context.moveTo(corners[7][0], corners[7][1])
    corners.forEach(x => {
        context.lineTo(x[0],x[1])
    })
    context.closePath()
    context.stroke()
}

window.addEventListener("load", () => {

    let canvas = document.getElementById("someGeometryGame")
    let context = canvas.getContext("2d") //webgl2?

    strokeTetr(context,100,150,50)
    strokeHex(context, 100,250,50)
    strokeOct(context, 100,400,50)

    console.debug("loaded")

})