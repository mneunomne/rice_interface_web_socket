const settings = {
  //page
  stream_width: 1440,
  python_width: 1080,
  display_width: 1440,
  display_height: 2560,
  animation: true,
  between_delay: 1000,
  fadeout_duration: 4000,
  animation_duration: 2000,
  typing_speed: 50,
  sequence: true,
  message_display_time: 30 * 1000,
  // show everything at once or in sequence
  fastMode: false // testing
  // TODO: specify different colors
}

var has_prediction = false
var last_stored_data = false

var has_displayed_layered = false

if (settings.fastMode) {
  settings.fadeout_duration = 100;
  settings.animation_duration = 100;
  settings.fadeout_duration = 100;
  settings.message_display_time = 2 * 1000;
}

settings.ratio = settings.stream_width / settings.python_width;

var messageInterval

const dbug = true;
let state = "idle"; // idle, processing, predict
let svg;
let timer;
// helpers
const lineGenerator = d3.line();
let typeWriter;

/****** FUNCTIONS ********/
const resize = function () {
  $(".wrapper").width = $(".wrapper").height = settings.display_width;
  $("#stream").width = $("#stream").height = settings.display_width;
}

const initSvgCanvas = function (w, h) {
  svg = d3.select("#overlay").append("svg")
    .attr("width", w)
    .attr("height", h)
    .attr("id", "svg");
  return svg;
}

const mode = function (m) {
  state = m;
  dbug && console.log("change state to:", state);
  clearTimeout(timer); // clear old timer once mode is changed
  if (m == "predict") {
    dbug && console.log("set timer", settings.message_display_time)
    timer = setTimeout(function () {
      dbug && console.log("timeout")
      clear();
      $("#stream").fadeIn();
      mode("idle");
    }, settings.message_display_time)
  }

}

const clear = function () {
  if (messageInterval) clearInterval(messageInterval)
  has_prediction = false
  has_displayed_layered = false
  last_stored_data = false
  dbug && console.log("clear")
  $("#message").text("").fadeOut();
  $("#category").text("").fadeOut();
  $("svg").html("").fadeOut();
}

const demo = function () {
  dbug && console.log("test: parse from json");
  mode("processing");
  $.getJSON("data/layers.json", function (data) {
    // const c = jQuery.parseJSON(data);
    interpreteData(data)
  });
}

const showPrediction = function (title, text) {
  has_prediction = true
  if (last_stored_data) {
    interpreteData(last_stored_data)
  }
  var category = findCategory(title)
  console.log("category", category)
  messageInterval = setInterval(() => {
    renderMessage(title + ": "+ category.name);
  }, 3000)
}

const showLayers = function (data) {
  if (has_prediction) {
    interpreteData(data)
  } else {
    last_stored_data = data
  }
}

const interpreteData = function (data) {
  if (has_displayed_layered) return 
  $("svg").fadeIn();
  last_stored_data = false
  has_displayed_layered = true
  dbug && console.log("interpreteData")
  if (settings.sequence) {
    // grain_contours -> box -> island_contours -> circle
    obj = parseData(data);
    //TODO: improve this callback hell lol
    renderContour(obj.outer_contour.data, "grain_contours", () => {
      renderCircles(obj.non_intersecting_islands.data,  () => {
        renderLines(obj.lines_horizontal.data, () => {
          renderLines(obj.lines_vertical.data, () => {
            renderEmbrio(obj.embrio_circle.data,  () => {

            })
          })
        })
      })
    });
    ;

  } else {
    // simutanous
    for (var i = 0; i < data.length; i++) {
      const layer = data[i];
      dbug && console.log(layer.name, layer.type);
      if (layer.type == "contours") renderContour(layer.data, layer.name);
      else if (layer.type == "circle") renderCircles(layer.data);
      else if (layer.type == "rect") (layer.data);
    }
  }
}

/*
      renderRect(obj.bounding_box.data, function(){
        renderContour(obj.island_contours.data, "island_contours", function(){
          renderCircles(obj.island_circles.data, function(){
            renderMessage("The Three Parallel", "Three visible cracks, foretells of a bountiful harvest or achievement.");
          })
        });
      });
      */

const renderCircles = function (data, callback) {
  dbug && console.log("renderCircles", data, data.length)
  data = JSON.parse(data);
  
  if (data.length > 0) {
    // can be multiple circles
    for (var i = 0; i < data.length; i++) {
      const c = data[i]
      const x = c[0][0];
      const y = c[0][1];
      const r = c[1];
      // center point & radius
  
      svg.append('circle')
        .attr('cx', map(x))
        .attr('cy', map(y))
        .attr('r', map(r))
        .attr('class', "island_circles")
        .attr('stroke', 'white')
        .attr('fill', 'none')
        .transition().delay(settings.between_delay).duration(100)
        .ease(d3.easeLinear).style("opacity", 1)
        .end()
        .then(() => {
          callback()
        });
    }
  } else {
    callback()
  }
}

const renderEmbrio = function (data, callback) {
  dbug && console.log("renderEmbrio", data, data.length)
  data = JSON.parse(data);
  
  if (data.length > 0) {
    // can be multiple circles
    for (var i = 0; i < data.length; i++) {
      const c = data[i]
      const x = c[0][0];
      const y = c[0][1];
      const r = c[1];
      // center point & radius
  
      svg.append('circle')
        .attr('cx', map(x))
        .attr('cy', map(y))
        .attr('r', map(r))
        .attr('class', "island_circles")
        .attr('stroke', 'white')
        .attr('fill', 'none')
        .transition().delay(settings.between_delay).duration(100)
        .ease(d3.easeLinear).style("opacity", 1)
        .end()
        .then(() => {
          callback()
        });
    }
  } else {
    callback()
  }
}

const renderLines = function (data, callback) {
  data = JSON.parse(data);
  console.log("renderLines", data)
  if (data.length > 0) {
    for (var i = 0; i < data.length; i++) {
      let line = data[i][0]
      const x1 = line[0]
      const y1 = line[1]
      const x2 = line[2]
      const y2 = line[3]
      // center point & radius
  
      svg.append('line')
        .attr('x1', map(x1))
        .attr('y1', map(y1))
        .attr('x2', map(x2))
        .attr('y2', map(y2))
        .attr('class', "lines")
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .transition().delay(settings.between_delay).duration(100)
        .ease(d3.easeLinear).style("opacity", 1)
        .end()
        .then(() => {
          callback()
        });
    }
  } else {
    callback()
  }
}

const map = function (x) {
  return parseFloat((x * settings.ratio).toFixed(2));;
}

const parseData = function (data) {
  let o = {}
  for (var i = 0; i < data.length; i++) {
    const layer = data[i];
    o[layer.name] = {
      type: layer.type,
      data: layer.data
    }
  }
  return o;
}

const map2DArray = function (data) {
  let points = [];
  for (var i = 0; i < data.length; i++) {
    points[i] = [];
    d = data[i];
    // deal with different formats
    if (d.length == 1) d = d[0]
    points[i][0] = map(d[0]);
    points[i][1] = map(d[1]);
  }
  return points;
}

const renderRect = function (data, callback = None) {

  data = JSON.parse(data)[0];
  points = map2DArray(data);
  var hull = d3.polygonHull(points);
  var line = d3.line()
    .curve(d3.curveLinearClosed);

  svg.append("path")
    .attr("d", line(hull))
    .attr('stroke', color)
    .attr('id', "box")
    .attr('fill', 'none')
    .transition().duration(100)
    .ease(d3.easeLinear).style("opacity", 1)
    .delay(settings.between_delay)
    .end()
    .then(() => {
      callback()
    });
}

const tour = function (data, name) {
  data = JSON.parse(data)[0];
  points = map2DArray(data);
  var pathData = lineGenerator(points);
  color = "white";
  id = name
  svg.append('path')
    .attr('d', pathData)
    .attr('id', name)
    .attr('stroke', color)
    .attr('fill', 'none');
}

const renderContour = function (data, name, callback) {
  console.log("renderContour!")
  data = JSON.parse(data)[0];
  points = map2DArray(data);
  var pathData = lineGenerator(points);
  color = "white";
  id = name
  p = svg.append('path')
    .attr('d', pathData)
    .attr('id', name)
    .attr('stroke', color)
    .attr('fill', 'none')

  if (settings.animation) {
    p.call(reveal, callback)
  };
}

const size = function (ar) {
  var row_count = ar.length;
  var row_sizes = []
  for (var i = 0; i < row_count; i++) {
    row_sizes.push(ar[i].length)
  }
  return [row_count, Math.min.apply(null, row_sizes)]
}

const reveal = function (path, callback) {
  console.log("reveal")
  path.transition()
    .duration(settings.animation_duration)
    .ease(d3.easeLinear)
    .attrTween("stroke-dasharray", function () {
      const length = this.getTotalLength();
      return d3.interpolate(`0,${length}`, `${length},${length}`);
    })
    .end()
    .then(() => {
      callback()
    });
}

const renderMessage = function (title, text) {
  mode("predict")
  dbug && console.log("renderMessage")
  $('#category').text(title);
  // TODO: Instead of fading out, it shall change opacity to 0.2
  // $('#stream').fadeOut(settings.fadeout_duration, function () {
    $('#category').fadeIn(settings.animation_duration);
    typewriter.pauseFor(settings.animation_duration + 500).typeString(text).start();
  // });
}

$(document).ready(function () {
  typewriter = new Typewriter(document.getElementById('message'), {
    loop: false,
    cursor: "",
    delay: settings.typing_speed
  });
  resize();

  initSvgCanvas(settings.stream_width, settings.stream_width);
  // demo();

});
