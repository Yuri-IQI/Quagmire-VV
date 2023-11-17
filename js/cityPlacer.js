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
        img.style.left = coordinatesArray[i][0] + "px";
        img.style.top = coordinatesArray[i][1] + "px";
        
        iconsDiv.appendChild(img);
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