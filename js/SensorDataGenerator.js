// Construct timestamped x/y sensor data feeds from sensor test data files.
// Requires jQuery.

var SensorDataGenerator = {
  
  sensors: [],

  // This is asynchronous. To get notified when loading finished:
  // listen to the ajax stop event, $(document).one('ajaxStop', function() { ... }
  loadAjaxData: function(dataFiles) {
    for (var i=0; i<dataFiles.length; i++) {
      $.get(dataFiles[i], function(data) {
        SensorDataGenerator.sensors.push(SensorDataGenerator._parseData(data));
      }, 'text');
    }
  },

  // Returns an object: { name, size, dates=[...], x=[...], y=[...] }
  // That object also has a few utility functions.
  buildFeed: function() {
    var sensorX = SensorDataGenerator.sensors[
      Math.floor(Math.random() * 
      SensorDataGenerator.sensors.length)
    ];
    var sensorY = SensorDataGenerator._getValues(
        SensorDataGenerator.sensors[
          Math.floor(Math.random() * 
          SensorDataGenerator.sensors.length)
        ]);
    var _dates = SensorDataGenerator._getKeys(sensorX);
    var _x = SensorDataGenerator._getValues(sensorX);
    var _y = SensorDataGenerator._getValues(sensorY);
    return {
      name: ("Sensor " + Math.floor((Math.random()*1000)+1)),
      size: Math.min(_x.length, _y.length),
      dates: _dates,
      x: _x,
      y: _y,
      getValuesAt: function(idx) { 
        return {
          date: this.dates[idx],
          x: this.x[idx],
          y: this.y[idx],
          displacement: Math.sqrt(this.x[idx]*this.x[idx] + this.y[idx]*this.y[idx]),
        };
      },
      getValues: function() { 
        return this.getValuesAt(this.size-1);
      },
      getDisplacementAt: function(idx) {
        return this.getValuesAt(idx).displacement;
      },
      getDisplacement: function() { 
        return this.getDisplacementAt(this.size-1);
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
