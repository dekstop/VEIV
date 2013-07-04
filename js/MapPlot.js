// Draw a site map onto a canvas, with an SVG basemap.
//
// Site data is a nested structure of:
// - a list of sensor arrays, each with:
//   - a list of sensors, each with:
//     - sensor history data
//
// Requires jQuery.

// Options:
// - ...
function MapPlot(svgObj, canvas, palette, options) {
  this.svgObj = svgObj;
  this.svgRoot = null; // Determined once the SVG has been loaded (in initLayout)
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.palette = jQuery.extend({}, palette);
  this.options = jQuery.extend({}, options);

  this.sensorArrayData = null;
  this.mapPositions = null;
}

// sensorArrayData: a list of sensor array records
// [ { name: <svg_id>, feeds: <list> }, ...]
MapPlot.prototype.setData = function(sensorArrayData) {
  this.sensorArrayData = sensorArrayData;
}

// Call when DOM is ready
MapPlot.prototype.initLayout = function() {

  // Move canvas on top of SVG
  $(this.canvas).css({
      "position": "absolute", 
      "top": $(this.svgObj).offset().top + "px",
      "left": $(this.svgObj).offset().left + "px",
  });

  // Load basemap
  mapPlot = this;
  $.get(this.options.mapSvgFile, {}, function(res) {
    $(mapPlot.svgObj).html(res);
    mapPlot.svgRoot = $(mapPlot.svgObj).children()[0];
    mapPlot._updateSensorArrayLayout();
    mapPlot.draw();
  }, "text");
};

// Called by initLayout once the map SVG is loaded.
MapPlot.prototype._updateSensorArrayLayout = function() {

  // TODO: is "this" now a MapPlot object, or a "res" from caller?
  if (this.svgRoot==null) return;
  var sensorArrayPositions = {}; // array_id -> {x1,y1,x2,y2}
  var sensorPositions = {}; // array_id -> sensor_id -> {x1,y1,radius}
  var mapOrigin = $(this.svgObj).position(); // screen position of map SVG

  // for every sensor array in our data
  for (var i=0; i<this.sensorArrayData.length; i++) {
    var sensorArray = this.sensorArrayData[i]; 
    var svgGroup = $('#' + sensorArray.name, this.svgRoot)[0]; // find it on map
    sensorArrayPositions[sensorArray.name] = this._getMapBounds(svgGroup, mapOrigin);
    sensorPositions[sensorArray.name] = {};

    // for every sensor in this array
    for (var j=0; j<sensorArray.feeds.length; j++) {
      var feed = sensorArray.feeds[j];
      var svgSensor = $('#' + feed.name, this.svgRoot)[0]; // find it on map
      sensorPositions[feed.name] = this._getMapPoint(svgSensor, mapOrigin);
    }
  }
  this.mapPositions = {
    sensorArrays: sensorArrayPositions,
    sensors: sensorPositions,
  };
};

// Translate the screen position of an SVG object into canvas map coordinates.
// Accounts for scrolling offset.
MapPlot.prototype._getMapPoint = function(svgObject, mapOrigin) {
  var rect = svgObject.getBoundingClientRect();
  return {
    x: rect.left - mapOrigin.left + window.scrollX + (rect.width / 2),
    y: rect.top - mapOrigin.top + window.scrollY + (rect.height / 2),
    radius: Math.max(rect.width, rect.height) / 2,
  };
};

// Translate the screen bounds of an SVG object into canvas map coordinates.
// Accounts for scrolling offset.
MapPlot.prototype._getMapBounds = function(svgObject, mapOrigin) {
  var rect = svgObject.getBoundingClientRect();
  return {
    x1: rect.left - mapOrigin.left + window.scrollX,
    y1: rect.top - mapOrigin.top + window.scrollY,
    x2: rect.left - mapOrigin.left + window.scrollX + rect.width,
    y2: rect.top - mapOrigin.top + window.scrollY + rect.height,
  };
};

MapPlot.prototype.draw = function() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.drawSensors();
};

MapPlot.prototype.drawSensors = function() {
  if (this.svgRoot==null || this.mapPositions==null) return;
  
  // for every sensor array in our data
  for (var i=0; i<this.sensorArrayData.length; i++) {
    var sensorArray = this.sensorArrayData[i]; 
    var sensorArrayBounds = this.mapPositions.sensorArrays[sensorArray.name];

    // for every sensor in this array
    for (var j=0; j<sensorArray.feeds.length; j++) {
      var feed = sensorArray.feeds[j];
      var displacement = feed.getDisplacement();
      var style = this.palette.getColour(displacement);
      var sensorBounds = this.mapPositions.sensors[feed.name];

      this.ctx.beginPath();
      this.ctx.arc(
        sensorBounds.x, sensorBounds.y, 
        sensorBounds.radius + 5, 
        0, 2*Math.PI);
      this.ctx.fillStyle = style; 
      // this.ctx.fillStyle = 'rgba(0,255,255,0.5)'; 
      this.ctx.fill();
    }
  }
};

MapPlot.prototype.drawHighlight = function(sensorArray) {
  var rect = this.mapPositions.sensorArrays[sensorArray.name];
  this.ctx.strokeStyle = 'rgba(100,200,250,0.8)';
  this.ctx.lineWidth = 4;
  this.ctx.beginPath();
  this.ctx.moveTo(rect.x1 - 10, rect.y1 - 10);
  this.ctx.lineTo(rect.x1 - 10, rect.y2 + 10);
  this.ctx.lineTo(rect.x2 + 10, rect.y2 + 10);
  this.ctx.lineTo(rect.x2 + 10, rect.y1 - 10);
  this.ctx.closePath();
  this.ctx.stroke();
}

// ==================
// = Event Handlers =
// ==================

MapPlot.prototype._getSensorArrayIndexAt = function(x, y) {
  for (var i=0; i< this.sensorArrayData.length; i++) {
    var sensorArray = this.sensorArrayData[i];
    var rect = this.mapPositions.sensorArrays[sensorArray.name];
    if (rect.x1 <= x && x <= rect.x2 && 
      rect.y1 <= y && y <= rect.y2) {

      return i;
    }
  }
  return null;
};

MapPlot.prototype._getSensorArrayIndex = function(e) {
  return this._getSensorArrayIndexAt(
    e.pageX - $(this.canvas).offset().left,
    e.pageY - $(this.canvas).offset().top
  );
};

MapPlot.prototype.initEventHooks = function() {
  mapPlot = this;
  // mouse events
  $(this.canvas).on('mousedown', function(e) {
    e.preventDefault();
  });
  $(window).on('mousemove', function(e) {
  });
  $(window).on('mouseup', function(e) {
  });
  $(this.canvas).on('click', function(e) {
    var idx = mapPlot._getSensorArrayIndex(e);
    if (idx!=null) {
      showArrayview(mapPlot.sensorArrayData[idx]);
      mapPlot.draw();
      mapPlot.drawHighlight(mapPlot.sensorArrayData[idx]);
    }
  });
  
  // touch events
  $(this.canvas).on('touchstart', function(e) {
    if (!e.originalEvent.changedTouches) return;
    e.preventDefault();
    var idx = mapPlot._getSensorArrayIndex(e.originalEvent.changedTouches[0]);
    if (idx!=null) {
      showArrayview(mapPlot.sensorArrayData[idx]);
      mapPlot.draw();
      mapPlot.drawHighlight(mapPlot.sensorArrayData[idx]);
    }
    // e.originalEvent.changedTouches[0]
  });
  $(window).on('touchmove', function(e) {
    if (!e.originalEvent.changedTouches) return;
    // e.originalEvent.changedTouches[0]
  });
  $(window).on('touchend touchcancel touchleave', function(e) {
    if (!e.originalEvent.changedTouches) return;
  });
};