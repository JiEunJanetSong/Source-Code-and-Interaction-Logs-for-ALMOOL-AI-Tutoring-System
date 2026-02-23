<?php
// Router for PHP built-in server
// Maps JS/CSS requests from root to their actual subdirectories

$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);
$file = __DIR__ . $path;

// If file exists at root, serve normally
if ($path !== '/' && file_exists($file)) {
    return false;
}

// Map root-level JS files to js/ directory
$jsFiles = ['common.js', 'DSAT_chat.js', 'DSAT_new.js', 'ikpsParse.js', 'ikpsParseStyle.js', 'DSAT_answerConfirm.js'];
$basename = basename($path);

if (in_array($basename, $jsFiles) && !str_contains($path, '/js/')) {
    $mapped = __DIR__ . '/js/' . $basename;
    if (file_exists($mapped)) {
        header('Content-Type: application/javascript');
        readfile($mapped);
        return true;
    }
}

// Map root-level CSS files to css/ directory
$cssFiles = ['style.css', 'DSAT.css', 'IKPSParse.css', 'newSAT.css'];
if (in_array($basename, $cssFiles) && !str_contains($path, '/css/')) {
    $mapped = __DIR__ . '/css/' . $basename;
    if (file_exists($mapped)) {
        header('Content-Type: text/css');
        readfile($mapped);
        return true;
    }
}

// Default: let PHP built-in server handle it
return false;
