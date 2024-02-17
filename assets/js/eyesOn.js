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
    constructor(followedPath) {
        this.treatedData = [];
        this.svg = d3.select("body").append("svg")
            .attr("width", "96vw")
            .attr("height", "96vh");
        this.vertexNames = []
        this.vertexes = {};
        this.minDistance = 50;
        this.followedPath = followedPath;
        this.charts = {
            trip: document.getElementById('trip'),
            stops: document.getElementById('stops')
        }
    }

    drawGraph() {
        var vertexCounter = {};
        this.followedPath.forEach((v, i) => {
            let x, y;
            let element = v[0][1];
            vertexCounter[element] = (vertexCounter[element] || 0) + 1;

            do {
                x = Math.random() * 1360;
                y = Math.random() * 700;
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
                var lastVertex = this.vertexes[this.followedPath[i - 1][0][1]];
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

    treatDistanceData() {
        let unorderedPath = this.followedPath.flatMap(place => Array.isArray(place[1]) ? place[0][1] : [place[0][1], place[1]]);
        let orderedPath = {};  
        unorderedPath.forEach((element, index) => {
            if (index % 2 === 0 && index+2 < unorderedPath.length) {
                let key = element+' to '+unorderedPath[index + 2];
                if (!orderedPath[key]) {
                    orderedPath[key] = unorderedPath[index+1];
                } else {
                    orderedPath[key] += unorderedPath[index+1];
                }
            }
        });

        this.treatedData.push(orderedPath);
    }       

    lookAtTheDistance() {
        this.treatDistanceData();
        new Chart(this.charts.trip, {
            type: 'bar',
            data: {
                labels: Object.keys(this.treatedData[0]),
                datasets: [{
                    label: 'Traveled Distance',
                    data: Object.values(this.treatedData[0]),
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'white',
                    borderWidth: 2
                }]
            },
            options: {
  
            }
        });        
    }

    treatStopsData() {
        let datasetByRegion = {};
        this.followedPath.forEach((element) => {
            let region = element[0][2];
            let stop = element[0][1];
            if (!datasetByRegion[region]) {
                datasetByRegion[region] = {};
            }
            if (!datasetByRegion[region][stop]) {
                datasetByRegion[region][stop] = 1;
            } else {
                datasetByRegion[region][stop]++;
            }
        });
    
        let treatedDatasetRegion = [];
        for (let region in datasetByRegion) {
            let counts = datasetByRegion[region];
            treatedDatasetRegion.push({
                region: region,
                data: Object.keys(counts).map(stop => ({ stop: stop, count: counts[stop] }))
            });
        }
        this.treatedData.push(treatedDatasetRegion);
        return treatedDatasetRegion
    }
    
    lookAtTheStops() {
        const dataGroup = this.treatStopsData();
        new Chart(this.charts.stops, {
            type: 'bubble',
            data: {
                datasets: dataGroup.map((regionData, index) => {
                    const regionLength = regionData.region.length;
                    const dataLength = regionData.data.length;
                    return {
                        label: regionData.region,
                        data: regionData.data.map((city, oneMoreIndex) => {
                            const commonFactor = regionLength * dataLength + (oneMoreIndex / (index+1));
                            return {
                                x: commonFactor,
                                y: (commonFactor - city.count) - dataLength,
                                r: city.count * 6,
                                label: city.stop // label for each bubble
                            };
                            backgroundColor: index
                        }),
                    };
                })
            },
            options: {
                scales: {
                    y: { beginAtZero: true },
                    x: { beginAtZero: true }
                },
                tooltips: {
                    mode: 'point', // set tooltips mode to 'point'
                    callbacks: {
                        label: (tooltipItem, data) => {
                            const dataset = data.datasets[tooltipItem.datasetIndex];
                            const currentItem = dataset.data[tooltipItem.index];
                            return `${currentItem.label}: ${currentItem.r / 6}`; // customize tooltip text
                        }
                    }
                }
            },
            plugins: [{
                afterDatasetsDraw: (chart) => {
                    const ctx = chart.ctx;
                    ctx.fillStyle = 'white';
                    const fontSize = 14;
                    ctx.font = Chart.helpers.fontString(fontSize);
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'center';
    
                    chart.data.datasets.forEach((dataset, i) => {
                        const meta = chart.getDatasetMeta(i);
                        if (meta.type === "bubble") { //exclude scatter
                            meta.data.forEach((element, index) => {
                                const dataString = dataset.data[index].label;
                                const position = element.tooltipPosition();
                                ctx.fillText(dataString, position.x, position.y);
                            });
                        }
                    });
                }
            }]
        });
    }    
}

window.onload = async function() {
    const outLooker = new LookOut();
    await outLooker.lookForData();

    const visualizer = new Visualizer(outLooker.followedPath);
    visualizer.drawGraph();
    visualizer.lookAtTheDistance();
    visualizer.lookAtTheStops();
}
