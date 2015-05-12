<?php

    // upload this file

    include_once('config.inc.php');

    $data = json_decode(file_get_contents('php://input'), true);
    $local_dump_name = $data['localDumpName'];
    $method = $data['method'];

    // some validation here

    if ($method === 'push') {
        push();
    }


    if ($method === 'pull') {
        pull();
    }

    function push() {
        global $r_db_user, $r_db_pass, $r_db_name, $local_dump_name;

        $remote_dump_name = 'remote-db-' . date("Y-m-d-h-i") . '.sql';


        $remote_dump = "mysqldump -u {$r_db_user} -p{$r_db_pass} {$r_db_name} > sql/{$remote_dump_name}";
        shell_exec($remote_dump);

        $populate = "mysql -u {$r_db_user} -p{$r_db_pass} {$r_db_name} < sql/{$local_dump_name}";


        echo shell_exec($populate);

        //echo "push ready";

    }

    function pull() {
        global $r_db_user, $r_db_pass, $r_db_name, $local_dump_name;

        $remote_dump_name = 'remote-db-' . date("Y-m-d-h-i") . '.sql';

        $dump = "mysqldump -u {$r_db_user} -p{$r_db_pass} {$r_db_name} > sql/{$remote_dump_name}";

        shell_exec($dump);

        $returnData = array(
            'remoteDumpName' => $remote_dump_name
        );

        echo json_encode($returnData);
    }