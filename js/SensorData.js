// Construct timestamped x/y sensor data feeds from sensor test data files.
// Requires jQuery.

var SensorData = {
  
  sensors: [],

  // This is asynchronous. To get notified when loading finished:
  // listen to the ajax stop event, $(document).ajaxStop(function() { ... }
  loadAjaxData: function(dataFiles) {
    for (var i=0; i<dataFiles.length; i++) {
      $.get(dataFiles[i], function(data) {
        SensorData.sensors.push(SensorData._parseData(data));
      }, 'text');
    }
  },

  // Returns an object: { size, dates=[...], x=[...], y=[...] }
  // That object also has a few utility functions.
  buildRandomSensorFeed: function() {
    var sensorX = SensorData.sensors[Math.floor(Math.random() * SensorData.sensors.length)];
    var sensorY = SensorData._getValues(SensorData.sensors[Math.floor(Math.random() * SensorData.sensors.length)]);
    var _dates = SensorData._getKeys(sensorX);
    var _x = SensorData._getValues(sensorX);
    var _y = SensorData._getValues(sensorY);
    return {
      size: Math.min(_x.length, _y.length),
      dates: _dates,
      x: _x,
      y: _y,
      getValuesAt: function(idx) { 
        return {
          date: this.dates[idx],
          x: this.x[idx],
          y: this.y[idx],
        };
      },
    };
  },

  /**
   * Internals.
   */

  // Expects multiple lines of space-separated text of the form "id value"
  // Returns an object {id=>value}: a map of ids to values
  _parseData: function(strData) {
    var result = {};
    var lines = strData.split("\n");
    for (var i=0; i<lines.length; i++) {
      var line = lines[i];
      var columns = line.split("\t");
      result[columns[0]] = parseFloat(columns[1]);
    }
    return result;
  },

  _getKeys: function(obj) {
    var result = [];
    for (var key in obj) {
      result.push(key);
    }
    return result;
  },
  
  _getValues: function(obj) {
    var result = [];
    for (var key in obj) {
      result.push(obj[key]);
    }
    return result;
  }

};
