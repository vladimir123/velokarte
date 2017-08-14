var Tracks = {
    init:function (params) {
        if (params) {
            this.types = params.types;
        }
        this.initContent();
        this.initLeafletMap();
        this.bindEvents();
        this.initSubscribes();
        this.loadCSDD();
        this.loadPoi();

        this.initContent();

        if (hashVar("id") == "" && hashVar("user") == "")
            this.updateTracksList($("#btn-track-public").hasClass("selected"));
        this.detectParams();
    },
    initContent:function () {
        Tracks.resize();
        if ($(window).width() < 700)
            $("#btn-sidebar").click();
    },
    initLeafletMap:function () {
        var url = 'http://projekti.kurtuesi.lv/tilecache_google/tilecache.cgi',
            kteLayer = new L.TileLayer.WMS(url,
                {
                    maxZoom:17,
                    minZoom:8,
                    layers:'google_kte',
                    format:'image/png',
                    transparent:true,
                    attribution:"Karte &copy; <a href='http://www.kurtuesi.lv' target='_blank'>kurtuesi.lv</a>"
                },
                {styleId:1999}
            ),
            ortoLayer = new L.TileLayer.WMS(url,
                {
                    maxZoom:17,
                    minZoom:8,
                    layers:'google_orto',
                    format:'image/jpeg',
                    transparent:false,
                    attribution:"Karte &copy; <a href='http://www.kurtuesi.lv' target='_blank'>kurtuesi.lv</a>; Ortofoto &copy; <a href='http://www.lgia.gov.lv' target='_blank'>LĢIA</a>"
                },
                {styleId:999}
            );
        Tracks.map = new L.Map('map',
            {
                center:new L.LatLng(56.9, 24.5),
                zoom:8,
                maxZoom:17,
                minZoom:8,
                layers:[kteLayer],
                maxBounds:new L.LatLngBounds(new L.LatLng(55.5, 19), new L.LatLng(58.5, 29))
            });
        var baseMaps = {
            "Pamatkarte": kteLayer,
            "Ortofoto Karte": ortoLayer
        };
        Tracks.layersControl = new L.Control.Layers(baseMaps);
        Tracks.map.addControl(Tracks.layersControl);

        var permalinkControl = new L.Control.Permalink();
        Tracks.map.addControl(permalinkControl);

        // create fullscreen control
        var fullScreen = new L.Control.FullScreen();
        // add fullscreen control to the map
        Tracks.map.addControl(fullScreen);

        L.control.scale().addTo(Tracks.map);

        Tracks.map.on("moveend", function() {
            if ($("#track-list").css("display") == "block")
                Tracks.updateTracksList($("#btn-track-public").hasClass("selected"));
        });
    },
    initSubscribes: function() {
        $.subscribe("publicinfo/close", function() {
            if (Tracks.Path) {
                Tracks.Path.remove();
            }
            Tracks.hideGeometryHint();
            $("#btn-sidebar.hided").click();
            window.location.hash = "";
        });
    },
    resize: function() {
        $("#map").height($(window).height() - $("#header").height() - 2);
        var sidebar = $("#sidebar").height($(window).height() - $("#header").height() - 22);
        $("#track-list-items").height(sidebar.height() - sidebar.find(".header").height() - 10);
        if (Tracks.map)
            Tracks.map._onResize();
    },
    updateTracksList:function (ispublic) {
        var ul = $("#track-list ul#track-list-items"),
            source = $("#track-info-template").html(),
            template = Handlebars.compile(source);

        $("#track-list").show();
        $("#track-info").hide();
        if (ispublic)
            $("#btn-track-public").addClass("selected").siblings().removeClass("selected");
        else
            $("#btn-track-private").addClass("selected").siblings().removeClass("selected");

        Handlebars.registerHelper('toDate', function(date) {
            return $.format.date(date, "dd.MM.yyyy HH:mm");
        });
        $.post("?r=path/list",
            {
                "ispublic": ispublic,
                "extent": Tracks.map.getBounds().toBBoxString(),
                "types": $("#track-type-list li.selected").map(function() {return $(this).data("id")}).toArray().join(",")
            },
            function (results) {
                ul.find("h2, li").remove();
                if (results.length) {
                    for (var i = 0; i < results.length; i++) {
                        results[i].ispublic = ispublic;
                    }
                    ul.append(template({ "tracks": results }));
                }
                else {
                    ul.append($("<h2 />").html("Nav redzams neviens objekts."));
                    ul.append($("<li />").html('Pamēģiniet attālināt vai pabīdīt karti,'));
                    ul.append($("<li />").html('vai norādīt citas meklēšanas kritērijus.'));
                }
                if ($(".track-item").length)
                    $('#track-list-items').scrollTo($(".track-item").eq(0));
                Tracks.clearExtentPaths();
                Tracks.showExtentPath(results);
            }
        )
    },
    bindEvents:function () {
        $(window).on("resize", function() {
            if (Tracks.resizeTimer)
                clearTimeout(Tracks.resizeTimer);
            Tracks.resizeTimer = setTimeout(Tracks.resize, 300);
        });
        $("#btn-track-public").on("click", Tracks.showPublicTracks);
        $("#btn-track-private").on("click", Tracks.showPrivateTracks);
        $("#btn-track-create").on("click", Tracks.createTrack);
        $("#btn-poi-create").on("click", Tracks.createPoi);
        $("#btn-logout").on("click", function () {
            window.location = "?r=site/logout"
        });
        $(".track-item-info").live("click", Tracks.showInfo);
        $(".track-item-edit").live("click", Tracks.showEdit);
        $(".track-item-remove").live("click", Tracks.deleteTrack);
        $(".track-item-zoomto").live("click", Tracks.zoomToGeometryHint);
        $("#track-list .track-item").live("mouseleave", Tracks.hideGeometryHint);
        $("#track-list .track-item").live("mouseenter", Tracks.showGeometryHint);
        $("#btn-startdrawing").on("click", function () {
            if (!Tracks.Path) {
                Tracks.Path = new Path({map: Tracks.map});
            }
            Tracks.Path.startDrawing();
            $(this).addClass("selected").siblings().removeClass();
        });
        $("#btn-removeediting").on("click", Tracks.clearTrack);

        $("#btn-save").on("click", Tracks.saveTrack);
        $("#btn-delete").on("click", Tracks.deleteTrack);
        $("#btn-cancel").on("click", Tracks.cancelEditing);

        $("#btn-sidebar").on("click", function() {
            if ($(this).hasClass("hided")) {
                $(this).removeClass("hided");
                $("#sidebar").show();
                $("#map-container").css("margin-left", "300px");
                $(this).css("left", "310px").find("i").removeClass("icon-arrow-right").addClass("icon-arrow-left");
                Tracks.map._onResize();
            }
            else {
                $(this).addClass("hided");
                $("#sidebar").hide();
                $("#map-container").css("margin-left", "0");
                $(this).css("left", "10px").find("i").removeClass("icon-arrow-left").addClass("icon-arrow-right");
                Tracks.map._onResize();
            }
        });
    },
    showPublicTracks:function() {
        $.publish("publicinfo/close");
        Tracks.updateTracksList(true);
    },
    showPrivateTracks:function () {
        $.publish("publicinfo/close");
        Tracks.updateTracksList(false);
    },
    clearExtentPaths: function(){
        if (Tracks.extentPaths) {
            for (var i = 0; i < Tracks.extentPaths.length; i++) {
                Tracks.map.removeLayer(Tracks.extentPaths[i].polyline);
            }
            Tracks.extentPaths = null;
        }
    },
    showExtentPath: function(paths){
        Tracks.extentPaths = paths;

        for (var i = 0; i < Tracks.extentPaths.length; i++){
            Tracks.extentPaths[i].polyline = new L.Polyline([]);
            Tracks.extentPaths[i].polyline.fromPostGIS(Tracks.extentPaths[i].geometry);
            Tracks.extentPaths[i].polyline.setStyle({
                weight:6,
                color: Tracks.extentPaths[i].pathType_color,
                pid: Tracks.extentPaths[i].id
            });

            Tracks.extentPaths[i].polyline.on("mouseover", Tracks.showGeometryHint);
            Tracks.extentPaths[i].polyline.on("mouseout", Tracks.hideGeometryHint);
            Tracks.extentPaths[i].polyline.on("click", Tracks.showInfo);

            Tracks.map.addLayer(Tracks.extentPaths[i].polyline);
            $(Tracks.extentPaths[i].polyline._path).attr("title", Tracks.extentPaths[i].name);
            $(Tracks.extentPaths[i].polyline._path).data("pid", Tracks.extentPaths[i].id);
            $(Tracks.extentPaths[i].polyline._path).on("mouseenter", function() {
                $('#track-list-items').scrollTo($(".track-item[data-pid='"+$(this).data("pid")+"']"), 1000);
                $(".track-item[data-pid='"+$(this).data("pid")+"']").addClass("hovered");
           });
            $(Tracks.extentPaths[i].polyline._path).on("mouseleave", function() {
                $(".track-item[data-pid='"+$(this).data("pid")+"']").removeClass("hovered");
            });
        }
    },
    showInfo:function (obj) {
        var pid = obj;
        if (typeof(pid) !== 'string') {
            pid = ($(this).parents(".track-item").data("pid") ? $(this).parents(".track-item").data("pid") : this.options.pid);
        }
        Tracks.hideGeometryHint();
        Tracks.clearExtentPaths();
        $(".tools li").removeClass("selected");
        $("#track-data").load("?r=path/info",
            {
                "pid": pid
            },
            function () {
                $("#track-list").hide();
                $("#track-info").show();
            });

        window.location.hash = "#!/id/"+pid;
        return false;
    },
    showEdit:function () {
        Tracks.hideGeometryHint();
        Tracks.clearExtentPaths();
        $(".tools li").removeClass("selected");
        $("#track-data").load("?r=path/edit",
            {
                "pid": ($(this).parents(".track-item").data("pid") ? $(this).parents(".track-item").data("pid") : this.options.pid)
            },
            function () {
                $("#track-list").hide();
                $("#track-info").show();
            });
        return false;
    },
    hideGeometryHint: function() {
        if (Tracks.extentPaths) {
            for (var i = 0; i < Tracks.extentPaths.length; i++) {
                Tracks.extentPaths[i].polyline.setStyle({color:Tracks.extentPaths[i].pathType_color}).setStyle({weight:5});
            }
        }
    },
    showGeometryHint: function() {
        var $this = $(this);
        if (Tracks.extentPaths) {
            for (var i = 0; i < Tracks.extentPaths.length; i++) {
                if (Tracks.extentPaths[i].id.toString() == ($this.data("pid") ? $this.data("pid").toString() : $this[0].options.pid.toString())) {
                    Tracks.hideGeometryHint();
                    Tracks.extentPaths[i].polyline.setStyle({color:"#FF0000"}).setStyle({weight:10});
                    Tracks.PathHint = Tracks.extentPaths[i].polyline;
                    return;
                }
            }
        }
    },
    zoomToGeometryHint: function() {
        if (Tracks.PathHint) {
            Tracks.map.fitBounds(Tracks.PathHint.getBounds());
        }
    },
    createTrack:function (e) {
        if (Tracks.Path) {
            Tracks.Path.remove();
        }
        Tracks.hideGeometryHint();
        $(this).addClass("selected").siblings().removeClass("selected");
        $("#track-data").load("?r=path/create",
            function () {
                $("#track-list").hide();
                $("#track-info").show();
            });
        e.preventDefault();
        return false;
    },
    clearTrack: function() {
        if (Tracks.Path)
            Tracks.Path.removeGeometry();
    },
    saveTrack:function () {
        if (!Tracks.Path)
            return false;

        if (!Tracks.Path.geometry) {
            alert("Nav uzzīmēta ģeometrija!");
            return false;
        }
        if ($.trim($("#Path_name").val()) == "") {
            alert("Maršrūta nosaukums ir obligāts!");
            return false;
        }

        $("#track-info input.geometry").val(Tracks.Path.geometry.toPostGIS());
        $.post("?r=path/save",
            $("#track-info form").toJSON(),
            function () {
                Tracks.Path.remove();
                Tracks.updateTracksList(false);
            },
            'json');
        return false;
    },
    deleteTrack:function () {
        if (!confirm("Vai tiešām dzēst maršrūtu?"))
            return false;

        var pid;
        if ($(this).parents(".track-item").length)
            pid = $(this).parents(".track-item").data("pid");
        else
            pid = $("#Path_id").val();

        $.post("?r=path/delete",
            {
                pid: pid
            },
            function () {
                if (Tracks.Path)
                    Tracks.Path.remove();
                Tracks.updateTracksList(false);
            },
            'json'
        );
        return false;
    },
    cancelEditing:function (e) {
        if (Tracks.ispublic)
            $("#btn-track-public").click();
        else
            $("#btn-track-private").click();
        if (e)
            e.preventDefault();
        return false;
    },
    detectParams: function () {
        if (hashVar("id")) {
            Tracks.showInfo(hashVar("id"));
        }
        if (hashVar("user"))
            this.showUserTracks(hashVar("user"));
    },
    loadCSDD: function(){
        $.post("?r=csdd/load",
            function(objects){
                Tracks.cssdLayer = new L.FeatureGroup();
                for (var i = 0 ; i < objects.length; i++){
                    var latlng = objects[i].geometry.replace("POINT(", "").replace(")", "").split(" ");
                    if (objects[i].type == 0) {
                        objects[i].icon = new L.Icon(
                            {
                                iconUrl: "images/marker_csdd2.png",
                                iconSize: new L.Point(30, 16),
                                iconAnchor: new L.Point(14, 16),
                                popupAnchor: new L.Point(0, -11),
                                shadowUrl: 'images/marker-shadow.png',
                                shadowSize: new L.Point(16, 16)
                            });
                    }
                    else {
                        objects[i].icon = new L.Icon(
                            {
                                iconUrl: "images/museum.png",
                                iconSize: new L.Point(24, 24),
                                iconAnchor: new L.Point(13, 24),
                                popupAnchor: new L.Point(0, -17),
                                shadowUrl: 'images/marker-shadow.png',
                                shadowSize: new L.Point(24, 24)
                            });
                    }
                    Tracks.cssdLayer.addLayer(new L.Marker(new L.LatLng(latlng[1], latlng[0]), objects[i]));
                }
                Tracks.cssdLayer.on('click', function(obj) {
                    var options = obj.layer.options;
                    var html = $("<div/>")
                        .append(
                            $("<h2 />")
                                .html(options.nodala)
                        )
                        .append(
                            $("<ul/>")
                                .append($("<li/>").append($("<strong/>").html("Adrese: ")).append(options.adrese).css("display", (options.adrese == null) ? "none" : ""))
                                .append($("<li/>").append($("<strong/>").html("Darba laiki: ")).append(options.laiks).css("display", (options.laiks == null) ? "none" : ""))
                                .append($("<li/>").append($("<strong/>").html("Kontakti: ")).append(options.telefons).css("display", (options.telefons == null) ? "none" : ""))
                        );
                    obj.layer.bindPopup(html.html()).openPopup();
                });
                Tracks.layersControl.addOverlay(Tracks.cssdLayer, "CSDD nodaļas");
                Tracks.initVeloFender();
            }
        )
    },
    loadPoi: function(){
        $.post("?r=poi/load",
            function(objects){
                Tracks.poiLayer = new L.FeatureGroup();
                for (var i = 0 ; i < objects.length; i++){
                    Tracks.addPoiMarker(objects[i]);
                }
                Tracks.poiLayer.on('click', function(obj) {
                    var options = obj.layer.options;
                    $("<div />").load("?r=poi/info", {pid: obj.layer.options.id},
                        function(content) {
                            obj.layer.bindPopup(content).openPopup();
                            if (options.user_id == userId) {
                                $(".poi-delete").on("click", function() {
                                    var pid = $(this).data("pid");
                                    $.getJSON("?r=poi/delete", {pid: pid}, function() {
                                        Tracks.map.closePopup();

                                        Tracks.poiLayer.eachLayer(function(layer) {
                                            if (layer.options.id == pid)
                                                Tracks.poiLayer.removeLayer(layer);
                                        })
                                    });
                                    return false;
                                });
                            }
                        }
                    );
                });
                //Tracks.poiLayer.addTo(Tracks.map);
                Tracks.layersControl.addOverlay(Tracks.poiLayer, "Interešu punkti");
                Tracks.initVeloFender();
            }
        )
    },
    addPoiMarker: function(obj) {
        obj.icon = new L.Icon(
            {
                iconUrl: "images/icons/"+obj.poiType_icon,
                iconSize: new L.Point(24, 24),
                iconAnchor: new L.Point(12, 16),
                popupAnchor: new L.Point(0, -11),
                shadowUrl: 'images/marker-shadow.png',
                shadowSize: new L.Point(16, 16)
            });
        Tracks.poiLayer.addLayer(new L.Marker(new L.LatLng(obj.lat.toString(), obj.lon.toString()), obj));
    },
    initVeloFender: function() {
        $(".leaflet-control-layers-overlays").append(
            $("<label />")
                .append($("<input/>")
                    .attr("type", "checkbox")
                    .on("click", function() {
                        if ($(this).is(":checked")) {
                            Tracks.loadVeloFender();
                        }
                        else {
                            Tracks.map.removeLayer(Tracks.markers);
                        }
                    })
                )
                .append("Iedzīvotāju ziņojumi"));
    },
    loadVeloFender: function() {
        if (!Tracks.markers || !Tracks.markers.length) {
            $.getJSON("?r=point/load",
                function(results) {
                    Tracks.markers = new L.MarkerClusterGroup();
                    Tracks.markersList = [];
                    for (var i = 0; i < results.length; i++) {
                        Tracks.addMarkerToCluster(results[i]);
                    }
                    Tracks.map.addLayer(Tracks.markers);

                    Tracks.markers.on('click', function(a) {
                        $this = a.layer;
                        if (!$this._popup) {
                            $this.bindPopup($("<div />").append(Tracks.getPopupHtml($this.options)).html());
                        }
                        $this.openPopup();
                        $.getJSON("http://api.twitter.com/1/users/show.json?screen_name="+ $this.options.username +"&callback=?",
                            function(res) {
                                $("#info-username")
                                    .html("@"+res.name)
                                    .attr("href", "http://www.twitter.com/"+res.screen_name)
                                ;
                                $("#info-img").attr("src", res.profile_image_url);
                                $("#info-container").addClass("twitterinfo");
                            }
                        );
                    });
                }
            );
        }
        else {
            for (var i = 0; i < Tracks.markers.length; i++)
                Tracks.clusterer.addMarker(Tracks.markers[i]);
        }
    },
    addMarkerToCluster: function(point) {
        var marker = new L.Marker(new L.LatLng(point.lat, point.lng),
            {
                icon: new L.Icon(
                    {
                        iconUrl: "images/irpin.png",
                        iconSize: new L.Point(36, 38),
                        iconAnchor: new L.Point(18, 38),
                        popupAnchor: new L.Point(0, -36)
                    }
                ),
                username: point.username,
                id: point.id,
                date: point.date,
                descr: point.descr
            }
        );
        Tracks.markersList.push(marker);
        Tracks.markers.addLayer(marker);
    },
    getPopupHtml: function(options) {
        var $div = $("<div />").attr("id", "info-container");
        $div.append($("<img />").attr("id", "info-img").attr("src", ""));
        $div.append($("<a />")
            .attr("id", "info-username")
            .attr("target", "_blank")
            .attr("href", "http://www.twitter.com/"+options.username)
            .html("@"+options.username)
        );
        $div.append($("<div />").attr("id", "info-date").html(options.date));
        $div.append($("<div />").attr("id", "info-descr").html(options.descr));
        return $div;
    },
    showUserTracks: function (user) {
        $.getJSON("?r=path/zoomToUser", {user: user}, function(result){
            if (result.min && result.max) {
                var li = $("#track-type-list li").removeClass("selected");
                for (var i = 0; i < result.types.length; i++) {
                    li.filter("[data-id='"+result.types[i]+"']").addClass("selected");
                }
                var min = new L.LatLng(result["min"][1], result["min"][0]),
                    max = new L.LatLng(result["max"][1], result["max"][0]);
                var line = new L.Polyline([min, max]);
                Tracks.map.fitBounds(line.getBounds());
            }
        });
    },
    createPoi: function() {
        Tracks.map.on("click", Tracks.onPoiAdd);
    },
    onPoiAdd: function(e) {
        $("<div />").load("?r=poi/add",
            {
                lat:  e.latlng.lat,
                lon:  e.latlng.lng
            },
            function(content) {
                var marker = L.marker(e.latlng).addTo(Tracks.map);
                marker.bindPopup(content).openPopup();
                Tracks.map.off("click", Tracks.onPoiAdd);

                var closeFn = function(){
                    Tracks.map.removeLayer(marker);
                    Tracks.map.off("popupclose", closeFn);
                };
                Tracks.map.on("popupclose", closeFn);

                $("#poi-add").on("click", function() {
                    $.post("?r=poi/create",
                        {
                            name: $("#poi-create-name").val(),
                            descr: $("#poi-create-descr").val(),
                            type: $(".poi-type").filter(".selected").data("id"),
                            lat: $("#poi-create-lat").val(),
                            lon: $("#poi-create-lon").val()
                        },
                        function(results) {
                            Tracks.addPoiMarker(results[0]);
                            Tracks.map.closePopup();
                        },
                        "json"
                    );
                });
                $(".poi-type").on("click", function() {
                    $(this).addClass("selected").siblings().removeClass("selected");
                });
            }
        );

    }
};
