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
        <script type="text/javascript" src="js/jquery-3.2.1.min.js"></script>
        <script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=false&key=AIzaSyDQoxfPIqBRTbH2mk9WhTb0B8ezcvZLEf8"></script>
    </head>
    <body>
        
        <input type="text" id="txt_search" />
        <input type="button" id="btn_search" value="Search" />
        
        <div id="filters"></div>
        <div id="map" style="width: 500px; height: 500px; margin-top: 20px;"></div>
        
        
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
//                                        console.log( a.result.f_path );
                                        var
                                            f_path = "/uploads/"+a.result.f_path;
                                            
//                                        console.log(url);
                                        
                                        var map = new google.maps.Map(document.getElementById("map"), {
                                            mapTypeId: google.maps.MapTypeId.TERRAIN
                                          });

                                          $.ajax({
                                           type: "GET",
                                           url: f_path,
                                           dataType: "xml",
                                           success: function(xml) {
                                             var points = [];
                                             var bounds = new google.maps.LatLngBounds ();
                                             $(xml).find("rtept").each(function() {
                                               var lat = $(this).attr("lat");
                                               var lon = $(this).attr("lon");
                                               var p = new google.maps.LatLng(lat, lon);
                                               points.push(p);
                                               bounds.extend(p);
                                             });
                                             
//                                             console.log( $(xml).find("rtept").attr("lat") );
//                                             console.log( $(xml).find("rtept").attr("lon") );
                                             
                                             //set start marker
                                             var
                                                marker_coord = new google.maps.LatLng($(xml).find("rtept").attr("lat"), $(xml).find("rtept").attr("lon"));//{lat: new google.maps.LatLng($(xml).find("rtept").attr("lat")), lng: new google.maps.LatLng($(xml).find("rtept").attr("lon"))};
                                                
//                                            console.log( marker_coord );
//                                            
                                            //drow path line
                                             var poly = new google.maps.Polyline({
                                               // use your own style here
                                               path: points,
                                               strokeColor: "#FF00AA",
                                               strokeOpacity: .7,
                                               strokeWeight: 4
                                             });

                                            //draw marker
                                             var marker = new google.maps.Marker({
                                                position: marker_coord,
                                                map: map,
                                                title: 'Hello World!'
                                              });


                                             poly.setMap(map);

                                             // fit bounds to track
                                             map.fitBounds(bounds);
                                           }
                                          });
                                    }
                                });
                          });
            });
        </script>
    </body>
</html>
