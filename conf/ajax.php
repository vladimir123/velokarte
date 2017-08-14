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
        $req_url = "http://velokarte.divritenis.lv/";
        try
        {
            $curl = curl_init();
            $params = array(
                "r" => "path/info",
                "pid" => $path_id
            );
            
            curl_setopt($curl, CURLOPT_URL, $req_url);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curl, CURLOPT_POST, true);
            curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($params));
            
            $html = curl_exec($curl);
            
            if (!curl_exec($curl))
            {
                echo "Error in getting results => ".  curl_error($curl);
                var_dump( "Error in getting results => ".  curl_error($curl) );
                die;
            }
            
            curl_close($curl);
            
            $dom = new simple_html_dom();
//            var_dump( $html );die;

            $tt = preg_split("/LINESTRING/", $html);
            $tt_ = preg_split("/<script/", $tt[1]);
            $t_coords = explode(" />", $tt_[0]);
            $tt_coords = explode("(", $t_coords[0]);
            $tt_coords_ = explode(")", $tt_coords[1]);
            $coords = $tt_coords_[0];
            
//            $arr[] = preg_replace("/ /", ",", preg_split("/,/", $coords));
            $arr = preg_split("/,/", $coords);
            
//            var_dump( $arr );die;
            
            foreach( $arr as $val )
            {
//                var_dump( explode(" ", $val) );
                $val = explode(" ", $val);
                
                $data["result"]["lat"] = $val[1];
                $data["result"]["lng"] = $val[0];
            }
            
//            $data["result"]["coords"] = $arr;
            
//            $data["result"]["html"] = $html;
        }
        catch(Exception $e)
        {
            echo "Error in getting results => ".$e->getMessage();
            var_dump( "Error in getting results => ".$e->getMessage() );
        }
        
    break;
}

//mysqli_close($link);
echo json_encode($data);

?>