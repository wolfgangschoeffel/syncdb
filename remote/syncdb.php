<?php

header('content-type:application/json');

function send_error($message) {
  echo json_encode(array('error' => $message));
  exit();
}

function send_data($data) {
  echo json_encode($data);
  exit();
}

if (file_exists('config.inc.php')) {
  include_once('config.inc.php');
} else {
  send_error('config.inc.php not found');
}

$post_data = json_decode(file_get_contents('php://input'));

if (isset($post_data->method)) {
  $method = $post_data->method;
} else {
  send_error('no method specified');
}

function export_database($user, $pass, $name, $host, $tables = '*') {

    $remote_dump_name = 'remote-db-' . date("Y-m-d-h-i") . '.sql';

    /**
     * Here comes David Walsh’s stone age sql dump script from 2008!
     * http://davidwalsh.name/backup-mysql-database-php
     */

    $link = mysql_connect($host, $user, $pass);
    mysql_select_db($name, $link);

    //get all of the tables
    if($tables == '*')
    {
        $tables = array();
        $result = mysql_query('SHOW TABLES');
        while($row = mysql_fetch_row($result))
        {
            $tables[] = $row[0];
        }
    }
    else
    {
        $tables = is_array($tables) ? $tables : explode(',', $tables);
    }

    $return = '';

    //cycle through
    foreach($tables as $table)
    {
        $result = mysql_query('SELECT * FROM ' . $table);
        $num_fields = mysql_num_fields($result);

        $return .= 'DROP TABLE ' . $table . ';';
        $row2 = mysql_fetch_row(mysql_query('SHOW CREATE TABLE ' . $table));
        $return .= "\n\n" . $row2[1] . ";\n\n";

        for ($i = 0; $i < $num_fields; $i++)
        {
            while($row = mysql_fetch_row($result))
            {
                $return .= 'INSERT INTO ' . $table . ' VALUES(';
                for($j = 0; $j < $num_fields; $j++)
                {
                    $row[$j] = addslashes($row[$j]);
                    $row[$j] = preg_replace("/\n/", "\\n", $row[$j]);
                    if (isset($row[$j]))
                    {
                        $return .= '"' . $row[$j] . '"';
                    }
                    else
                    {
                        $return .= '""';
                    }
                    if ($j < ($num_fields - 1))
                    {
                        $return .= ',';
                    }
                }
                $return .= ");\n";
            }
        }
        $return .= "\n\n\n";
    }

    //save file
    $handle = fopen($remote_dump_name, 'w+');
    fwrite($handle, $return);
    fclose($handle);

    /*
    $mdpath = '/mysqldump-php-1.4.1/src/Ifsnop/Mysqldump/Mysqldump.php';
    include_once(dirname(__FILE__) . $mdpath);

    $dump_settings = array(
        'compress' => Ifsnop\Mysqldump\Mysqldump::NONE,
        'no-data' => false,
        'add-drop-table' => true,
        'single-transaction' => true,
        'lock-tables' => true,
        'add-locks' => true,
        'extended-insert' => true,
        'disable-foreign-keys-check' => true,
        'skip-triggers' => true,
        'add-drop-trigger' => true,
        'databases' => true,
        'add-drop-database' => true,
        'hex-blob' => true
        );

    $dump = new Ifsnop\Mysqldump\Mysqldump($name, $user, $pass, $host, 'mysql', $dump_settings);
    $dump->start($remote_dump_name);
    */

    return $remote_dump_name;
}

function import_database($user, $pass, $name, $host, $file) {
    /**
     * Code of this function copied from
     * http://stackoverflow.com/questions/19751354/how-to-import-sql-file-in-mysql-database-using-php
     * and modified by me, E.
     */

    // Connect to MySQL server
    mysql_connect($host, $user, $pass) or die('Error connecting to MySQL server: ' . mysql_error());
    // Select database
    mysql_select_db($name) or die('Error selecting MySQL database: ' . mysql_error());

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
            mysql_query($templine) or send_error('Error performing query "' . $templine . '": ' . mysql_error());
            // Reset temp variable to empty
            $templine = '';
        }
    }
}

// some validation here

if ($method === 'push') {

    if (isset($post_data->localDumpName)) {
      $local_dump_name = $post_data->localDumpName;
    } else {
      send_error('localDumpName not specified');
    }

    import_database($r_db_user, $r_db_pass, $r_db_name, $r_db_host, $local_dump_name);

    send_data(array('success' => 'apparently, all went well'));
}

if ($method === 'pull') {

    $remote_dump_name = export_database($r_db_user, $r_db_pass, $r_db_name, $r_db_host);

    send_data(array('remoteDumpName' => $remote_dump_name));
}

if($method === 'ping') {

    send_data(array('hello' => 'i am here'));
}

send_error('invalid method');

