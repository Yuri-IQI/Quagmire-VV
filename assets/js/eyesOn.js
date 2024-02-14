class LookOut {
    constructor() {
        this.foundData;
        this.followedPath;
    }

    async lookForData() {
        const response = await fetch('http://127.0.0.1:5000/visualize_data');
        this.foundData = await response.json();
        this.followedPath = this.foundData.followed_path;
        console.log(this.followedPath);
    }
}

class Visualizer {
    constructor() {
        this.svg = d3.select("body").append("svg")
            .attr("width", "100vw")
            .attr("height", "100vh");
        this.vertexNames = []
        this.vertexes = {};
        this.minDistance = 50;
    }

    drawGraph(followedPath) {
        var vertexCounter = {};
        followedPath.forEach((v, i) => {
            let x, y;
            let element = v[0][1];
            vertexCounter[element] = (vertexCounter[element] || 0) + 1;

            do {
                x = Math.random() * window.innerWidth;
                y = Math.random() * window.innerHeight;
            } while (Object.values(this.vertexes).some(vertex => Math.hypot(vertex.x - x, vertex.y - y) < this.minDistance));

            if (!this.vertexes[element]) {
                this.vertexes[element] = {x: x, y: y};

                this.svg.append("circle")
                    .attr("cx", x)
                    .attr("cy", y)
                    .attr("r", 10)
                    .style("fill", "darkorange");

                this.vertexNames.push({x: x, y: y, name: element});
            }

            if (i > 0) {
                var lastVertex = this.vertexes[followedPath[i - 1][0][1]];
                if (lastVertex) {
                    this.svg.append("line")
                        .attr("x1", lastVertex.x)
                        .attr("y1", lastVertex.y)
                        .attr("x2", this.vertexes[element].x)
                        .attr("y2", this.vertexes[element].y)
                        .style("stroke", "darkorange");
                }
            }
        });
        this.nameVertex();
    }

    nameVertex() {
        this.vertexNames.forEach(n => {
            this.svg.append("text")
                .attr("x", n.x - 25)
                .attr("y", n.y - 20)
                .text(n.name)
                .style("font-size", "20px");
        });
    }
}

window.onload = async function() {
    const outLooker = new LookOut();
    await outLooker.lookForData();

    const visualizer = new Visualizer();
    visualizer.drawGraph(outLooker.followedPath);
}
