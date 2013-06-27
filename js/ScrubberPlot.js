// Draw a scrubber plot onto a canvas.

function ScrubberPlot(canvas, palette, options) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.palette = palette;
  this.options = options;
}

ScrubberPlot.prototype.draw = function(feed, numEntries, highlightedEntryIdx) {
  var firstIdx = feed.size - numEntries;
  var x1 = 0;

  // colours
  for (var i=firstIdx+1; i<feed.size; i++) {
    var val = feed.getValuesAt(i);
    var displacement = Math.sqrt(val.x*val.x + val.y*val.y);
    var age = (i-firstIdx) / numEntries;
    var x2 = age * this.canvas.width;

    this.ctx.beginPath();
    this.ctx.rect(x1, 0, x2-x1, this.canvas.height);
    // ctx.noStroke();
    this.ctx.fillStyle = this.palette.getColour(displacement, age);
    this.ctx.fill();
    
    x1 = x2;
  }
  
  // highlight, or tick marks
  if (highlightedEntryIdx!=null) {
    var x = (highlightedEntryIdx - firstIdx) / numEntries * this.canvas.width;
    this.ctx.beginPath();
    this.ctx.arc(x, this.canvas.height/2, 30, 0, 2*Math.PI);
    this.ctx.fillStyle = 'rgba(255,255,255,1)'; 
    this.ctx.fill();
  }
  var y = this.canvas.height / 2;
  for (var i=firstIdx; i<feed.size; i+=12) {
    var x = (i-firstIdx) * this.canvas.width / numEntries;
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
