"""Turn Locust CSV results into a Markdown report in docs/charge/.

Usage (called by `make load`):
    python load/report.py --csv load/results/run --host ... --users 20 \
        --spawn-rate 5 --duration 30s
"""

import argparse
import csv
import json
import platform
import subprocess
from datetime import datetime
from pathlib import Path

import psutil

REPO_ROOT = Path(__file__).resolve().parents[2]
REPORT_DIR = REPO_ROOT / "docs" / "charge"
SCENARIOS = {
    "player": "Parties complètes : créer, rejoindre, consulter, jouer, réinitialiser.",
    "race": "Une seule place libre (le rôle noir d'une partie), demandée en même "
    "temps par tous les utilisateurs. Attendu : 1 réponse 200, les autres 409.",
    "create": "Tous les utilisateurs créent une partie au même moment. Attendu : "
    "une réponse 201 par utilisateur, avec des boardId tous différents.",
}


def git(*args: str) -> str:
    try:
        return subprocess.run(
            ["git", *args], cwd=REPO_ROOT, capture_output=True, text=True, check=True
        ).stdout.strip()
    except OSError, subprocess.CalledProcessError:
        return "inconnu"


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8", newline="") as file:
        return list(csv.DictReader(file))


def ms(value: str) -> str:
    try:
        return f"{float(value):.0f}"
    except ValueError:
        return value or "-"


def to_float(value: str) -> float:
    try:
        return float(value)
    except ValueError:
        return 0.0


def build_report(args: argparse.Namespace, now: datetime) -> str:
    prefix = Path(args.csv)
    stats = read_csv(prefix.with_name(prefix.name + "_stats.csv"))
    failures = read_csv(prefix.with_name(prefix.name + "_failures.csv"))
    routes = [row for row in stats if row["Name"] != "Aggregated"]
    total = next((row for row in stats if row["Name"] == "Aggregated"), None)

    commit = git("rev-parse", "--short", "HEAD")
    dirty = " (modifications non commitées)" if git("status", "--porcelain") else ""
    memory = psutil.virtual_memory().total / 1024**3

    lines = [
        f"# Test de charge `{args.scenario}` du {now:%Y-%m-%d %H:%M}",
        "",
        f"**Scénario :** {SCENARIOS[args.scenario]}",
        "",
        "## Contexte",
        "",
        "| | |",
        "|---|---|",
        f"| Date | {now:%Y-%m-%d %H:%M:%S} |",
        f"| Branche | `{git('branch', '--show-current') or 'détachée'}` |",
        f"| Commit | `{commit}`{dirty} — {git('log', '-1', '--format=%s')} |",
        f"| Machine | {platform.node()} |",
        f"| Système | {platform.system()} {platform.release()} ({platform.machine()}) |",
        (
            f"| CPU | {platform.processor() or 'inconnu'}, "
            f"{psutil.cpu_count(logical=False)} cœurs / "
            f"{psutil.cpu_count()} threads |"
        ),
        f"| Mémoire | {memory:.1f} Go |",
        f"| Python | {platform.python_version()} |",
        "",
        "## Paramètres",
        "",
        "| Hôte | Utilisateurs | Arrivées par seconde | Durée |",
        "|---|---|---|---|",
        f"| {args.host} | {args.users} | {args.spawn_rate} | {args.duration} |",
        "",
        "## Résultats",
        "",
        "Temps en millisecondes.",
        "",
        "| Méthode | Route | Requêtes | Échecs | Médiane | p95 | p99 | Max | req/s |",
        "|---|---|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for row in [*routes, *([total] if total else [])]:
        name = "**Total**" if row is total else f"`{row['Name']}`"
        lines.append(
            f"| {row['Type'] or ''} | {name} | {row['Request Count']} "
            f"| {row['Failure Count']} | {ms(row['Median Response Time'])} "
            f"| {ms(row['95%'])} | {ms(row['99%'])} "
            f"| {ms(row['Max Response Time'])} "
            f"| {to_float(row['Requests/s']):.1f} |"
        )

    lines += ["", "## Erreurs", ""]
    if failures:
        lines += ["| Méthode | Route | Erreur | Nombre |", "|---|---|---|---:|"]
        lines += [
            f"| {f['Method']} | `{f['Name']}` | {f['Error']} | {f['Occurrences']} |"
            for f in failures
        ]
    else:
        lines.append("Aucune erreur.")

    outcomes_path = prefix.with_name(prefix.name + "_outcomes.json")
    outcomes = (
        json.loads(outcomes_path.read_text(encoding="utf-8"))
        if outcomes_path.exists()
        else {}
    )
    users = int(args.users)

    issues = []
    if args.scenario == "create":
        created = outcomes.get("created", 0)
        duplicates = outcomes.get("duplicate", 0)
        ok = created == users and duplicates == 0
        lines += [
            "",
            "## Verdict de la création simultanée",
            "",
            (
                f"- Parties créées avec un boardId unique : **{created}** "
                f"(attendu : {args.users})"
            ),
            f"- boardId en double : **{duplicates}** (attendu : 0)",
            f"- Résultat : **{'OK' if ok else 'ÉCHEC'}**",
        ]
        if duplicates:
            issues.append(
                f"- [ ] {duplicates} boardId en double : génération d'id "
                "non unique dans `BoardService.create`"
            )
        elif not ok:
            issues.append(
                f"- [ ] {created} parties créées sur {args.users} : voir les erreurs"
            )
    if args.scenario == "race":
        won, full = outcomes.get("seat_won", 0), outcomes.get("seat_full", 0)
        ok = won == 1 and won + full == users
        lines += [
            "",
            "## Verdict de la course à la place",
            "",
            f"- Place obtenue (200) : **{won}** (attendu : 1)",
            f"- Complet (409) : **{full}** (attendu : {users - 1})",
            f"- Résultat : **{'OK' if ok else 'ÉCHEC'}**",
        ]
        if won > 1:
            issues.append(
                f"- [ ] La place a été donnée {won} fois : accès concurrent "
                "non protégé dans `BoardService.join`"
            )
        elif not ok:
            issues.append(
                f"- [ ] {won + full} réponses 200/409 sur {args.users} "
                "utilisateurs : voir les erreurs"
            )
    for row in routes:
        route = f"`{row['Type']} {row['Name']}`"
        if to_float(row["Failure Count"]) > 0:
            issues.append(f"- [ ] {route} : {row['Failure Count']} échec(s)")
        if to_float(row["95%"]) > args.p95_limit:
            issues.append(
                f"- [ ] {route} : p95 de {ms(row['95%'])} ms "
                f"(> {args.p95_limit:.0f} ms)"
            )
    lines += [
        "",
        "## Lire ces mesures pour AnarChess",
        "",
        (
            f"- **p95** : 95 % des requêtes répondent plus vite que cette valeur. "
            f"Un coup joué (`PATCH /boards/{{id}}`) ou un état consulté "
            f"(`GET /boards/{{id}}`) doit rester fluide : objectif "
            f"< {args.p95_limit:.0f} ms."
        ),
        (
            "- **Échecs** : toute réponse inattendue (5xx, code non prévu, coup "
            "refusé à tort). Objectif : 0. Un échec, c'est une partie bloquée ou "
            "un coup perdu pour un joueur."
        ),
        (
            "- **Débit (req/s)** : requêtes traitées par seconde. Une partie "
            "consulte l'état environ toutes les secondes (polling) : le débit "
            "indique combien de parties le serveur suit en même temps."
        ),
        (
            "- **Places accordées** (`load-race`) : une partie n'a qu'une place "
            "noire. Si deux joueurs l'obtiennent, la partie est corrompue. "
            "Objectif : exactement 1."
        ),
        (
            "- **Parties créées** (`load-create`) : chaque création doit donner "
            "une partie distincte. Un `boardId` en double mélangerait deux parties."
        ),
        "",
        "## Ce qu'on corrige",
        "",
        (
            f"Points détectés automatiquement (échecs, ou p95 au-dessus de "
            f"{args.p95_limit:.0f} ms) :"
        ),
        "",
        *(issues or ["- Rien à signaler."]),
        "",
        "Analyse et corrections décidées (à compléter) :",
        "",
        "- ",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scenario", choices=SCENARIOS, required=True)
    parser.add_argument("--csv", required=True, help="Locust --csv prefix")
    parser.add_argument("--host", required=True)
    parser.add_argument("--users", required=True)
    parser.add_argument("--spawn-rate", required=True)
    parser.add_argument("--duration", required=True)
    parser.add_argument("--p95-limit", type=float, default=200.0)
    args = parser.parse_args()

    now = datetime.now()
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    commit = git("rev-parse", "--short", "HEAD")
    path = REPORT_DIR / f"{now:%Y-%m-%d-%H%M%S}-{args.scenario}-{commit}.md"
    path.write_text(build_report(args, now), encoding="utf-8")
    print(f"Rapport écrit dans {path.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
