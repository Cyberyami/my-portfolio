(function(window){
  var DitherEngine = {};

  function toGray(r,g,b){
    return 0.2126*r + 0.7152*g + 0.0722*b;
  }

  function cloneImageData(img){
    return new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
  }

  function nearest(imgData, threshold){
    var out = cloneImageData(imgData);
    var d = out.data;
    for(var i=0;i<d.length;i+=4){
      var g = toGray(d[i], d[i+1], d[i+2]);
      var v = g < threshold ? 0 : 255;
      d[i]=d[i+1]=d[i+2]=v;
      d[i+3]=255;
    }
    return out;
  }

  function errorDiffuse(imgData, threshold, kernel){
    var w = imgData.width, h = imgData.height;
    var gray = new Float32Array(w*h);
    var inData = imgData.data;
    for(var y=0;y<h;y++){
      for(var x=0;x<w;x++){
        var i = (y*w + x)*4;
        gray[y*w + x] = toGray(inData[i], inData[i+1], inData[i+2]);
      }
    }

    var out = new ImageData(w,h);
    var outData = out.data;

    for(var y=0;y<h;y++){
      for(var x=0;x<w;x++){
        var idx = y*w + x;
        var oldVal = gray[idx];
        var newVal = oldVal < threshold ? 0 : 255;
        var err = oldVal - newVal;
        var i4 = idx*4;
        outData[i4] = outData[i4+1] = outData[i4+2] = newVal;
        outData[i4+3] = 255;
        if(err===0) continue;
        for(var k=0;k<kernel.length;k++){
          var nx = x + kernel[k].x;
          var ny = y + kernel[k].y;
          if(nx<0||ny<0||nx>=w||ny>=h) continue;
          gray[ny*w + nx] += err * kernel[k].weight;
        }
      }
    }
    return out;
  }

  function floyd(imgData, threshold){
    var kernel = [
      {x:1,y:0,weight:7/16},
      {x:-1,y:1,weight:3/16},
      {x:0,y:1,weight:5/16},
      {x:1,y:1,weight:1/16}
    ];
    return errorDiffuse(imgData, threshold, kernel);
  }

  function atkinson(imgData, threshold){
    var kernel = [
      {x:1,y:0,weight:1/8},
      {x:2,y:0,weight:1/8},
      {x:-1,y:1,weight:1/8},
      {x:0,y:1,weight:1/8},
      {x:1,y:1,weight:1/8},
      {x:0,y:2,weight:1/8}
    ];
    return errorDiffuse(imgData, threshold, kernel);
  }

  function jarvis(imgData, threshold){
    var wsum = 48;
    var kernel = [
      {x:1,y:0,weight:7/wsum}, {x:2,y:0,weight:5/wsum},
      {x:-2,y:1,weight:3/wsum}, {x:-1,y:1,weight:5/wsum}, {x:0,y:1,weight:7/wsum}, {x:1,y:1,weight:5/wsum}, {x:2,y:1,weight:3/wsum},
      {x:-2,y:2,weight:1/wsum}, {x:-1,y:2,weight:3/wsum}, {x:0,y:2,weight:5/wsum}, {x:1,y:2,weight:3/wsum}, {x:2,y:2,weight:1/wsum}
    ];
    return errorDiffuse(imgData, threshold, kernel);
  }

  function stucki(imgData, threshold){
    var wsum = 42;
    var kernel = [
      {x:1,y:0,weight:8/wsum}, {x:2,y:0,weight:4/wsum},
      {x:-2,y:1,weight:2/wsum}, {x:-1,y:1,weight:4/wsum}, {x:0,y:1,weight:8/wsum}, {x:1,y:1,weight:4/wsum}, {x:2,y:1,weight:2/wsum},
      {x:-2,y:2,weight:1/wsum}, {x:-1,y:2,weight:2/wsum}, {x:0,y:2,weight:4/wsum}, {x:1,y:2,weight:2/wsum}, {x:2,y:2,weight:1/wsum}
    ];
    return errorDiffuse(imgData, threshold, kernel);
  }

  var bayer2 = [ [0,2],[3,1] ];
  var bayer4 = [
    [0,8,2,10],
    [12,4,14,6],
    [3,11,1,9],
    [15,7,13,5]
  ];
  var bayer8 = [
    [0,32,8,40,2,34,10,42],
    [48,16,56,24,50,18,58,26],
    [12,44,4,36,14,46,6,38],
    [60,28,52,20,62,30,54,22],
    [3,35,11,43,1,33,9,41],
    [51,19,59,27,49,17,57,25],
    [15,47,7,39,13,45,5,37],
    [63,31,55,23,61,29,53,21]
  ];

  var clustered4 = [
    [12,8,10,11],
    [14,6,9,7],
    [13,3,1,0],
    [15,5,2,4]
  ];

  function ordered(imgData, threshold, matrix){
    var w = imgData.width, h = imgData.height;
    var out = cloneImageData(imgData);
    var d = out.data;
    var n = matrix.length;
    for(var y=0;y<h;y++){
      for(var x=0;x<w;x++){
        var i = (y*w + x)*4;
        var g = toGray(d[i], d[i+1], d[i+2]);
        var mval = matrix[y % n][x % n];
        var mth = (mval + 0.5) / (n*n);
        var tnorm = threshold / 255;
        var v = (g/255) < (mth * tnorm) ? 0 : 255;
        d[i]=d[i+1]=d[i+2]=v;
        d[i+3]=255;
      }
    }
    return out;
  }

  function clustered(imgData, threshold){
    return ordered(imgData, threshold, clustered4);
  }

  function bayer(imgData, threshold, size){
    if(size===2) return ordered(imgData, threshold, bayer2);
    if(size===4) return ordered(imgData, threshold, bayer4);
    return ordered(imgData, threshold, bayer8);
  }

  function randomDither(imgData, threshold){
    var out = cloneImageData(imgData);
    var d = out.data;
    for(var i=0;i<d.length;i+=4){
      var g = toGray(d[i], d[i+1], d[i+2]);
      var rnd = Math.random();
      var v = (g/255) < (rnd * (threshold/255)) ? 0 : 255;
      d[i]=d[i+1]=d[i+2]=v;
      d[i+3]=255;
    }
    return out;
  }

  DitherEngine.apply = function(imgData, algorithm, options){
    options = options || {};
    var threshold = ('threshold' in options) ? options.threshold : 128;
    switch(algorithm){
      case 'nearest': return nearest(imgData, threshold);
      case 'floyd': return floyd(imgData, threshold);
      case 'atkinson': return atkinson(imgData, threshold);
      case 'jarvis': return jarvis(imgData, threshold);
      case 'stucki': return stucki(imgData, threshold);
      case 'bayer2': return bayer(imgData, threshold, 2);
      case 'bayer4': return bayer(imgData, threshold, 4);
      case 'bayer8': return bayer(imgData, threshold, 8);
      case 'cluster4': return clustered(imgData, threshold);
      case 'random': return randomDither(imgData, threshold);
      default: return nearest(imgData, threshold);
    }
  };

  window.DitherEngine = DitherEngine;
})(window);
