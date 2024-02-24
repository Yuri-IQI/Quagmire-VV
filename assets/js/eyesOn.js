Chart.defaults.color = "lightgray";

const retrievedStringTravelLog = localStorage.getItem('travelLogString');
const retrievedStringRoutesLength = localStorage.getItem('routesLengthString');
const TravelLog = JSON.parse(retrievedStringTravelLog);
const routesLength = JSON.parse(retrievedStringRoutesLength);

class DataProcessing {
    constructor() {
        this.travelLog = [];
        this.followedPath = [];
        this.mappedExchanges = {};
    }

    controlData(travelLog) {
        this.mappedExchanges = travelLog[1];
        if (!this.travelLog.length) {
            this.travelLog = travelLog;
            this.processRoute();
        } else if (this.travelLog[0] !== travelLog[0]) {
            if (this.travelLog[0].substring(0, travelLog[0].length) === travelLog[0]) {
                this.travelLog[0] += travelLog[0].substring(this.travelLog[0].length);
            } else {
                this.travelLog[0] = travelLog[0];
            }
            this.processRoute();
        }
    }

    processRoute() {
        this.followedPath = [];

        for (let index = 0; index < this.travelLog[0].length; index++) {
            const place = this.travelLog[0][index];
            if (!this.followedPath.length) {
                this.followedPath.push([place, index < (this.travelLog[0].length - 1) ? 'trace' : []]);
            } else if (!(this.followedPath[this.followedPath.length-1][0][0] == place[0])) {
                this.followedPath.push([place, index < (this.travelLog[0].length - 1) ? 'trace' : []]);
            }
        }        
        this.calculateRoute();

        return this.followedPath;
    }

    calculateRoute() {
        for (let index = 0; index < this.followedPath.length - 1; index++) {
            const j = this.followedPath[index];
            for (const i of routesLength) {
                if ((i[0][0][1] === parseInt(j[0][0]) && i[0][1][1] === parseInt(this.followedPath[index + 1][0][0])) ||
                    (i[0][1][1] === parseInt(j[0][0]) && i[0][0][1] === parseInt(this.followedPath[index + 1][0][0]))) {
                    this.followedPath[index] = [j[0], i[1]];
                }
            }
        }
    }
}

class Visualizer {
    constructor(followedPath, mappedExchanges,) {
        this.treatedData = [];
        this.svgWidth = window.innerWidth;
        this.svgHeight = window.innerHeight;
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

    lookClosely(chart, graphPageId) {
        let chartContainer = document.getElementById(graphPageId);
    
        chart.addEventListener('dblclick', function(event) {
            if (chart.style.display === 'block' && chartContainer.style.height === '100vh') {
                let elements = chartContainer.getElementsByTagName('*');
                for (let i = 0; i < elements.length; i++) {
                    elements[i].style.display = '';
                }
    
                chartContainer.style.height = '374px';
            } else {
                let elements = chartContainer.getElementsByTagName('*');    
                for (let i = 0; i < elements.length; i++) {
                    elements[i].style.display = 'none';
                }
    
                chart.style.display = 'block';
                chartContainer.style.height = '100vh';
            }
        });
    }    
    
    //Background Graph
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
                    .style("fill", "rgb(255,140,0,0.4)");
    
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
                        .style("stroke", "rgb(255,140,0, 0.4)");
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
                    backgroundColor: 'rgb(0, 121, 255, 0.2)',
                    borderColor: 'white',
                    borderWidth: 2,
                    fontColor: 'white'
                }]
            },
            options: {
                scales: {
                    y: {
                      grid: {
                        color: 'rgb(229,229,229,0.4)'
                      }
                    },
                    x: {
                      grid: {
                        color: 'none'
                      }
                    }
                }
            }
        });
        this.lookClosely(this.charts.trip, 'graph-page-1');
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
                            const commonFactor = regionLength + dataLength + (((oneMoreIndex+1)**-1) / (index+1));
                            backgroundColor: index
                            return {
                                x: commonFactor/10,
                                y: ((commonFactor - city.count) - dataLength)/10,
                                r: city.count*10,
                                label: city.stop
                            };
                        }),
                    };
                })
            },
            options: {
                scales: {
                    y: {
                      grid: {
                        color: 'rgb(229,229,229,0.4)'
                      }
                    },
                    x: {
                      grid: {
                        color: 'none'
                      }
                    }
                },
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
        this.lookClosely(this.charts.stops, 'graph-page-1');
    }

    treatIncomeExpensesData() {
        let { labels, inQuantity, outQuantity } = this.treatExchangesData();
        outQuantity.pop();
        let income = [];
        let expenses = [];
        let totalIncome = 0;
        let totalExpenses = 0;
        for (let i = 0; i < outQuantity.length; i++) {
            let value = (outQuantity[i] - inQuantity[i]).toFixed(2);
            if (value >= 0) {
                income.push(value);
                expenses.push(0);
                totalIncome += parseFloat(value);
            } else {
                income.push(0);
                expenses.push(value);
                totalExpenses += parseFloat(value);
            }
        }
        labels.pop();
        labels.push('Total');
        income.push(totalIncome.toFixed(2));
        expenses.push(totalExpenses.toFixed(2));
        
        return { labels, income, expenses };
    }
    
    lookAtTheIncomeExpenses() {
        const { labels, income, expenses } = this.treatIncomeExpensesData();
        new Chart(this.charts.stRes, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Income',
                    data: income,
                    backgroundColor: 'rgba(0, 223, 162, 0.2)',
                    borderColor: 'white',
                    borderWidth: 2,
                    barPercentage: 1
                }, {
                    label: 'Expenses',
                    data: expenses,
                    backgroundColor: 'rgba(255, 0, 96, 0.2)',
                    borderColor: 'white',
                    borderWidth: 2,
                    barPercentage: 1
                }]
            },
            options: {
                scales: {
                    y: {
                      grid: {
                        color: 'rgb(229,229,229,0.4)'
                      }
                    },
                    x: {
                      grid: {
                        color: 'none'
                      }
                    }
                },
                legend: { display: true },
                tooltips: {
                    callbacks: {
                        label: (tooltipItem, data) => {
                            const v = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                            return Array.isArray(v) ? v[1] - v[0] : v;
                        }
                    }
                }
            }
        });
        this.lookClosely(this.charts.stRes, 'graph-page-1');
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
                    borderColor: 'rgba(252, 103, 54, 0.6)',
                    backgroundColor: 'rgba(251, 249, 241, 0.6)',
                    borderWidth: 4,
                    pointRadius: 8,
                    hoverRadius: 12
                },
                {
                    label: `Departure Quantity`,
                    data: outQuantity,
                    fill: false,
                    borderColor: 'rgba(24, 212, 200, 0.6)',
                    backgroundColor: 'rgba(251, 249, 241, 0.6)',
                    borderWidth: 4,
                    pointRadius: 8,
                    hoverRadius: 12
                }]
            },
            options: {
                hover: {
                    mode: 'nearest',
                    intersect: true
                },
                scales: {
                    y: {
                      grid: {
                        color: 'rgb(229,229,229,0.4)'
                      }
                    },
                    x: {
                      grid: {
                        color: 'none'
                      }
                    }
                }
            }
        });
        this.lookClosely(this.charts.mapEx, 'graph-page-1');
    }
}

window.onload = async function() {
    const processor = new DataProcessing();
    processor.controlData(TravelLog);

    const visualizer = new Visualizer(processor.followedPath, processor.mappedExchanges);
    visualizer.lookAtTheDistance();
    visualizer.lookAtTheStops();
    if (visualizer.mappedExchanges) {
        visualizer.lookAtTheIncomeExpenses();
        visualizer.lookAtTheExchanges();
    } else {
        visualizer.charts.stRes.style.display = 'none';
        visualizer.charts.mapEx.style.display = 'none';
    }
    visualizer.drawGraph();
}
