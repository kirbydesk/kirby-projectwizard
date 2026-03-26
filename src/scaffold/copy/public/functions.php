<?php

/*------------------------------------------------------------------------------------------------
	Cleanup URLs
------------------------------------------------------------------------------------------------*/
function cleanURL($string) {
	$url = str_replace("'", '', $string);
	$url = str_replace('%20', ' ', $url);
	$url = preg_replace('~[^\\pL0-9_]+~u', '-', $url);
	$url = trim($url, "-");
	$url = strtolower($url);
	$url = preg_replace('~[^-a-z0-9_]+~', '', $url);
	return $url;
}

function cleanTel($string) {
	$url = str_replace("'", '', $string);
	$url = str_replace('%20', ' ', $url);
	$url = preg_replace('~[^\\pL0-9_]+~u', '-', $url);
	$url = trim($url, "-");
	$url = strtolower($url);
	$url = preg_replace('~[^-a-z0-9_]+~', '', $url);
	return $url;
}

function generateUUID($length = 16) {
	$characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	$charactersLength = strlen($characters);
	$randomString = '';
	for ($i = 0; $i < $length; $i++) {
		$randomString .= $characters[random_int(0, $charactersLength - 1)];
	}
	return $randomString;
}

/*------------------------------------------------------------------------------------------------
	Excerpts for teaser texts
------------------------------------------------------------------------------------------------*/
function excerpt($text, $max_length = 140, $cut_off = '...', $keep_word = true) {
	if (strlen($text) <= $max_length) return $text;
	if ($keep_word) {
		$text = substr($text, 0, $max_length + 1);
		if ($last_space = strrpos($text, ' ')) {
			$text = substr($text, 0, $last_space);
			$text = rtrim($text) . $cut_off;
		}
	} else {
		$text = substr($text, 0, $max_length);
		$text = rtrim($text) . $cut_off;
	}
	return $text;
}

/*------------------------------------------------------------------------------------------------
	Human readable filesize
------------------------------------------------------------------------------------------------*/
function human_filesize($bytes, $decimals = 2) {
	$sz = 'BKMGTP';
	$factor = floor((strlen($bytes) - 1) / 3);
	return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
}

/*------------------------------------------------------------------------------------------------
	String starts with
------------------------------------------------------------------------------------------------*/
function startsWith($string, $startString) {
	$len = strlen($startString);
	return (substr($string, 0, $len) === $startString);
}
