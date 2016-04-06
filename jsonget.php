<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$f = fopen("serverDB.txt", "r");
echo fgets($f); 

fclose($f);

?>