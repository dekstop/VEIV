// Draw a displacement plot onto a canvas.
// Requires jQuery.

// Options:
// - thresholds: [5, 10, 15, ...]
// - range: 20
function DisplacementPlot(canvas, palette, options) {
  this.realCanvas = canvas;
  this.realCtx = canvas.getContext('2d');

   // double-buffering
  this.canvas = document.createElement('canvas');
  this.canvas.width = this.realCanvas.width;
  this.canvas.height = this.realCanvas.height;
  this.ctx = this.canvas.getContext('2d');

  this.x = this.canvas.width / 2;
  this.y = this.canvas.height / 2;
  this.radius = Math.min(this.canvas.width / 2, this.canvas.height / 2) - 20;
  this.palette = jQuery.extend({}, palette);
  this.options = jQuery.extend({}, options);

  this.feed = null
  this.numEntries = null;
}

DisplacementPlot.prototype.setData = function(feed, numEntries) {
  this.feed = feed;
  if (!numEntries) {
    this.numEntries = this.feed.size;
  } else {
    this.numEntries = Math.min(this.feed.size, numEntries);
  }
  
  // draw into off-screen buffer
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  if (this.numEntries<2) return; // Nothing to draw.
  this.drawPlotOverrun(this.feed.getValues());
  this.drawThresholds();
  if (!this.options.simplified) {
    this.drawThresholdLabels();
  } 
  this.drawPlotDots();
  // if (!this.options.simplified) {
    this.drawPlotPath();
  // }
}

DisplacementPlot.prototype.draw = function() {
  if (this.options.clear) {
    this.realCtx.clearRect(0, 0, this.realCanvas.width, this.realCanvas.height);
  }
  this.realCtx.drawImage(this.canvas, 0, 0);
};

DisplacementPlot.prototype.drawThresholds = function() {
  for (var i=0; i<this.options.thresholds.length; i++) {
    var ratio = this.options.thresholds[i] / this.options.range;
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.radius*ratio, 0, 2*Math.PI);
    this.ctx.strokeStyle = "rgba(90,90,90,1)"; 
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }
};

DisplacementPlot.prototype.drawThresholdLabels = function() {
  for (var i=0; i<this.options.thresholds.length; i++) {
    var ratio = this.options.thresholds[i] / this.options.range;
    this.ctx.font="10px Helvetica";
    this.ctx.textAlign="center";
    this.ctx.fillStyle = "rgba(110,110,110,1)"; 
    this.ctx.fillText(this.options.thresholds[i] + "mm", this.x, this.y + this.radius*ratio - 8);
    this.ctx.fillText(this.options.thresholds[i] + "mm", this.x, this.y - this.radius*ratio + 14);
  }
};

DisplacementPlot.prototype.drawPlotDots = function() {
  var firstIdx = this.feed.size - this.numEntries;
  for (var i=firstIdx; i<this.feed.size; i++) {
    var val = this.feed.getValuesAt(i);
    var dx = this.project(val.x);
    var dy = this.project(val.y);

    var age = (i-firstIdx) / this.numEntries;
    var style = this.palette.getColour(val.displacement, age);

    this.ctx.beginPath();
    this.ctx.arc(this.x + dx, this.y + dy, this.options.dotRadius, 0, 2*Math.PI);
    this.ctx.fillStyle = style; 
    this.ctx.fill();
  }
};

DisplacementPlot.prototype.drawPlotPath = function() {
  var firstIdx = this.feed.size - this.numEntries;
  var val = this.feed.getValuesAt(firstIdx);
  var dx = this.project(val.x);
  var dy = this.project(val.y);

  for (var i=firstIdx+1; i<this.feed.size; i++) {
    this.ctx.beginPath();
    this.ctx.moveTo(this.x + dx, this.y + dy);
  
    val = this.feed.getValuesAt(i);
    dx = this.project(val.x);
    dy = this.project(val.y);

    var age = (i-firstIdx) / this.numEntries;
    // var a = 180 + Math.round(age*75);

    this.ctx.lineTo(this.x + dx, this.y + dy);
    // this.ctx.strokeStyle = "rgba("+a+","+a+","+a+",1)"; 
    this.ctx.strokeStyle = "rgba(255,255,255," + (0.2 + age*age*0.8) + ")"; 
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }
};

DisplacementPlot.prototype.drawPlotOverrun = function(val) {
  var displacement = Math.sqrt(val.x*val.x + val.y*val.y);
  if (displacement<this.options.range) {
    return;
  }

  var dx = this.project(val.x);
  var dy = this.project(val.y);

  var bearing = Math.atan2(dy, dx);
  var d = 2*Math.PI * 0.04; // 4% circumference on either side

  // larger circle
  this.ctx.beginPath();
  this.ctx.arc(this.x, this.y, this.radius + 10, bearing - d, bearing + d);
  this.ctx.strokeStyle = 'rgba(255,0,0,0.4)'; 
  this.ctx.lineWidth = 20;
  this.ctx.stroke();
};

// NOTE: this is *not* drawing into the off-screen buffer!
DisplacementPlot.prototype.drawHighlight = function(idx) {
  var val = this.feed.getValuesAt(idx)
  var dx = this.project(val.x);
  var dy = this.project(val.y);

  // larger circle
  this.realCtx.beginPath();
  this.realCtx.arc(this.x + dx, this.y + dy, 30, 0, 2*Math.PI);
  this.realCtx.fillStyle = 'rgba(255,255,255,0.5)'; 
  this.realCtx.fill();
  this.realCtx.strokeStyle = 'rgba(255,255,255,1)'; 
  this.realCtx.lineWidth = 5;
  this.realCtx.stroke();

  // center dot
  this.realCtx.beginPath();
  this.realCtx.arc(this.x + dx, this.y + dy, 5, 0, 2*Math.PI);
  this.realCtx.fillStyle = 'rgba(255,255,255,1)'; 
  this.realCtx.fill();
};

// Map a sensor value of [0..maxValue] onto a [0..mappedValue] range.
DisplacementPlot.prototype.map = function(value, maxValue, mappedValue) {
  return value / maxValue * mappedValue;
};

DisplacementPlot.prototype.project = function(value) {
  return this.map(value, this.options.range, this.radius);
};
