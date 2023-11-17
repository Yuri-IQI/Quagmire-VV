var coordinatesArray = [];
var imageUrl = "Imagens/Icone_cidade.svg";

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
        img.style.left = coordinatesArray[i][0] - 5 + "px";
        img.style.top = coordinatesArray[i][1] + "px";
        
        iconsDiv.appendChild(img);
      }
    });

    fetch('http://127.0.0.1:5000/get_revised_connections')
    .then(response => response.json())
    .then(data => {
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        var routes = document.querySelector('.routes');
        svg.setAttribute("width", "1340");
        svg.setAttribute("height", "900");
        routes.appendChild(svg);

        for (let i = 0; i < data.length; i++) {
            let pointA = data[i][0][1];
            let pointB = data[i][1][1];

            var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", pointA[0]);
            line.setAttribute("y1", pointA[1]);
            line.setAttribute("x2", pointB[0]);
            line.setAttribute("y2", pointB[1]);
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
