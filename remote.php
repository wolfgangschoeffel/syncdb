<?php

    include_once('config.inc.php');

    $data = json_decode(file_get_contents('php://input'), true);
    $local_dump_name = $data['localDumpName'];
    $method = $data['method'];

    // define functions first

    function export_database($user, $pass, $db, $host)
    {
        $remote_dump_name = 'remote-db-' . date("Y-m-d-h-i") . '.sql';

        $mdpath = '/mysqldump-php-1.4.1/src/Ifsnop/Mysqldump/Mysqldump.php';
        include_once(dirname(__FILE__) . $mdpath);

        $dump = new Ifsnop\Mysqldump\Mysqldump($db, $user, $pass, $host);
        $dump->start($remote_dump_name);

        return $remote_dump_name;
    }

    function import_database($user, $pass, $db, $host, $file)
    {
        /**
         * Code of this function copied from
         * http://stackoverflow.com/questions/19751354/how-to-import-sql-file-in-mysql-database-using-php
         * and modified by me, E.
         */

        // Connect to MySQL server
        mysql_connect($r_db_host, $r_db_user, $r_db_pass) or die('Error connecting to MySQL server: ' . mysql_error());
        // Select database
        mysql_select_db($r_db_name) or die('Error selecting MySQL database: ' . mysql_error());

        // Temporary variable, used to store current query
        $templine = '';
        // Read in entire file
        $lines = file($file);
        // Loop through each line
        foreach ($lines as $line)
        {
            // Skip it if it's a comment
            if (substr($line, 0, 2) == '--' || $line == '')
                continue;

            // Add this line to the current segment
            $templine .= $line;
            // If it has a semicolon at the end, it's the end of the query
            if (substr(trim($line), -1, 1) == ';')
            {
                // Perform the query
                mysql_query($templine) or return 'Error performing query "' . $templine . '": ' . mysql_error();
                // Reset temp variable to empty
                $templine = '';
            }
        }
        return true;
    }

    // some validation here

    if ($method === 'push') {

        $import_result = import_database($r_db_user, $r_db_pass, $r_db_name, $r_db_host, $local_dump_name);

        if ($import_result === true) {
          echo 'Tables imported successfully';
        } else { // error case
          echo $import_result;
        }
    }

    if ($method === 'pull') {

        // no explicit error handling here ...
        $remote_dump_name = export_database($r_db_user, $r_db_pass, $r_db_name, $r_db_host);

        $returnData = array(
            'remoteDumpName' => $remote_dump_name
        );

        echo json_encode($returnData);
    }

