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

function loadLines(files) {
    var file = files.shift();
    if (!file) {
        /* Done loading all */
        return;
    }

    $.ajax({
        url: "lines/" + file,
        success: function(line) {
            addLine(line);
            loadLines(files);
        }
    });
}

function addLine(tracks) {
    var color = "hsl(" + Math.floor(360 * Math.random()) + ", 80%, 20%)";
    tracks.forEach(function(track) {
        track.members.forEach(function(way) {
            if (way.type !== 'way') {
                return;
            }

            L.polyline(way.nodes, {
                color: color,
                weight: 3,
                opacity: 0.8,
                lineCap: 'butt',
                lineJoin: 'round'
            })
                .addTo(map);
        });
    });
}
