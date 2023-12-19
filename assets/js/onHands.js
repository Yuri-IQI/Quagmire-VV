// https://codepen.io/jkasun/pen/QrLjXP

export function initResizeElement() {
  var popups = document.getElementsByClassName("resizable");
  var element = null;
  var startX, startY, startWidth, startHeight;
  var rKeyPressed = false;

  document.addEventListener('keydown', function(event) {
    if (event.key === 'r' || event.key === 'R') {
      rKeyPressed = true;
    }
  });

  document.addEventListener('keyup', function(event) {
    if (event.key === 'r' || event.key === 'R') {
      rKeyPressed = false;
    }
  });

  for (var i = 0; i < popups.length; i++) {
    var p = popups[i];

    var right = document.createElement("div");
    right.className = "resizer-right";
    p.appendChild(right);
    right.addEventListener("mousedown", initDrag, false);
    right.parentPopup = p;

    var bottom = document.createElement("div");
    bottom.className = "resizer-bottom";
    p.appendChild(bottom);
    bottom.addEventListener("mousedown", initDrag, false);
    bottom.parentPopup = p;

    var both = document.createElement("div");
    both.className = "resizer-both";
    p.appendChild(both);
    both.addEventListener("mousedown", initDrag, false);
    both.parentPopup = p;
  }

  function initDrag(e) {
    if (!rKeyPressed) return;

    element = this.parentPopup;

    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(
      document.defaultView.getComputedStyle(element).width,
      10
    );
    startHeight = parseInt(
      document.defaultView.getComputedStyle(element).height,
      10
    );
    document.documentElement.addEventListener("mousemove", doDrag, false);
    document.documentElement.addEventListener("mouseup", stopDrag, false);
  }

  function doDrag(e) {
    if (!rKeyPressed) return;

    element.style.width = startWidth + e.clientX - startX + "px";
    element.style.height = startHeight + e.clientY - startY + "px";
  }

  function stopDrag() {
    document.documentElement.removeEventListener("mousemove", doDrag, false);
    document.documentElement.removeEventListener("mouseup", stopDrag, false);
  }
}

export function initDragElement() {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  var popups = document.getElementsByClassName("resizable");
  var elmnt = null;
  var currentZIndex = 100; //TODO reset z index when a threshold is passed
  var shiftKeyPressed = false;

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Shift') {
      shiftKeyPressed = true;
    }
  });

  document.addEventListener('keyup', function(event) {
    if (event.key === 'Shift') {
      shiftKeyPressed = false;
    }
  });

  for (var i = 0; i < popups.length; i++) {
    var popup = popups[i];
    var header = getHeader(popup);

    popup.onmousedown = function() {
      this.style.zIndex = "" + ++currentZIndex;
    };

    if (header) {
      header.parentPopup = popup;
      header.onmousedown = dragMouseDown;
    }
  }

  function dragMouseDown(e) {
    if (!shiftKeyPressed) return;

    elmnt = this.parentPopup;
    elmnt.style.zIndex = "" + ++currentZIndex;

    e = e || window.event;
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;

    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    if (!shiftKeyPressed) return;

    if (!elmnt) {
      return;
    }

    e = e || window.event;
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }

  function getHeader(element) {
    var headerItems = element.getElementsByClassName("holdable");

    if (headerItems.length === 1) {
      return headerItems[0];
    }

    return null;
  }
}

//get map coordinates
/*var allCoordinates = [];
export function getCoordinates(event) {
    var iconsDiv = document.getElementById("icons");
    var rect = iconsDiv.getBoundingClientRect();
    var x = ((event.clientX - rect.left) / rect.width) * 100;
    var y = ((event.clientY - rect.top) / rect.height) * 100;
    var coordinates = "[" + x.toFixed(2) + "%, " + y.toFixed(2) + "%],";
    allCoordinates.push(coordinates);
    
    document.getElementById("coordinates").innerHTML = allCoordinates.join('<br>');
}*/