// Draw a scrubber plot onto a canvas.

function ScrubberPlot(canvas, sensorPlot, infoNode, palette, options) {
  this.realCanvas = canvas;
  this.realCtx = canvas.getContext('2d');

   // double-buffering
  this.canvas = document.createElement('canvas');
  this.canvas.width = this.realCanvas.width;
  this.canvas.height = this.realCanvas.height;
  this.ctx = this.canvas.getContext('2d');

  this.sensorPlot = sensorPlot;
  this.infoNode = infoNode;
  this.palette = palette;
  this.options = options;

  this.feed = null;
  this.numEntries = null;
  this.isScrubbing = false;
}

ScrubberPlot.prototype.setData = function(feed, numEntries) {
  this.feed = feed;
  if (!numEntries) {
    this.numEntries = this.feed.size;
  } else {
    this.numEntries = Math.min(this.feed.size, numEntries);
  }

  // draw into off-screen buffer
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.drawBand();
  this.drawTicks();
}

ScrubberPlot.prototype.draw = function() {
  if (this.options.clear) {
    this.realCtx.clearRect(0, 0, this.realCanvas.width, this.realCanvas.height);
  }
  this.realCtx.drawImage(this.canvas, 0, 0);
};

ScrubberPlot.prototype.drawBand = function() {
  var firstIdx = this.feed.size - this.numEntries;
  var x1 = 0;
  for (var i=firstIdx+1; i<this.feed.size; i++) {
    var val = this.feed.getValuesAt(i);
    var displacement = Math.sqrt(val.x*val.x + val.y*val.y);
    var age = (i-firstIdx) / this.numEntries;
    var x2 = age * this.canvas.width;

    this.ctx.beginPath();
    this.ctx.rect(x1, 0, x2-x1, this.canvas.height);
    // ctx.noStroke();
    this.ctx.fillStyle = this.palette.getColour(displacement, age);
    this.ctx.fill();
    
    x1 = x2;
  }
};

ScrubberPlot.prototype.drawTicks = function() {
  var firstIdx = this.feed.size - this.numEntries;
  var y = this.canvas.height / 2;
  for (var i=firstIdx; i<this.feed.size; i+=12) {
    var x = (i-firstIdx) * this.canvas.width / this.numEntries;
    var h = 10;
    var w = 3;
    if ((i-firstIdx) % 24 != 0) {
      h = 5;
      w = 1;
    }

    this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
    this.ctx.beginPath();
    this.ctx.rect(x, 0, w, h);
    this.ctx.rect(x, this.canvas.height - h, w, h);
    this.ctx.fill();
  }
};

ScrubberPlot.prototype.drawHighlight = function(idx) {
  // var val = this.feed.getValuesAt(idx);
  var firstIdx = this.feed.size - this.numEntries;
  var x = (idx - firstIdx) / this.numEntries * this.canvas.width;
  this.realCtx.beginPath();
  this.realCtx.arc(x, this.canvas.height/2, 30, 0, 2*Math.PI);
  this.realCtx.fillStyle = 'rgba(255,255,255,1)'; 
  this.realCtx.fill();
};

ScrubberPlot.prototype.redrawAll = function() {
  this.sensorPlot.draw();
  this.draw();
}

// ==================
// = Event Handlers =
// ==================

ScrubberPlot.prototype._highlightEntry = function(idx) {
  idx = Math.max(0, Math.min(feed.size-1, idx));
  var val = this.feed.getValuesAt(idx);

  // fake the date
  // assuming hourly measurements, last measurement is at least 1h in the past.
  var oneHour = 1000*60*60;
  var oneDay = oneHour*24;
  var numDays = (this.feed.size + 1) / 24; 
  var firstDate = new Date(new Date().getTime() - numDays * oneDay);
  var timestamp = new Date(firstDate.getTime() + idx * oneHour);
  
  this.redrawAll();
  
  this.sensorPlot.drawHighlight(idx);
  this.drawHighlight(idx);
  
  $(this.infoNode).html(
    timestamp.format('yyyy-mm-dd HH:MM') + 
    " <strong>X</strong>=" + val.x.toFixed(2) + 
    " <strong>Y</strong>=" + val.y.toFixed(2) +
    " <strong>magnitude</strong>=" + val.displacement.toFixed(2));
}

ScrubberPlot.prototype._hideHighlightedEntry = function() {
  this.redrawAll();
  $(this.infoNode).html("&nbsp;");
}

ScrubberPlot.prototype._getFeedIndexAt = function(x, y) {
  return (this.feed.size-this.numEntries) + Math.round(x * this.numEntries / this.realCanvas.width);
};

ScrubberPlot.prototype._getIndex = function(e) {
  return this._getFeedIndexAt(e.pageX - $(this.realCanvas).offset().left, 0);
};

ScrubberPlot.prototype.initEventHooks = function() {
  scrubberPlot = this;
  // mouse events
  $(this.realCanvas).on('mousedown', function(e) {
    e.preventDefault();
    scrubberPlot.isScrubbing = true;
    scrubberPlot._highlightEntry(scrubberPlot._getIndex(e));
  });
  $(window).on('mousemove', function(e) {
    if (!scrubberPlot.isScrubbing) return;
    scrubberPlot._highlightEntry(scrubberPlot._getIndex(e));
  });
  $(window).on('mouseup', function(e) {
    if (!scrubberPlot.isScrubbing) return;
    scrubberPlot.isScrubbing = false;
    scrubberPlot._hideHighlightedEntry();
  });
  
  // touch events
  $(this.realCanvas).on('touchstart', function(e) {
    if (!e.originalEvent.changedTouches) return;
    e.preventDefault();
    scrubberPlot.isScrubbing = true;
    scrubberPlot._highlightEntry(scrubberPlot._getIndex(e.originalEvent.changedTouches[0]));
  });
  $(window).on('touchmove', function(e) {
    if (!e.originalEvent.changedTouches) return;
    if (!scrubberPlot.isScrubbing) return;
    scrubberPlot._highlightEntry(scrubberPlot._getIndex(e.originalEvent.changedTouches[0]));
  });
  $(window).on('touchend touchcancel touchleave', function(e) {
    if (!e.originalEvent.changedTouches) return;
    if (!scrubberPlot.isScrubbing) return;
    scrubberPlot.isScrubbing = false;
    scrubberPlot._hideHighlightedEntry();
  });
};
