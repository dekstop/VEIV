// Construct timestamped x/y sensor data feeds from sensor test data files.
// TSV data format: (t, x1, y1, x2, y2, ...)
// Requires jQuery.

var SensorDataLoader = {
  
  sensorArrays: [],

  // dataFiles is a map: { name -> filename }
  // This is asynchronous. To get notified when loading finished:
  // listen to the ajax stop event, $(document).one('ajaxStop', function() { ... }
  loadAjaxData: function(dataFiles) {
    var arrayIds = SensorDataLoader._getKeys(dataFiles);
    for (var i=0; i<arrayIds.length; i++) {

      var callback = (function(arrayId) {
        return function(data) {
          SensorDataLoader.sensorArrays.push({
            name: arrayId,
            feeds: SensorDataLoader._formatFeeds(
              arrayId, 
              SensorDataLoader._parseData(data)),
          });
        }
      })(arrayIds[i]);

      $.get(dataFiles[arrayIds[i]], callback, 'text');
    }
  },
  
  getData: function() {
    return SensorDataLoader.sensorArrays;
  },
  
  _formatFeeds: function(arrayId, tsvData) {
    var columnIds = SensorDataLoader._getKeys(tsvData);
    var dataColumnIds = columnIds.slice(1); // all but the first

    // Basic checks
    if (dataColumnIds.length % 2 != 0) {
      console.log('Odd number of data columns for ' + arrayId + ', ignoring last column: ' + dataColumnIds[dataColumnIds.length-1]);
      dataColumnIds.pop();
    }
    
    // Convert
    var feeds = [];
    for (i=0; i<dataColumnIds.length/2; i++) {
      var _dates = tsvData[columnIds[0]];
      var _x = SensorDataLoader._parseFloats(tsvData[dataColumnIds[i*2]]);
      var _y = SensorDataLoader._parseFloats(tsvData[dataColumnIds[i*2+1]]);
      
      feeds.push({
        name: (arrayId + "-sensor" + ((i+1 < 10) ? '0' : '') + (i+1)),
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
      });
    }
    return feeds;
  },

  /**
   * Internals.
   */

  // TSV parser with header row.
  // Returns a record of { k1=<values>, k2=<values>, ... }
  _parseData: function(strData) {
    var data = {};
    var lines = strData.split("\n");
    var headers = lines[0].split("\t");
    $.each(headers, function(idx, k) { 
      data[k] = [];
    });
    for (var i=1; i<lines.length; i++) {
      var columns = lines[i].split("\t");
      $.each(headers, function(idx, k) { 
        data[k].push(columns[idx]);
      });
    }
    return data;
  },

  _parseFloats: function(_strings) {
    var result = [];
    $.each(_strings, function(idx, str) { 
      result.push(parseFloat(str));
    });
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
