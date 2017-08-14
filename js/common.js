L.Polyline = L.Polyline.extend({
    toPostGIS: function() {
        var xy = this.getLatLngs();
        var latlngs = [];
        for (var i = 0; i < xy.length; i++) {
            latlngs.push(xy[i].lng + " " + xy[i].lat);
        }
        return "LINESTRING("+latlngs.join(', ')+")";
    },
    fromPostGIS: function(str) {
        if (str.indexOf("MULTILINESTRING") != -1) {
            str = str.split("),(")[0];
        }
        var coords = str.replace("MULTILINESTRING((", "").replace("LINESTRING(", "").replace("))", "").replace(")", "").split(",");
        var latlng = [];
        for (var i = 0; i < coords.length; i++) {
            var xy = $.trim(coords[i]).split(" ");
            latlng.push(new L.LatLng(parseFloat(xy[1]), parseFloat(xy[0])));
        }
        this.setLatLngs(latlng)
    }
});
L.Polyline.fromPostGIS = function(str) {
    var coords = str.replace("MULTILINESTRING((", "").replace("LINESTRING(", "").replace("))", "").replace(")", "").split(",");
    var latlng = [];
    for (var i = 0; i < coords.length; i++) {
        var xy = $.trim(coords[i]).split(" ");
        latlng.push(new L.LatLng(parseFloat(xy[1]), parseFloat(xy[0])));
    }
    var l = new L.Polyline();
    return l.setLatLngs(l)
};
L.Circle = L.Circle.extend({
    fromPostGIS: function(str) {
        var coords = str.replace("POINT(", "").replace(")", "").split(" ");
        this.setLatLng(new L.LatLng(coords[1], coords[0]));
    }
});
$.fn.toJSON = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};
L.Map = L.Map.extend({
    removeAllEventListener: function(){
        console.log("remove");
    }
});

L.Icon.SmallIcon = L.Icon.extend({
    options: {
        iconUrl: L.ROOT_URL + 'images/marker.png',
        iconSize: new L.Point(12, 20),
        iconAnchor: new L.Point(7, 20),
        popupAnchor: new L.Point(0, -33),

        shadowUrl: L.ROOT_URL + 'images/marker-shadow.png',
        shadowSize: new L.Point(20, 20)
    }
});

L.Control.Permalink = L.Control.extend({
    options: {
        position: "bottomleft",
        useAnchor: true,
        useMarker: true,
        markerOptions: {}
    },

    initialize: function(layers, options) {
        L.Util.setOptions(this, options);
        this._set_urlvars();
        this._centered = false;
        this._layers = layers;
        this._marker = null;
    },

    onAdd: function(map) {
        this._container = L.DomUtil.create('div', 'leaflet-control-attribution');
        L.DomEvent.disableClickPropagation(this._container);
        map.on('moveend', this._update_center, this);
        map.on('layeradd', this._update_layers, this);
        map.on('layerremove', this._update_layers, this);
        this._map = map;
        this._href = L.DomUtil.create('a', null, this._container);
        this._href.innerHTML = "Permalink";
        this._set_center(this._params);
        this._set_marker(this._params);
        this._update_layers();
        this._update_center();

        if (this.options.useAnchor && 'onhashchange' in window) {
            var _this = this, fn = window.onhashchange;
            window.onhashchange = function() {
                _this._set_urlvars();
                _this._set_center(_this._params, true);
                _this._set_marker(_this._params);
                if (fn) return fn();
            }
        }

        return this._container;
    },

    _update_center: function() {
        if (!this._map) return;

        var center = this._map.getCenter();
        center = this._round_point(center);
        this._params['zoom'] = this._map.getZoom();
        this._params['lat'] = center.lat;
        this._params['lon'] = center.lng;
        this._update_href();
    },

    _update_href: function() {
        var params = L.Util.getParamString(this._params);
        var sep = '?';
        if (this.options.useAnchor) sep = '#';
        this._href.setAttribute('href', this._url_base + sep + params.slice(1))
    },

    _update_layers: function() {
        if (!this._layers) return;
        var layer = this._layers.currentBaseLayer();
        if (layer)
            this._params['layer'] = layer.name;
        this._update_href();
    },

    _round_point : function(point) {
        var bounds = this._map.getBounds(), size = this._map.getSize();
        var ne = bounds.getNorthEast(), sw = bounds.getSouthWest();

        var round = function (x, p) {
            if (p == 0) return x;
            shift = 1;
            while (p < 1 && p > -1) {
                x *= 10;
                p *= 10;
                shift *= 10;
            }
            return Math.floor(x)/shift;
        }
        point.lat = round(point.lat, (ne.lat - sw.lat) / size.y);
        point.lng = round(point.lng, (ne.lng - sw.lng) / size.x);
        return point;
    },

    _set_urlvars: function()
    {
        function alter(p) {
            if (!p.mlat || !p.mlon) return p;
            p.lat = p.mlat;
            p.lon = p.mlon;
            p.marker = '1';
            delete p['mlat'];
            delete p['mlon'];
            return p;
        }

        this._url_base = window.location.href.split('#')[0];
        var ph = {};
        if (this.options.useAnchor)
            ph = alter(L.UrlUtil.queryParse(window.location.hash.slice(1)));

        var q = L.UrlUtil.query();
        if (!q) {
            this._params = ph;
            return;
        }

        var pq = alter(L.UrlUtil.queryParse(q));

        if (!this.options.useAnchor) {
            this._url_base = this._url_base.split('?')[0]
            this._params = pq;
            return;
        }

        this._params = ph;
        if (pq.lat && pq.lon && pq.zoom)
            this._params = L.Util.extend({lat: pq.lat, lon: pq.lon, zoom: pq.zoom}, this._params);
        if (pq.layer)
            this._params = L.Util.extend({layer: pq.layer}, this._params);
    },

    _set_center: function(params, force)
    {
        if (!force && this._centered) return;
        if (params.zoom == undefined ||
            params.lat == undefined ||
            params.lon == undefined) return;
        this._centered = true;
        this._map.setView(new L.LatLng(params.lat, params.lon), params.zoom);
        if (params.layer && this._layers)
            this._layers.chooseBaseLayer(params.layer);
    },

    _set_marker: function(params)
    {
        if (this._marker)
            this._map.removeLayer(this._marker);
        this._marker = null;
        if (params.marker != '1' || !this._centered || !this.options.useMarker) return;
        this._marker = new L.Marker(new L.LatLng(params.lat, params.lon), this.options.markerOptions);
        this._map.addLayer(this._marker);
    }
});

L.Control.Layers.include({
    chooseBaseLayer: function(name) {
        var layer, obj;
        for (var i in this._layers) {
            if (!this._layers.hasOwnProperty(i))
                continue;
            obj = this._layers[i];
            if (!obj.overlay && obj.name == name)
                layer = obj.layer;
        }
        if (!layer || this._map.hasLayer(layer))
            return;

        for (var i in this._layers) {
            if (!this._layers.hasOwnProperty(i))
                continue;
            obj = this._layers[i];
            if (!obj.overlay && this._map.hasLayer(obj.layer))
                this._map.removeLayer(obj.layer)
        }
        this._map.addLayer(layer)
        this._update();
    },

    currentBaseLayer: function() {
        for (var i in this._layers) {
            if (!this._layers.hasOwnProperty(i))
                continue;
            var obj = this._layers[i];
            if (obj.overlay) continue;
            if (!obj.overlay && this._map.hasLayer(obj.layer))
                return obj;
        }
    }
});

L.UrlUtil = {
    queryParse: function(s) {
        var p = {};
        var sep = "&";
        if (s.search("&amp;") != -1)
            sep = "&amp;";
        var params = s.split(sep);
        for(var i = 0; i < params.length; i++) {
            var tmp = params[i].split('=');
            if (tmp.length != 2) continue;
            p[tmp[0]] = tmp[1];
        }
        return p;
    },

    query: function() {
        var href = window.location.href.split('#')[0], idx = href.indexOf('?');
        if (idx < 0)
            return '';
        return href.slice(idx+1);
    }
};

function DraugiemSay( title, url, titlePrefix ){
    window.open(
        'http://www.draugiem.lv/say/ext/add.php?title=' + encodeURIComponent( title ) +
            '&link=' + encodeURIComponent( url ) +
            ( titlePrefix ? '&titlePrefix=' + encodeURIComponent( titlePrefix ) : '' ),
        '',
        'location=1,status=1,scrollbars=0,resizable=0,width=530,height=400'
    );
    return false;
}

function hashVar(name) {
    var hash = window.location.hash.split("/");
    for (var i = 1; i < hash.length; i+=2) {
        if (hash[i] == name)
            return hash[i+1];
    }
    return "";
}
