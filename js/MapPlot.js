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

  this.sensorArrays = null;
}

// sensorArrays: a list of sensor array records
// [ { name: <svg_id>, feeds: <list> }, ...]
MapPlot.prototype.setData = function(sensorArrays) {
  this.sensorArrays = sensorArrays;
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
    mapPlot.draw();
  }, "text");
};

MapPlot.prototype.draw = function() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.drawSensors();
};

MapPlot.prototype.drawSensors = function() {
  if (this.svgRoot==null) return;

  var mapPos = $(this.svgObj).position();
  for (var i=0; i<this.sensorArrays.length; i++) {
    var sensorArray = sensorArrays[i];
    var svgGroup = $('#' + sensorArray.name, this.svgRoot)[0];
    var svgSensors = $("path", svgGroup);
    for (var j=0; j<svgSensors.length; j++) {
      // console.log($(svgSensors[j]));
      var sensorRect = svgSensors[j].getBoundingClientRect();
      // var sensorBBox = svgSensors[j].getBBox();
      var x = sensorRect.left - mapPos.left + (sensorRect.width / 2);
      var y = sensorRect.top - mapPos.top + (sensorRect.height / 2);
      this.ctx.beginPath();
      this.ctx.arc(x, y, 10, 0, 2*Math.PI);
      this.ctx.fillStyle = 'rgba(0,255,255,0.5)'; 
      this.ctx.fill();
    }
  }
  // for (var i=0; i<this.feeds.length; i++) {
  //   var angle = (this.options.sensorAngles[i] + 90) * Math.PI*2 / 360;
  //   var x = this.x + Math.cos(angle) * (this.radius + 0);
  //   var y = this.y + Math.sin(angle) * (this.radius + 0);
  // 
  //   // fill
  //   var displacement = this.feeds[i].getDisplacement();
  //   var style = this.palette.getColour(displacement);
  // 
  //   this.ctx.beginPath();
  //   this.ctx.arc(x, y, this.options.sensorRadius, 0, 2*Math.PI);
  //   this.ctx.fillStyle = style; 
  //   this.ctx.lineWidth = 2;
  //   this.ctx.fill();
  // 
  //   // stroke
  //   this.ctx.beginPath();
  //   this.ctx.arc(x, y, this.options.sensorRadius, 0, 2*Math.PI);
  //   this.ctx.strokeStyle = "rgba(90,90,90,1)"; 
  //   this.ctx.lineWidth = 2;
  //   this.ctx.stroke();
  // }
};

MapPlot.prototype.drawHighlight = function(idx) {
  // for (var i=0; i<this.feeds.length; i++) {
  //   var angle = (this.options.sensorAngles[i] + 90) * Math.PI*2 / 360;
  //   this.displacementPlot.x = this.x + Math.cos(angle) * this.radius;
  //   this.displacementPlot.y = this.y + Math.sin(angle) * this.radius;
  //   this.displacementPlot.setData(this.feeds[i], this.numEntries);
  //   this.displacementPlot.drawHighlight(idx);
  // }
}

// ==================
// = Event Handlers =
// ==================

MapPlot.prototype._getArrayIndexAt = function(x, y) {
  // for (var i=0; i<this.feeds.length; i++) {
  //   var angle = (this.options.sensorAngles[i] + 90) * Math.PI*2 / 360;
  //   var fx = this.x + Math.cos(angle) * this.radius;
  //   var fy = this.y + Math.sin(angle) * this.radius;
  //   var dx = fx - x;
  //   var dy = fy - y;
  //   var dist = Math.sqrt(dx*dx + dy*dy);
  //   if (dist < this.options.sensorRadius * 4) {
  //     return i;
  //   }
  // }
  return null;
};

MapPlot.prototype._getIndex = function(e) {
  return this._getArrayIndexAt(
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
    var idx = mapPlot._getIndex(e);
    if (idx!=null) {
      showArrayview(mapPlot.arrays[idx]);
      // mapPlot.draw();
      mapPlot.drawHighlight(idx);
    }
  });
  
  // touch events
  $(this.canvas).on('touchstart', function(e) {
    if (!e.originalEvent.changedTouches) return;
    e.preventDefault();
    var idx = mapPlot._getIndex(e.originalEvent.changedTouches[0]);
    if (idx!=null) {
      showArrayview(mapPlot.arrays[idx]);
      // mapPlot.draw();
      mapPlot.drawHighlight(idx);
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