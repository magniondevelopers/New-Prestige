<?php
/* ============================================================
   pricing-api.php  —  Room / villa pricing for Prestige website
   Upload to: app.prestigevacations.in/website-media/pricing-api.php
   (same folder as website-api.php)

   GET  ?action=get    public   → current pricing JSON
   POST ?action=save   admin    → saves pricing (needs X-Admin-Token)

   Admin tokens are verified by asking the existing website-api.php
   (?action=check_auth), so no login logic is duplicated here.
   ============================================================ */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Token');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

const DATA_DIR  = __DIR__ . '/data';
const DATA_FILE = DATA_DIR . '/pricing.json';
const AUTH_URL  = 'https://app.prestigevacations.in/website-media/website-api.php?action=check_auth';
const PROPERTIES = ['country-resort', 'country-suites', 'country-bay'];

function out($data, $code = 200) { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }

function defaults() {
  return [
    'updatedAt' => null,
    'properties' => [
      'country-resort' => ['name' => 'The Country Resort', 'note' => '', 'rooms' => [
        ['id' => 'suite-garden',     'name' => 'Suite Room',     'variant' => 'Garden View',  'price' => 14160, 'unit' => 'night', 'visible' => true],
        ['id' => 'suite-balcony',    'name' => 'Suite Room',     'variant' => 'Balcony View', 'price' => 14160, 'unit' => 'night', 'visible' => true],
        ['id' => 'executive-garden', 'name' => 'Executive Room', 'variant' => 'Garden View',  'price' => 8850,  'unit' => 'night', 'visible' => true],
        ['id' => 'executive-balcony','name' => 'Executive Room', 'variant' => 'Balcony View', 'price' => 8850,  'unit' => 'night', 'visible' => true],
      ]],
      'country-suites' => ['name' => 'The Country Suites', 'note' => '', 'rooms' => [
        ['id' => 'garden-villa',         'name' => 'Garden Villa',         'variant' => '', 'price' => null, 'unit' => 'night', 'visible' => true],
        ['id' => 'signature-pool-villa', 'name' => 'Signature Pool Villa', 'variant' => '', 'price' => null, 'unit' => 'night', 'visible' => true],
        ['id' => 'family-grand-villa',   'name' => 'Family Grand Villa',   'variant' => '', 'price' => null, 'unit' => 'night', 'visible' => true],
      ]],
      'country-bay' => ['name' => 'The Country Bay', 'note' => '', 'rooms' => []],
    ],
  ];
}

function load_pricing() {
  if (!is_file(DATA_FILE)) return defaults();
  $j = json_decode(file_get_contents(DATA_FILE), true);
  return is_array($j) ? $j : defaults();
}

function is_admin() {
  $token = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
  if (!$token || strlen($token) > 512) return false;
  $ch = curl_init(AUTH_URL);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['X-Admin-Token: ' . $token],
    CURLOPT_TIMEOUT => 10,
  ]);
  $res = curl_exec($ch);
  curl_close($ch);
  $j = json_decode($res ?: '', true);
  return !empty($j['authenticated']);
}

function clean_str($s, $max) { return mb_substr(trim(strip_tags((string)$s)), 0, $max); }

function sanitize($in) {
  $out = ['updatedAt' => gmdate('c'), 'properties' => []];
  foreach (PROPERTIES as $key) {
    $p = $in['properties'][$key] ?? [];
    $rooms = [];
    foreach (array_slice((array)($p['rooms'] ?? []), 0, 50) as $r) {
      $id = preg_replace('/[^a-z0-9-]/', '', strtolower((string)($r['id'] ?? '')));
      $name = clean_str($r['name'] ?? '', 80);
      if (!$id || !$name) continue;
      $price = $r['price'] ?? null;
      $price = ($price === '' || $price === null || !is_numeric($price) || $price < 0) ? null : round((float)$price);
      $unit = clean_str($r['unit'] ?? 'night', 20) ?: 'night';
      $rooms[] = [
        'id' => $id, 'name' => $name,
        'variant' => clean_str($r['variant'] ?? '', 80),
        'description' => clean_str($r['description'] ?? '', 400),
        'price' => $price, 'unit' => $unit,
        'visible' => !isset($r['visible']) || (bool)$r['visible'],
      ];
    }
    $out['properties'][$key] = [
      'name' => clean_str($p['name'] ?? defaults()['properties'][$key]['name'], 80),
      'note' => clean_str($p['note'] ?? '', 300),
      'rooms' => $rooms,
    ];
  }
  return $out;
}

$action = $_GET['action'] ?? 'get';

if ($action === 'get') {
  header('Cache-Control: no-store');
  out(load_pricing());
}

if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  if (!is_admin()) out(['ok' => false, 'error' => 'Unauthorized'], 401);
  $in = json_decode(file_get_contents('php://input'), true);
  if (!is_array($in)) out(['ok' => false, 'error' => 'Invalid JSON'], 400);
  $data = sanitize($in);
  if (!is_dir(DATA_DIR)) mkdir(DATA_DIR, 0755, true);
  if (!is_file(DATA_DIR . '/.htaccess')) file_put_contents(DATA_DIR . '/.htaccess', "Require all denied\n");
  if (is_file(DATA_FILE)) copy(DATA_FILE, DATA_DIR . '/pricing.backup.json');
  $ok = file_put_contents(DATA_FILE, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
  if ($ok === false) out(['ok' => false, 'error' => 'Could not write file'], 500);
  out(['ok' => true, 'pricing' => $data]);
}

out(['ok' => false, 'error' => 'Unknown action'], 400);
