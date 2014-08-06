/**
 * Relation 399665: Straßenbahnlinien in Dresden
 * Relation 57543: Buslinien Dresden DVB-AG
 **/

var async = require('async');
var levelup = require('levelup');
var db = levelup('./osm', {
    keyEncoding: 'utf8',
    valueEncoding: 'json'
});
var fs = require('fs');

var resolved = {};
var idsToResolve = [];
function resolveLoop(cb) {
    var id = idsToResolve.shift();
    if (!id) {
        // All done!
        return cb(null, resolved);
    }

    // Short-circuit:
    if (resolved.hasOwnProperty(id)) {
        return resolveLoop(cb);
    }

    db.get(id, function(err, item) {
        if (err) {
            console.error("Cannot resolve", id, ":", err);
            return cb(err);
        }

        // Not needed:
        delete item.info;

        // Memorize:
        resolved[id] = item;

        // Recurse ways:
        (item.refs || []).forEach(function(id) {
            idsToResolve.push(id);
        });

        // Recurse relations:
        (item.members || []).forEach(function(member) {
            idsToResolve.push(member.id);
        });

        resolveLoop(cb);
    });
}


var startIds = process.argv.slice(2);
startIds.forEach(function(id) {
    idsToResolve.push(id);
});
resolveLoop(function(err, resolved) {
    if (err) {
        console.error(err);
    } else {
        var lines = {};
        startIds.forEach(function(id) {
            resolved[id].members.forEach(function(routeRelation) {
                var route = resolved[routeRelation.id];
                if (routeRelation.type != 'relation' ||
                    route.tags.type != 'route' ||
                    !route.tags.ref) {

                    return;
                }

                var ref = route.tags.ref;
                if (!lines.hasOwnProperty(ref)) {
                    lines[ref] = [];
                }
                lines[ref].push({
                    id: route.id,
                    ref: route.tags.ref,
                    name: route.tags.name,
                    from: route.tags.from,
                    to: route.tags.to,
                    route: route.tags.route,
                    members: route.members.map(function(rel) {
                        var el = resolved[rel.id];
                        if (rel.type === 'node') {
                            return {
                                type: 'node',
                                role: rel.role,
                                lat: el.lat,
                                lon: el.lon,
                                name: el.tags.name
                            };
                        } else if (rel.type === 'way') {
                            return {
                                type: 'way',
                                role: rel.role,
                                maxspeed: el.tags.maxspeed,
                                nodes: (el.refs || []).map(function(id) {
                                    return resolved[id];
                                }).filter(function(node) {
                                    return node.lat && node.lon;
                                }).map(function(node) {
                                    return {
                                        lat: node.lat,
                                        lon: node.lon
                                    };
                                })
                            };
                        } else {
                            return null;
                        }
                    })
                });
            });
        });

        Object.keys(lines).forEach(function(ref) {
            console.log(ref);
            fs.writeFileSync(ref.replace(/[\/\s]/g, "_") + ".json", JSON.stringify(lines[ref]));
        });
    }
});

