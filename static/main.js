var map = L.map('map').setView([51.06, 13.75], 12);
map.addLayer(
    L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "OpenStreetMap.org",
        maxZoom: 18
    })
);


$.ajax({
    url: "lines.json",
    success: function(files) {
        loadLines(files);
    }
});

var lines = [];
function loadLines(files) {
    var file = files.shift();
    if (!file) {
        /* Done loading all */
        drawLines();
        return;
    }

    $.ajax({
        url: "lines/" + file,
        success: function(lines_) {
            lines = lines.concat(lines_);
            loadLines(files);
        }
    });
}

function drawLines() {
    var l = 0;
    lines.forEach(function(line) {
        var t = 0;
        line.members.forEach(function(el) {
            if (el.type !== 'way' || el.role !== '') {
                return;
            }
            console.log("el", el);

            var prev;
            el.nodes.forEach(function(node) {
                if (prev) {
                    var hue = Math.floor(360 * l / lines.length);
                    var sat = 100;
                    var light = Math.ceil(100 * t / line.members.length);
                    var color = "hsl(" + hue + ", " + sat + "%, " + light + "%)";
                    L.polyline([prev, node], {
                        color: color,
                        weight: 3,
                        opacity: 0.6,
                        lineCap: 'butt',
                        lineJoin: 'round'
                    })
                        .addTo(map);
                }
                prev = node;
            });
            t++;
        });
        l++;
    });
}
