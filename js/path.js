Path = function (params) {
    this.attributes = {
        startname: "",
        endname: "",
        path_type: 0,
        ispublic: false
    };
    this.map = params.map;
    this.attributes = $.extend(this.attributes, params.attributes);
    if (params.geometry) {
        this.geometry = params.geometry;
        var points = this.geometry.getLatLngs();
        this.firstpoint = new L.Marker(points[0]);
        this.lastpoint = new L.Marker(points[points.length - 1]);
    }
    this.addPoint = function (e) {
        if (!this.geometry) {
            this.geometry = new L.Polyline([e.latlng]);
            this.map.addLayer(this.geometry);

            this.firstpoint = new L.Marker(e.latlng);
            this.map.addLayer(this.firstpoint);
            this.lastpoint = new L.Marker(e.latlng);
            this.map.addLayer(this.lastpoint);
        }
        else {
            var pnts = this.geometry.getLatLngs();
            if (!pnts[pnts.length - 1].equals(e.latlng)) {
                this.geometry.addLatLng(e.latlng);
                if (this.lastpoint)
                    this.lastpoint.setLatLng(e.latlng);
            }
        }
    };
    this.display = function() {
        this.clear();
        this.map.addLayer(this.geometry);

        this.setAttributes();
    };
    this.clear = function() {
        if (this._clickFn)
            this.map.off("click", this._clickFn);
        if (this._dblclickFn)
            this.map.off("dblclick", this._dblclickFn);
        if (this.geometry && this._geoClickFn)
            this.geometry.off("click", this._geoClickFn);

        if (this.geometry)
            this.map.removeLayer(this.geometry);
        if (this.firstpoint)
            this.map.removeLayer(this.firstpoint);
        if (this.lastpoint)
            this.map.removeLayer(this.lastpoint);
    };
    this.removeGeometry = function () {
        this.clear();
        this.geometry = null;
        this.firstpoint = null;
        this.lastpoint = null;
    };
    this.remove = function () {
        this.removeGeometry();
        this.attributes = {
            startname: "",
            endname: "",
            path_type: 0,
            ispublic: false
        };
    };
    this.clearEditing = function() {
        if (this._clickFn)
            this.map.off("click", this._clickFn);
        if (this._dblclickFn)
            this.map.off("dblclick", this._dblclickFn);
        this._clickFn = null;
        this._dblclickFn = null;
        if (this.geometry)
            this.geometry.editing.disable();
    };
    this.startDrawing = function () {
        var $this = this;
        $this.clearEditing();

        $this._clickFn = function(e) { $this.addPoint(e) };
        $this._dblclickFn = function() { $this.initEditing() };
        $this.map.on('click', $this._clickFn);
        $this.map.on('dblclick', $this._dblclickFn);
        $this.map.doubleClickZoom.disable();
    };
    this.initEditing =  function () {
        var $this = this;
        $this.clearEditing();

        $this.map.doubleClickZoom.enable();
        if ($this.geometry) {
            if ($this._geoClickFn)
                $this.geometry.off("click", $this._geoClickFn);
            $this._geoClickFn = null;
            $this._geoClickFn = function() { $this.startEditing(); };
            $this.geometry.on("click", $this._geoClickFn);
        }
        $("#geometry-tools li").removeClass("selected");
        return false;
    };
    this.startEditing = function () {
        var $this = this;
        $this.clearEditing();

        $this.geometry.editing.enable();
        $this._clickFn = function() {
            $this.clearEditing();
            $this.display();
            $this.initEditing();
        };
        $this.map.on('click', $this._clickFn);
        if ($this.firstpoint)
            $this.map.removeLayer($this.firstpoint);
        if ($this.lastpoint)
            $this.map.removeLayer($this.lastpoint);
    };
    this.zoomTo = function() {
        if (!this.geometry)
            return false;
        this.map.fitBounds(this.geometry.getBounds());
        return this;
    }
    this.setAttributes = function(attr) {
        if (attr)
            $.extend(this.attributes, attr);
        var color = "#FF0000";
        for (var i = 0; i < Tracks.types.length; i++) {
            if (Tracks.types[i].id.toString() == this.attributes.path_type)
                color = Tracks.types[i].color;
        }
        this.geometry.setStyle({color:color});
        this.geometry.setStyle({opacity:0.6});
        this.geometry.setStyle({weight:7});

        this.map.removeLayer(this.firstpoint);
        this.map.removeLayer(this.lastpoint);
        if (this.attributes.startname && this.attributes.startname != "") {
            this.firstpoint.bindPopup(this.attributes.startname);
        }
        this.map.addLayer(this.firstpoint);
        if (this.attributes.endname && this.attributes.endname != "") {
            this.lastpoint.bindPopup(this.attributes.endname);
        }
        this.map.addLayer(this.lastpoint);
    }
};

