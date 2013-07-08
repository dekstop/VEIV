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
  this.mapPositions = {};
  this.selectedSensorArray = null;
  this.selectedFeed = null;
}

// sensorArrayData: a list of sensor array records
// [ { name: <svg_id>, feeds: <list> }, ...]
MapPlot.prototype.setData = function(sensorArrayData) {
  this.sensorArrayData = sensorArrayData;
}

MapPlot.prototype.selectSensorArray = function(sensorArray) {
  if (this.selectedSensorArray != sensorArray) {
    this.selectedFeed = null;
  }
  this.selectedSensorArray = sensorArray;
}

MapPlot.prototype.selectFeed = function(feed) {
  this.selectedFeed = feed;
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
    mapPlot.mapPositions = mapPlot._buildMapLayout();
    mapPlot.draw();
  }, "text");
};

// Called by initLayout once the map SVG is loaded.
// Determines locations of sensors and sensor arrays in the SVG.
MapPlot.prototype._buildMapLayout = function() {

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
    // sensorPositions[sensorArray.name] = {};

    // for every sensor in this array
    for (var j=0; j<sensorArray.feeds.length; j++) {
      var feed = sensorArray.feeds[j];
      var svgSensor = $('#' + feed.name, this.svgRoot)[0]; // find it on map
      sensorPositions[feed.name] = this._getMapPoint(svgSensor, mapOrigin);
    }
  }
  return {
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
    radius: Math.max(rect.width, rect.height) / 2 + 5,
  };
};

// Translate the screen bounds of an SVG object into canvas map coordinates.
// Accounts for scrolling offset.
MapPlot.prototype._getMapBounds = function(svgObject, mapOrigin) {
  var rect = svgObject.getBoundingClientRect();
  return {
    x1: rect.left - mapOrigin.left + window.scrollX - 20,
    y1: rect.top - mapOrigin.top + window.scrollY - 20,
    x2: rect.left - mapOrigin.left + window.scrollX + rect.width + 20,
    y2: rect.top - mapOrigin.top + window.scrollY + rect.height + 20,
  };
};

MapPlot.prototype.draw = function() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.drawSensors();
  this.drawHighlights();
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
        sensorBounds.radius, 
        0, 2*Math.PI);
      this.ctx.fillStyle = style; 
      // this.ctx.fillStyle = 'rgba(0,255,255,0.5)'; 
      this.ctx.fill();
    }
  }
};

MapPlot.prototype.drawHighlights = function() {
  if ((this.selectedSensorArray !== null) && (this.mapPositions.sensorArrays)) {
    var rect = this.mapPositions.sensorArrays[this.selectedSensorArray.name];
    this.ctx.strokeStyle = 'rgba(100,200,250,0.8)';
    this.ctx.lineWidth = (this.selectedFeed == null ? 8 : 2);
    this.ctx.beginPath();
    this.ctx.moveTo(rect.x1, rect.y1);
    this.ctx.lineTo(rect.x1, rect.y2);
    this.ctx.lineTo(rect.x2, rect.y2);
    this.ctx.lineTo(rect.x2, rect.y1);
    this.ctx.closePath();
    this.ctx.stroke();
  }
  
  if ((this.selectedFeed !== null) && (this.mapPositions.sensors)) {
    var pos = this.mapPositions.sensors[this.selectedFeed.name];
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, pos.radius * 3, 0, 2*Math.PI);
    this.ctx.strokeStyle = 'rgba(100,200,250,0.8)';
    this.ctx.lineWidth = 8;
    this.ctx.stroke();
  }
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

MapPlot.prototype._getFeedIndexAt = function(x, y) {
  for (var i=0; i< this.selectedSensorArray.feeds.length; i++) {
    var feed = this.selectedSensorArray.feeds[i];
    var pos = this.mapPositions.sensors[feed.name];
    if (Math.abs(pos.x - x) < pos.radius * 2 &&
      Math.abs(pos.y - y) < pos.radius * 2) {

      return i;
    }
  }
  return null;
};

MapPlot.prototype._getFeedIndex = function(e) {
  return this._getFeedIndexAt(
    e.pageX - $(this.canvas).offset().left,
    e.pageY - $(this.canvas).offset().top
  );
};

// Can be a mouse click or touch tap.
MapPlot.prototype._handleClickEvent = function(e) {
  var arrayIdx = mapPlot._getSensorArrayIndex(e);
  if (arrayIdx != null) {
    var sensorArray = mapPlot.sensorArrayData[arrayIdx];
    if (mapPlot.selectedSensorArray==null || // Is there a selected array?
      (mapPlot.selectedSensorArray.name != sensorArray.name)) { // Is this the same array?

      // Selected a different array
      showArrayview(mapPlot.sensorArrayData[arrayIdx]);
      mapPlot.selectSensorArray(mapPlot.sensorArrayData[arrayIdx]);
    } else {
      // In same array: refined selection: pick a sensor
      var feedIdx = mapPlot._getFeedIndex(e);
      if (feedIdx !== null) {
        var feed = mapPlot.selectedSensorArray.feeds[feedIdx];
        showSensorview(feed);
      }
    }
    mapPlot.draw();
  }
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
    mapPlot._handleClickEvent(e);
  });
  
  // touch events
  $(this.canvas).on('touchstart', function(e) {
    if (!e.originalEvent.changedTouches) return;
    e.preventDefault();
    mapPlot._handleClickEvent(e.originalEvent.changedTouches[0]);
  });
  $(window).on('touchmove', function(e) {
    if (!e.originalEvent.changedTouches) return;
  });
  $(window).on('touchend touchcancel touchleave', function(e) {
    if (!e.originalEvent.changedTouches) return;
  });
};