// The "My journey with PHP" timeline (features/home/components/PhpTimeline.vue): the
// key PHP releases from 5.4 (where it all started, at university) to 8.5. Each
// stop has its headline features, what I was doing in that era, and a short snippet
// in that version's style. `hl` marks the snippet lines that show the new syntax.
// Keep code lines under ~46 characters (the code window's width on a laptop).

export type Era = "pure" | "composer" | "libraries" | "cms" | "laravel" | "symfony" | "today";

type Copy = { es: string; en: string };

export type TimelineStop = {
  version: string;
  year: number;
  era: Era;
  features: string[]; // short, code-like: shown as chips
  story: Copy;
  file: string;
  code: string;
  hl: number[];
};

export const eras: Record<Era, { label: Copy; color: string }> = {
  pure: { label: { es: "PHP puro", en: "Plain PHP" }, color: "#8892bf" },
  composer: { label: { es: "Composer", en: "Composer" }, color: "#c78c4a" },
  libraries: { label: { es: "Librerías", en: "Libraries" }, color: "#4f9c80" },
  cms: { label: { es: "CMS", en: "CMS" }, color: "#2e7fb8" },
  laravel: { label: { es: "Laravel", en: "Laravel" }, color: "#ff2d20" },
  symfony: { label: { es: "Symfony", en: "Symfony" }, color: "#2d2a24" },
  today: { label: { es: "Hoy", en: "Today" }, color: "#ff8400" },
};

export const timeline: TimelineStop[] = [
  {
    version: "5.4",
    year: 2012,
    era: "pure",
    features: ["[ ] short arrays", "traits", "php -S"],
    story: {
      es: "Aquí empezó todo: en la universidad, con PHP 5.4. Sin Composer y sin framework: archivos .php con HTML, include y mysql_query, todo mezclado. Aprendí haciendo.",
      en: "This is where it all began: at university, with PHP 5.4. No Composer, no framework: .php files mixing HTML, include and mysql_query. I learned by building.",
    },
    file: "usuarios.php",
    code: `<?php
include 'conexion.php';

$res = mysql_query("SELECT * FROM usuarios");
while ($fila = mysql_fetch_assoc($res)) {
    echo '<li>' . $fila['nombre'] . '</li>';
}

$roles = ['admin', 'editor']; // 5.4: []`,
    hl: [8],
  },
  {
    version: "5.6",
    year: 2014,
    era: "composer",
    features: ["...$args", "**", "use function"],
    story: {
      es: "Llegó Composer y cambió todo: composer.json, autoload PSR-4 y Packagist. Se acabaron los require a mano y las librerías copiadas en una carpeta.",
      en: "Then Composer arrived and changed everything: composer.json, PSR-4 autoloading and Packagist. No more manual requires or libraries copied into a folder.",
    },
    file: "index.php",
    code: `<?php
// composer require monolog/monolog
require __DIR__ . '/vendor/autoload.php';

use Monolog\\Logger;

$log = new Logger('app');

function suma(...$numeros) {
    return array_sum($numeros);
}
$area = 2 ** 10;`,
    hl: [1, 2, 8, 11],
  },
  {
    version: "7.0",
    year: 2015,
    era: "libraries",
    features: ["2× faster", "scalar types", "??", "<=>"],
    story: {
      es: "PHP 7 duplicó la velocidad de mis apps sin tocar código. Armaba proyectos combinando librerías de Packagist: Guzzle, PHPMailer, Carbon, Dompdf.",
      en: "PHP 7 doubled my apps' speed without touching a line. I built projects by combining Packagist libraries: Guzzle, PHPMailer, Carbon, Dompdf.",
    },
    file: "Reporte.php",
    code: `<?php
use GuzzleHttp\\Client;
use Carbon\\Carbon;

function total(array $items): float {
    return array_sum(array_column($items, 'precio'));
}

$nombre = $_GET['nombre'] ?? 'invitado';
usort($ventas, function ($a, $b) {
    return $a['total'] <=> $b['total'];
});`,
    hl: [4, 8, 10],
  },
  {
    version: "7.1",
    year: 2016,
    era: "cms",
    features: ["?nullable", "void", "[$a, $b] ="],
    story: {
      es: "Etapa CMS: sitios para clientes con WordPress (temas y plugins a medida) y Joomla (componentes y módulos propios). Ahí entendí cómo se organiza un sistema grande.",
      en: "The CMS era: client sites on WordPress (custom themes and plugins) and Joomla (my own components and modules). That's where I learned how a large system is organised.",
    },
    file: "mi-plugin.php",
    code: `<?php
/* Plugin Name: Proyectos */

add_action('init', function (): void {
    register_post_type('proyecto', [
        'public' => true,
        'label'  => 'Proyectos',
    ]);
});

function autor(?int $id): ?string { /* ... */ }`,
    hl: [3, 10],
  },
  {
    version: "7.4",
    year: 2019,
    era: "laravel",
    features: ["fn() =>", "typed properties", "??="],
    story: {
      es: "Llegó Laravel: Eloquent, migraciones, Blade, colas y Artisan. Pasé de armar piezas sueltas a construir productos completos, y con fn() y propiedades tipadas el código quedó más corto y seguro.",
      en: "Laravel arrived: Eloquent, migrations, Blade, queues and Artisan. I went from wiring loose pieces to shipping complete products, and fn() and typed properties made the code shorter and safer.",
    },
    file: "OrderController.php",
    code: `<?php
namespace App\\Http\\Controllers;

class OrderController extends Controller
{
    private int $perPage = 20;

    public function index()
    {
        return Order::where('status', 'paid')
            ->paginate($this->perPage)
            ->through(fn($o) => $o->only('id', 'total'));
    }
}`,
    hl: [5, 9, 11],
  },
  {
    version: "8.0",
    year: 2020,
    era: "laravel",
    features: ["match", "named args", "?->", "JIT", "#[Attr]"],
    story: {
      es: "PHP 8 trajo un lenguaje nuevo: constructor promotion, match y el operador nullsafe. Mis modelos y servicios quedaron la mitad de largos.",
      en: "PHP 8 felt like a new language: constructor promotion, match and the nullsafe operator. My models and services shrank by half.",
    },
    file: "Invoice.php",
    code: `<?php
class Invoice
{
    public function __construct(
        private int $id,
        private float $total,
    ) {}
}
$label = match ($status) {
    'paid'  => 'Pagada',
    default => 'Pendiente',
};
$city = $user?->address?->city;`,
    hl: [3, 4, 5, 8, 9, 10, 11, 12],
  },
  {
    version: "8.1",
    year: 2021,
    era: "symfony",
    features: ["enum", "readonly", "fibers", "never"],
    story: {
      es: "Llegó Symfony: componentes, inyección de dependencias y Doctrine. Entendí la arquitectura que hay detrás de Laravel y la apliqué en sistemas empresariales.",
      en: "Symfony arrived: components, dependency injection and Doctrine. I understood the architecture behind Laravel and applied it to enterprise systems.",
    },
    file: "Status.php",
    code: `<?php
enum Status: string
{
    case Paid = 'paid';
    case Pending = 'pending';
}

final class Money
{
    public function __construct(
        public readonly int $cents,
    ) {}
}`,
    hl: [1, 3, 4, 10],
  },
  {
    version: "8.2",
    year: 2022,
    era: "symfony",
    features: ["readonly class", "DNF types", "true/null"],
    story: {
      es: "Controladores con atributos, DTOs inmutables y repositorios Doctrine. Clean architecture de verdad, con tests en cada capa.",
      en: "Attribute-routed controllers, immutable DTOs and Doctrine repositories. Real clean architecture, with tests at every layer.",
    },
    file: "OrderController.php",
    code: `<?php
readonly class OrderDto
{
    public function __construct(public int $id) {}
}

#[Route('/api/orders', methods: ['GET'])]
public function list(OrderRepository $repo): JsonResponse
{
    return $this->json($repo->findAll());
}`,
    hl: [1, 6],
  },
  {
    version: "8.3",
    year: 2023,
    era: "laravel",
    features: ["typed const", "json_validate()", "#[\\Override]"],
    story: {
      es: "Laravel y Symfony en el mismo cinturón: elijo la herramienta según el proyecto. APIs escalables, colas, eventos y tiempo real.",
      en: "Laravel and Symfony on the same belt: I pick the tool per project. Scalable APIs, queues, events and real-time features.",
    },
    file: "Plan.php",
    code: `<?php
class Plan
{
    const string DEFAULT = 'pro';
}

class ProPlan extends Plan
{
    #[\\Override]
    public function price(): int { return 49; }
}
if (json_validate($payload)) { /* ... */ }`,
    hl: [3, 8, 11],
  },
  {
    version: "8.5",
    year: 2025,
    era: "today",
    features: ["|> pipe", "clone with", "array_last()", "URI"],
    story: {
      es: "Hoy: PHP 8.5 con Laravel, Symfony y FrankenPHP. De aquel PHP 5.4 sin Composer hasta aquí; y lo sigo disfrutando como el primer día.",
      en: "Today: PHP 8.5 with Laravel, Symfony and FrankenPHP. From that PHP 5.4 with no Composer to here, and I still enjoy it like day one.",
    },
    file: "slug.php",
    code: `<?php
$slug = $title
    |> trim(...)
    |> strtolower(...)
    |> (fn($s) => str_replace(' ', '-', $s));

$last = array_last($orders);

$copy = clone($order, ['status' => 'paid']);`,
    hl: [2, 3, 4, 6, 8],
  },
];
