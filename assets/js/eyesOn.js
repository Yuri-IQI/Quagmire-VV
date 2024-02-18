class LookOut {
    constructor() {
        this.foundData;
        this.followedPath;
        this.mappedExchanges;
    }

    async lookForData() {
        const response = await fetch('http://127.0.0.1:5000/visualize_data');
        this.foundData = await response.json();
        this.followedPath = this.foundData[0].followed_path;
        this.mappedExchanges = this.foundData[1].exchanges;

        console.log(this.followedPath);
        console.log(this.mappedExchanges);
    }
}

class Visualizer {
    constructor(followedPath, mappedExchanges, svgHeight, svgWidth) {
        this.treatedData = [];
        this.svgWidth = svgWidth;
        this.svgHeight = svgHeight;
        this.svg = d3.select("body").append("svg")
            .attr("width", this.svgWidth)
            .attr("height", this.svgHeight);
        this.vertexNames = []
        this.vertexes = {};
        this.minDistance = 50;
        this.followedPath = followedPath;
        this.mappedExchanges = mappedExchanges;
        this.charts = {
            trip: document.getElementById('trip'),
            stops: document.getElementById('stops'),
            mapEx: document.getElementById('mapped-exchanges'),
            stRes: document.getElementById('stops-result')
        }
    }
    
    drawGraph() {
        var vertexCounter = {};
        this.followedPath.forEach((v, i) => {
            let x, y;
            let element = v[0][1];
            vertexCounter[element] = (vertexCounter[element] || 0) + 1;
    
            do {
                x = Math.random() * this.svgWidth;
                y = Math.random() * this.svgHeight;
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
                responsive: true
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
        const dataGroup = this.treatStopsData(); //I hate this whole function
        new Chart(this.charts.stops, {
            type: 'bubble',
            data: {
                datasets: dataGroup.map((regionData, index) => {
                    const regionLength = regionData.region.length;
                    const dataLength = regionData.data.length;
                    return {
                        label: regionData.region,
                        data: regionData.data.map((city, oneMoreIndex) => {
                            const commonFactor = regionLength * dataLength + (((oneMoreIndex+1)**-1) / (index+1));
                            backgroundColor: index
                            return {
                                x: commonFactor,
                                y: (commonFactor - city.count) - dataLength,
                                r: city.count * 6,
                                label: city.stop
                            };
                        }),
                    };
                })
            },
            options: {
                responsive: true,
                tooltips: {
                    mode: 'point',
                    callbacks: {
                        label: (tooltipItem, data) => {
                            const dataset = data.datasets[tooltipItem.datasetIndex];
                            const currentItem = dataset.data[tooltipItem.index];
                            return `${currentItem.label}: ${currentItem.r / 6}`;
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
                        if (meta.type === "bubble") {
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

    treatExchangesData() {
        let labels = [];
        let exchanges = [];
        let visits = [];
        for (let place in this.mappedExchanges) {
            let placeExchanges = this.mappedExchanges[place];
            for (let visit in placeExchanges) {
                visits.push(Number(visit));
                labels.push(place);
                exchanges.push(placeExchanges[visit].map(Number));
            }
        }
        let sortedIndices = visits.map((visit, index) => index).sort((a, b) => visits[a] - visits[b]);
        labels = sortedIndices.map(index => labels[index]);
        let inQuantity = sortedIndices.map(index => exchanges[index][0]);
        let outQuantity = sortedIndices.map(index => exchanges[index][1]);
        return { labels, inQuantity, outQuantity };
    }
    
    lookAtTheExchanges() {
        let { labels, inQuantity, outQuantity } = this.treatExchangesData();
        new Chart(this.charts.mapEx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `Arrival Quantity`,
                    data: inQuantity,
                    fill: false,
                    borderColor: 'rgba(70, 130, 180, 0.8)',
                    backgroundColor: 'rgba(70, 130, 180, 0.4)',
                    borderWidth: 2,
                    pointRadius: 8,
                    hoverRadius: 10
                },
                {
                    label: `Departure Quantity`,
                    data: outQuantity,
                    fill: false,
                    borderColor: 'rgba(60, 179, 113, 0.8)',
                    backgroundColor: 'rgba(60, 179, 113, 0.4)',
                    borderWidth: 2,
                    pointRadius: 8,
                    hoverRadius: 10
                }]
            },
            options: {
                responsive: true,
                hover: {
                    mode: 'nearest',
                    intersect: true
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    treatIncomeData() {
        let { labels, inQuantity, outQuantity } = this.treatExchangesData();
        outQuantity.pop();
        let result = [];
        let total = 0;
        for (let i = 0; i < outQuantity.length; i++) {
            let value = (outQuantity[i] - inQuantity[i]).toFixed(2);
            result.push(value);
            total += parseFloat(value);
        }
        labels.pop();
        labels.push('Total');
        result.push(total.toFixed(2));
        
        let ctx = this.charts.stRes.getContext('2d');
        let gradient = ctx.createLinearGradient(0, 50, 0, 700);
        gradient.addColorStop(0, 'rgba(255, 0, 255, 0.2)');   
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0.2)');
        return { labels, result, gradient };
    }

    lookAtTheIncome() {
        const { labels, result, gradient } = this.treatIncomeData();
        new Chart(this.charts.stRes, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Income and Expenses',
                    data: result,
                    backgroundColor: gradient,
                    borderWidth: 2,
                    borderColor: 'white',
                    barPercentage: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: { display: false },
                tooltips: {
                    callbacks: {
                        label: (tooltipItem, data) => {
                            const v = data.datasets[0].data[tooltipItem.index];
                            return Array.isArray(v) ? v[1] - v[0] : v;
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }    
}

window.onload = async function() {
    const outLooker = new LookOut();
    await outLooker.lookForData();

    const visualizer = new Visualizer(outLooker.followedPath, outLooker.mappedExchanges, window.innerHeight, window.innerWidth);
    visualizer.drawGraph();
    visualizer.lookAtTheDistance();
    visualizer.lookAtTheStops();
    visualizer.lookAtTheExchanges();
    visualizer.lookAtTheIncome();
}
