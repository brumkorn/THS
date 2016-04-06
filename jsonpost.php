<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$f = fopen("serverDB.txt", "w");

fwrite($f, $_POST['nameKey']); 

fclose($f);

?>