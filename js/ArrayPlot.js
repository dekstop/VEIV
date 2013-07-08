// Draw an array overview plot onto a canvas.
// Requires jQuery.

// Options:
// - sensorAngles: array of angles at which sensors are placed.
// - sensorRadius: 10 (pixels)
// - sensorOptions: cf DisplacementPlot.js
// - ...
function ArrayPlot(canvas, palette, options) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.x = this.canvas.width / 2;
  this.y = this.canvas.height / 2;
  this.radius = Math.min(canvas.width / 2.2, canvas.height / 2.2) - 20;
  this.palette = jQuery.extend({}, palette);
  this.options = jQuery.extend({}, options);

  this.feeds = null;
  this.numEntries = null;
  
  this.displacementPlot = new DisplacementPlot(canvas, palette, jQuery.extend({}, options.sensorOptions));
  this.displacementPlot.radius = this.options.plotRadius;
  this.displacementPlot.options.clear = false;
  this.displacementPlot.options.simplified = true;
  this.displacementPlot.options.dotRadius = this.options.sensorRadius;
}

ArrayPlot.prototype.setData = function(feeds, numEntries) {
  this.feeds = feeds;
  this.numEntries = numEntries;
}

// feeds is an array of 7 feeds (will be drawn at sensorAngles)
ArrayPlot.prototype.draw = function() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.drawArray();
  // this.drawSensors();
  this.drawSensordata();
  // Quick hack to generate empty array plot.
  // var canvas = document.getElementById('arrayplotCanvas');
  // var infoNode = document.getElementById('arrayPanel');
  // var img = document.createElement('img');
  // img.src = canvas.toDataURL('image/png');
  // infoNode.appendChild(img);
  
};

ArrayPlot.prototype.drawArray = function() {
  this.ctx.beginPath();
  this.ctx.arc(this.x, this.y, this.radius, 0.7*Math.PI, 0.3*Math.PI);
  this.ctx.strokeStyle = "rgba(90,90,90,0.5)"; 
  this.ctx.lineWidth = 10;
  this.ctx.stroke();
};

ArrayPlot.prototype.drawSensors = function() {
  for (var i=0; i<this.feeds.length; i++) {
    var angle = (this.options.sensorAngles[i] + 90 + 45/2) * Math.PI*2 / 360;
    var x = this.x + Math.cos(angle) * (this.radius + 0);
    var y = this.y + Math.sin(angle) * (this.radius + 0);

    // fill
    var displacement = this.feeds[i].getDisplacement();
    var style = this.palette.getColour(displacement);

    this.ctx.beginPath();
    this.ctx.arc(x, y, this.options.sensorRadius, 0, 2*Math.PI);
    this.ctx.fillStyle = style; 
    this.ctx.lineWidth = 2;
    this.ctx.fill();

    // stroke
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.options.sensorRadius * 2, 0, 2*Math.PI);
    this.ctx.strokeStyle = "rgba(90,90,90,1)"; 
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }
};

ArrayPlot.prototype.drawSensordata = function() {
  for (var i=0; i<this.feeds.length; i++) {
    var angle = (this.options.sensorAngles[i] + 90 + 45/2) * Math.PI*2 / 360;
    this.displacementPlot.x = this.x + Math.cos(angle) * this.radius;
    this.displacementPlot.y = this.y + Math.sin(angle) * this.radius;
    this.displacementPlot.setData(this.feeds[i], this.numEntries);
    this.displacementPlot.draw();
  }
};

// ArrayPlot.prototype.drawHighlight = function(idx) {
//   for (var i=0; i<this.feeds.length; i++) {
//     var angle = (this.options.sensorAngles[i] + 90 + 45/2) * Math.PI*2 / 360;
//     this.displacementPlot.x = this.x + Math.cos(angle) * this.radius;
//     this.displacementPlot.y = this.y + Math.sin(angle) * this.radius;
//     this.displacementPlot.setData(this.feeds[i], this.numEntries);
//     this.displacementPlot.drawHighlight(idx);
//   }
// }

// ==================
// = Event Handlers =
// ==================

ArrayPlot.prototype._getFeedIndexAt = function(x, y) {
  for (var i=0; i<this.feeds.length; i++) {
    var angle = (this.options.sensorAngles[i] + 90 + 45/2) * Math.PI*2 / 360;
    var fx = this.x + Math.cos(angle) * this.radius;
    var fy = this.y + Math.sin(angle) * this.radius;
    var dx = fx - x;
    var dy = fy - y;
    var dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < this.options.plotRadius) {
      return i;
    }
  }
  return null;
};

ArrayPlot.prototype._getIndex = function(e) {
  return this._getFeedIndexAt(
    e.pageX - $(this.canvas).offset().left,
    e.pageY - $(this.canvas).offset().top
  );
};

ArrayPlot.prototype.initEventHooks = function() {
  arrayPlot = this;
  // mouse events
  $(this.canvas).on('mousedown', function(e) {
    e.preventDefault();
  });
  $(window).on('mousemove', function(e) {
  });
  $(window).on('mouseup', function(e) {
  });
  $(this.canvas).on('click', function(e) {
    var idx = arrayPlot._getIndex(e);
    if (idx!=null) {
      showSensorview(arrayPlot.feeds[idx]);
    }
  });
  
  // touch events
  $(this.canvas).on('touchstart', function(e) {
    if (!e.originalEvent.changedTouches) return;
    e.preventDefault();
    var idx = arrayPlot._getIndex(e.originalEvent.changedTouches[0]);
    if (idx!=null) {
      showSensorview(arrayPlot.feeds[idx]);
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