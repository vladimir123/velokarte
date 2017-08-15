<?php

/* 
 * @author Vladimir Gavrilyuk aka VelikijMerlinTo change this license header, choose License Headers in Project Properties.
 * @author Vladimir Gavrilyuk aka VelikijMerlinTo change this template file, choose Tools | Templates
 * @author Vladimir Gavrilyuk aka VelikijMerlinand open the template in the editor.
 */

header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate"); // HTTP/1.1
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache"); // HTTP/1.0
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past

header('Content-type: application/json');
header('Content-Type: text/html; charset=utf-8');

ini_set('max_execution_time', "1800");
ini_set('max_input_time', "1800");
ini_set('memory_limit','500M');

include_once "simple_html_dom.php";

$data = array('errors'=>array(), 'result' => array());

switch($_REQUEST["action"]){
    case "search":
        $search_val = $_POST["search"];
        
        $req_url = "http://velokarte.divritenis.lv/index.php?r=path/search&term=".$search_val;
        
        try
        {
            $curl = curl_init();
            $headers = array(
                                'Accept: application/json, text/javascript, */*; q=0.01',
                                'Content-Type: text/html',
                            );
            
            curl_setopt($curl, CURLOPT_URL, $req_url);
            curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($curl, CURLOPT_HEADER, 0);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curl, CURLOPT_TIMEOUT, 30);
            
            $req_rez = curl_exec($curl);
            
            if (!curl_exec($curl))
            {
                echo "Error in getting results => ".  curl_error($curl);
                var_dump( "Error in getting results => ".  curl_error($curl) );
                die;
            }
            
            curl_close($curl);
//            var_dump( $req_rez );
            
            $json = json_decode($req_rez);
        }
        catch(Exception $e)
        {
            echo "Error in getting results => ".$e->getMessage();
            var_dump( "Error in getting results => ".$e->getMessage() );
        }
        $select = "<select id='searched_oprtions'>";
        foreach( $json as $val )
        {
            $select .= "<option value='".$val->id."'>".$val->value."</option>";
        }
        $select .= "</select>";

        $data["result"]["select"] = $select;
        
    break;
    
    case "get_path":
        $path_id = $_POST["path_id"];
        $req_url = "http://velokarte.divritenis.lv/?r=path/download&format=gpx&pid=".$path_id;
        $upload_dir = "../uploads/";
        
        try
        {
            $file = file_put_contents($upload_dir.$path_id.".gpx", file_get_contents($req_url));
        }
        catch(Exception $ex)
        {
            var_dump( "Error in getting *.gpx file => ".$ex->getMessage() );
        }
        
        $path_tmp = pathinfo($upload_dir.$path_id.".gpx");
        $file_path = /*$path_tmp["dirname"]."/".*/$path_tmp["basename"];
        
//        var_dump( $file );
//        var_dump( __FILE__.$path_tmp );
        
        $data["result"]["f_path"] = $file_path;
    break;
}
echo json_encode($data);

?>