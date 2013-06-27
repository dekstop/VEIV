// Draw timeseries data onto a canvas, bounded by a rectangle, and normalised.

function TimeseriesPlot(canvas) {
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
}

TimeseriesPlot.prototype.draw = function(data, x1, y1, x2, y2) {
  var minValue = Math.min.apply(null, data);
  var maxValue = Math.max.apply(null, data);
  var dataRange = maxValue - minValue;
  var width = x2 - x1;
  var height = y2 - y1;
  this.ctx.beginPath();
  this.ctx.moveTo(x1, y1 + height/2.0);
  for (var i=0; i<data.length; i++) {
    this.ctx.lineTo(
        x1 + width * 1.0 * i / data.length, 
        y1 + height - ((data[i] - minValue) / dataRange * height));
  }
  this.ctx.strokeStyle = "rgba(255,255,255,1)"; 
  this.ctx.lineWidth = 1;
  this.ctx.stroke();
};
