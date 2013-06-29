// Produces a colour palette for sensor plots based on values and thresholds.

function Palette(options) {
  this.options = options;
}

// displacement: usually [0..range], can go beyond that
// age: relative to currently displayed period, [0..1]
Palette.prototype.getColour = function(displacement, age) {
  age = (typeof age !== 'undefined' ? age : 1.0);
  var thIdx = 0;
  while (displacement > this.options.thresholds[thIdx]) thIdx++;
  hue = this.options.hues[Math.min(thIdx, this.options.hues.length-1)];
  return "hsla(" +
    hue + "," + 
    // Math.round(age * 100) + "%," +
    "100%," +
    Math.round(40 + age * 30) + "%," +
    // "40%," +
    "1.0)";
};
