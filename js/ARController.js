// Controller for wikitude's image-based AR markers.

function ARController(options) {
  this.options = options;

  // Overlay images
  this.arImg = {};
  this.arImgD = {};
  var arController = this;
  $.each(this.options.trackedObjects, function(idx, objectId) {
    arController.arImg[objectId] = new AR.ImageResource(
      arController.options.overlayImageFile[objectId], 
      { 
        onLoaded: function(w, h){ }, 
        onError: function(){ alert('Error loading AR overlay image'); },
    });
    arController.arImgD[objectId] = new AR.ImageDrawable(
      arController.arImg[objectId], 
      arController.options.overlayImageHeight);
  });

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
        drawables: { cam: arController.arImgD[objectId] }, 
        onLoaded: function(){ arController.options.onLoaded(objectId) },
        onClick: function(){ arController.options.onClick(objectId) },
        onEnterFieldOfVision: function(){ arController.options.onEnterFieldOfVision(objectId) },
        onExitFieldOfVision: function(){ arController.options.onExitFieldOfVision(objectId) },
        onError: function(){ alert('Error loading trackable object ' + objectId) }, 
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
