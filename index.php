<?php

/* 
 * @author Vladimir Gavrilyuk aka VelikijMerlinTo change this license header, choose License Headers in Project Properties.
 * @author Vladimir Gavrilyuk aka VelikijMerlinTo change this template file, choose Tools | Templates
 * @author Vladimir Gavrilyuk aka VelikijMerlinand open the template in the editor.
 */

//echo phpinfo();

?>

<html>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=8" />    
    <title>Velo karte</title>
    <head>
        <script type="text/javascript" src="/js/jquery-3.2.1.min.js"></script>
        <!--<script type="text/javascript" src="http://maps.googleapis.com/maps/api/js?libraries=geometry"></script>-->
        <!--<script type="text/javascript" src="http://maps.googleapis.com/maps/api/js?libraries=geometry&key=AIzaSyDQoxfPIqBRTbH2mk9WhTb0B8ezcvZLEf8"></script>-->
<!--          <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDQoxfPIqBRTbH2mk9WhTb0B8ezcvZLEf8&callback=initMap" type="text/javascript"></script>-->
        
<!--        <script type="text/javascript" src="/js/leaflet-src.js"></script>
        <script type="text/javascript" src="/js/Control.FullScreen.js"></script>
        <script type="text/javascript" src="/js/leaflet.markercluster-src.js"></script>
        
        <script type="text/javascript" src="/js/common.js"></script>
        <script type="text/javascript" src="/js/path.js"></script>
        <script type="text/javascript" src="/js/tracks.js"></script>-->
        <!--<link rel="stylesheet" href="/css/style.css"/>-->
    </head>
    <body>
        
        <input type="text" id="txt_search" />
        <input type="button" id="btn_search" value="Search" />
        
        <div id="filters"></div>
        <div id="rez_html" style="display: none;"></div>
        <div id="map" style="width: 500px; height: 500px;"></div>
        
        
        <script>
            $(document).ready(function() {
                //ajax settings
                $.ajaxSetup
                ({
                        url: "conf/ajax.php",
                        type: "POST",
                        async: true,
                        cache: true,
                        timeout: 50000,
                        dataType: "json"
                });
                
                $("#btn_search")
                        .on("click", function() {
                            var
                                search_value = $("#txt_search").val();
                    
                            if ( search_value.length >= 3 )
                            {
                                $.ajax
                                ({
                                    data:
                                    {
                                            action: 'search',
                                            search: search_value
                                    },
                                    success:function(a)
                                    {
                                        $("#filters").html(a.result.select);
                                    }
                                });
                            }
                        });
                        
                $("#filters")
                        .on("change", "#searched_oprtions", function() {
//                            console.log( $(this).val() );
                            var
                                selected_id = $(this).val();
                                
                                $.ajax
                                ({
                                    data:
                                    {
                                            action: 'get_path',
                                            path_id: selected_id
                                    },
                                    success:function(a)
                                    {
                                        $("#rez_html").html(a.result.html);
                                        
                                        var map = new google.maps.Map(document.getElementById('map'), {
                                          zoom: 11,
                                          center: {lat: -34.397, lng: 150.644},
                                          mapTypeId: 'terrain'
                                        });
                                        
                                        var src = "<?php echo 'http://'.$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI']; ?>/uploads/output.kml";
                                        
                                        var kmlLayer = new google.maps.KmlLayer(src, {
                                            suppressInfoWindows: true,
                                            preserveViewport: false,
                                            map: map
                                          });
/*
                                        var ctaLayer = new google.maps.KmlLayer({
//                                          url: 'http://googlemaps.github.io/js-v2-samples/ggeoxml/cta.kml',
                                          url: "<?php echo 'http://'.$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI']; ?>/uploads/output.kml",
                                          map: map
                                        });
*/                                        
                                    }
                                });
                          });
            });
        </script>
        <script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDQoxfPIqBRTbH2mk9WhTb0B8ezcvZLEf8"></script>

    </body>
</html>
