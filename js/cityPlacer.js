var coordinatesArray = [];
var imageUrl = "Imagens/Icone_cidade.svg";
var currentSelectedImg = null;
var connections = {};

window.onload = function() {
  fetch('http://127.0.0.1:5000/get_coordinates')
    .then(response => response.json())
    .then(data => {
      coordinatesArray = data;
      var iconsDiv = document.getElementById("icons");
      
      for (let i = 0; i < coordinatesArray.length; i++) {
        var img = document.createElement("img");
        img.src = imageUrl;
        img.style.position = "absolute";
        img.style.left = coordinatesArray[i][1][0] - 5 + "px"; // Assuming the x-coordinate is at index 1[0]
        img.style.top = coordinatesArray[i][1][1] + "px"; // Assuming the y-coordinate is at index 1[1]
        img.id = coordinatesArray[i][0]; // Assuming the city ID is at index 0
        img.onclick = function() {
          if (currentSelectedImg) {
            // Check if the clicked city is connected to the currently selected city
            if (connections[currentSelectedImg.id] && connections[currentSelectedImg.id].includes(Number(this.id))) {
              currentSelectedImg.style.border = "none";
              this.style.border = "2px dashed darkred";
              this.style.borderRadius = "16px";
              this.style.padding = "2px";
              this.style.left = coordinatesArray[i][1][0] - 8 + "px"; // Assuming the x-coordinate is at index 1[0]
              this.style.top = coordinatesArray[i][1][1] - 3 + "px"; // Assuming the y-coordinate is at index 1[1]
              currentSelectedImg = this;
            }
          } else {
            this.style.border = "2px dashed darkred";
            this.style.borderRadius = "16px";
            this.style.padding = "2px";
            this.style.left = coordinatesArray[i][1][0] - 8 + "px"; // Assuming the x-coordinate is at index 1[0]
            this.style.top = coordinatesArray[i][1][1] - 3 + "px"; // Assuming the y-coordinate is at index 1[1]
            currentSelectedImg = this;
          }
        };
        
        iconsDiv.appendChild(img);
      }
    });

    fetch('http://127.0.0.1:5000/get_revised_connections')
    .then(response => response.json())
    .then(data => {
        // Create the connections map
        for (let i = 0; i < data.length; i++) {
            let cityAId = data[i][0][0]; // Assuming the city ID is at index 0[0]
            let cityBId = data[i][1][0]; // Assuming the city ID is at index 1[0]

            if (!connections[cityAId]) {
                connections[cityAId] = [];
            }
            if (!connections[cityBId]) {
                connections[cityBId] = [];
            }

            connections[cityAId].push(cityBId);
            connections[cityBId].push(cityAId);
        }

        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        var routes = document.querySelector('.routes');
        svg.setAttribute("width", "1340");
        svg.setAttribute("height", "900");
        routes.appendChild(svg);

        for (let i = 0; i < data.length; i++) {
            let pointA = data[i][0][1]; // Assuming the coordinates are at index 0[1]
            let pointB = data[i][1][1]; // Assuming the coordinates are at index 1[1]

            var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", pointA[0] - 2);
            line.setAttribute("y1", pointA[1] - 2);
            line.setAttribute("x2", pointB[0] - 2);
            line.setAttribute("y2", pointB[1] - 2);
            line.setAttribute("stroke-width", "2");
            line.setAttribute("stroke", "black");
            svg.appendChild(line);
        }
    });
}

var allCoordinates = [];
function getCoordinates(event) {
    var iconsDiv = document.getElementById("icons");
    var rect = iconsDiv.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    var coordinates = "[" + x + ", " + Math.round(y) + "],";
    allCoordinates.push(coordinates);
    
    document.getElementById("coordinates").innerHTML = allCoordinates.join('<br>');
}
