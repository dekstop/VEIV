// Controller for wikitude's image-based AR markers.

function ARController(options) {
  this.options = options;

  // Overlay image
  this.arImg = new AR.ImageResource(this.options.overlayImageFile, {
    onLoaded: function(w, h){ },
    onError: function(){ alert('Error loading AR overlay image'); },
  });
  this.arImgD = new AR.ImageDrawable(this.arImg, this.options.overlayImageHeight);

  this.tracker = null;
  this.trackableObjects = null;
}

ARController.prototype.isTracking = function() {
  return (this.tracker != null && this.tracker.enabled);
};

// Only activate on request, to reduce processing power
ARController.prototype.startTracking = function() {
  // Tracker
  this.tracker = new AR.Tracker(this.options.trackerDataSetPath, {
    onLoaded: function() { },
    onDisabled: function() { },
    onError: function(){ alert("Error loading tracker"); }
  });
  
  // Tracked objects
  this.trackableObjects = [];
  var arController = this;
  $.each(this.options.trackedObjects, function(idx, value) {
    var trackable2DObject = (function() {
      var objectId = value;
      return new AR.Trackable2DObject(arController.tracker, objectId, { 
        drawables: { cam: arController.arImgD }, 
        onLoaded: arController.options.onLoaded(),
        onClick: arController.options.onClick(objectId),
        onEnterFieldOfVision: arController.options.onEnterFieldOfVision(objectId),
        onExitFieldOfVision: arController.options.onExitFieldOfVision(objectId),
        onError: function(){ alert('Error loading trackable object ' + objectId); },
      });
    })();
    arController.trackableObjects.push(trackable2DObject);
  });
};

// Cleanup, to reduce processing power
// This can be called repeatedly.
ARController.prototype.stopTracking = function() {
  if (this.tracker !== null) {
    this.tracker.destroy();
    this.tracker = null;
    this.trackableObjects = null;
  }
};

ARController.prototype.getColour = function(displacement, age) {
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
