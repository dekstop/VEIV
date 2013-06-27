// Draw a displacement plot onto a canvas.
// Requires jQuery.

function DisplacementPlot(canvas, palette, options) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.radius = Math.min(canvas.width / 2, canvas.height / 2) - 20;
  this.palette = palette;
  this.options = options;
}

DisplacementPlot.prototype.draw = function(feed, numEntries, highlightedEntryIdx) {
  var x = this.canvas.width / 2;
  var y = this.canvas.height / 2;

  if (!numEntries) {
    numEntries = feed.size;
  } else {
    numEntries = Math.min(feed.size, numEntries);
  }
  if (numEntries<2) return; // Nothing to draw.

  // draw
  this.drawPlotOverrun(x, y, feed.getValuesAt(feed.size-1));
  this.drawThresholds(x, y);
  this.drawPlotDots(x, y, feed, numEntries);
  this.drawPlotPath(x, y, feed, numEntries);

  if (highlightedEntryIdx!=null) {
    this.drawPlotHighlight(x, y, feed.getValuesAt(highlightedEntryIdx));
  }
};

DisplacementPlot.prototype.drawThresholds = function(x, y) {
  for (var i=0; i<this.options.thresholds.length; i++) {
    var ratio = this.options.thresholds[i] / this.options.range;

    // circle
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.radius*ratio, 0, 2*Math.PI);
    this.ctx.strokeStyle = "rgba(90,90,90,1)"; 
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // label
    this.ctx.font="10px Helvetica";
    this.ctx.textAlign="center";
    this.ctx.fillStyle = "rgba(110,110,110,1)"; 
    this.ctx.fillText(this.options.thresholds[i] + "mm", x, y + this.radius*ratio - 8);
    this.ctx.fillText(this.options.thresholds[i] + "mm", x, y - this.radius*ratio + 14);
  }
};

DisplacementPlot.prototype.drawPlotDots = function(x, y, feed, numEntries) {
  var firstIdx = feed.size - numEntries;
  for (var i=firstIdx; i<feed.size; i++) {
    var val = feed.getValuesAt(i);
    var dx = this.project(val.x);
    var dy = this.project(val.y);

    var displacement = Math.sqrt(val.x*val.x + val.y*val.y);
    var age = (i-firstIdx) / numEntries;
    var style = this.palette.getColour(displacement, age);

    this.ctx.beginPath();
    this.ctx.arc(x + dx, y + dy, 10, 0, 2*Math.PI);
    this.ctx.fillStyle = style; 
    this.ctx.fill();
  }
};

DisplacementPlot.prototype.drawPlotPath = function(x, y, feed, numEntries) {
  var firstIdx = feed.size - numEntries;
  var val = feed.getValuesAt(firstIdx);
  var dx = this.project(val.x);
  var dy = this.project(val.y);

  for (var i=firstIdx+1; i<feed.size; i++) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + dx, y + dy);
  
    val = feed.getValuesAt(i);
    dx = this.project(val.x);
    dy = this.project(val.y);

    var age = (i-firstIdx) / numEntries;
    // var a = 180 + Math.round(age*75);

    this.ctx.lineTo(x + dx, y + dy);
    // this.ctx.strokeStyle = "rgba("+a+","+a+","+a+",1)"; 
    this.ctx.strokeStyle = "rgba(255,255,255," + (0.2 + age*age*0.8) + ")"; 
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }
};

DisplacementPlot.prototype.drawPlotHighlight = function(x, y, val) {
  var dx = this.project(val.x);
  var dy = this.project(val.y);

  // larger circle
  this.ctx.beginPath();
  this.ctx.arc(x + dx, y + dy, 30, 0, 2*Math.PI);
  this.ctx.fillStyle = 'rgba(255,255,255,0.5)'; 
  this.ctx.fill();
  this.ctx.strokeStyle = 'rgba(255,255,255,1)'; 
  this.ctx.lineWidth = 5;
  this.ctx.stroke();

  // center dot
  this.ctx.beginPath();
  this.ctx.arc(x + dx, y + dy, 5, 0, 2*Math.PI);
  this.ctx.fillStyle = 'rgba(255,255,255,1)'; 
  this.ctx.fill();
};

DisplacementPlot.prototype.drawPlotOverrun = function(x, y, val) {
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
  this.ctx.arc(x, y, this.radius + 10, bearing - d, bearing + d);
  this.ctx.strokeStyle = 'rgba(255,0,0,0.4)'; 
  this.ctx.lineWidth = 20;
  this.ctx.stroke();
};

// Map a sensor value of [0..maxValue] onto a [0..mappedValue] range.
DisplacementPlot.prototype.map = function(value, maxValue, mappedValue) {
  return value / maxValue * mappedValue;
};

DisplacementPlot.prototype.project = function(value) {
  return this.map(value, this.options.range, this.radius);
};
