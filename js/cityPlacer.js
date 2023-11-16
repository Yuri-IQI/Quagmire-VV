var coordinatesArray = []; // Será substituído pelas coordenadas do servidor
var imageUrl = "Imagens/Icone_cidade.png"; // Substitua pela URL da sua imagem

window.onload = function() {
  fetch('http://127.0.0.1:5000/get_coordinates')
    .then(response => response.json())
    .then(data => {
      coordinatesArray = data;
      var iconsDiv = document.getElementById("Icons");
      
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
    var iconsDiv = document.getElementById("Icons");
    var rect = iconsDiv.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    var coordinates = "[" + x + ", " + Math.round(y) + "],";
    allCoordinates.push(coordinates);
    
    document.getElementById("coordinates").innerHTML = allCoordinates.join('<br>');
}

window.addEventListener('wheel', function(e) {
  if (e.ctrlKey) {
    var zoom = e.deltaY < 0 ? 1.1 : 0.9;
    document.getElementById('map_paper').style.transform = `scale(${zoom})`;
  }
});



/*window.onload = function() {
    var x = 400; // replace with your x coordinate
    var y = 800; // replace with your y coordinate
    var cidade = document.getElementById('cidade');
    cidade.style.left = x + 'px';
    cidade.style.top = y + 'px';
  };
  [308, 817],
[422, 834],
[345, 742],
[488, 741],
[908, 641],
[842, 692],
[777, 725],
[760, 782],
[691, 722],
[596, 664],
[770, 579],
[993, 634],
[993, 585],
[984, 529],
[909, 493],
[1025, 485],
[1073, 548],
[1144, 659],
[1127, 574],
[1159, 500],
[1249, 517],
[1169, 717],
[1133, 761],
[1219, 752],
[1101, 778],
[1103, 383],
[1204, 224],
[1048, 237],
[995, 115],
[1192, 67],
[761, 265],
[870, 175],
[644, 295],
[629, 391],
[495, 435],
[329, 416],
[242, 363],
[218, 530],
[171, 607],
[453, 211],
[517, 260],
[599, 150],
[432, 88],
[199, 204],
[200, 38],
[45, 32],
[66, 254],
[280, 275]*/