#!/usr/bin/env python3
"""One-off migrator: breadcrumbs + DashboardPageLayout / DashboardScrollLayout wrappers."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = ROOT / "app" / "dashboard"

SCROLL_ROUTES = {"", "analytics", "customers/merchant-onboard"}

IMPORT_LAYOUT = """import { DashboardPageLayout } from '@/components/dashboard/DashboardPageLayout'
"""
IMPORT_SCROLL = """import { DashboardScrollLayout } from '@/components/dashboard/DashboardScrollLayout'
"""
IMPORT_BC = """import { DashboardBreadcrumbs } from '@/components/dashboard/DashboardBreadcrumbs'
"""
IMPORT_META = """import { getDashboardPageCrumbs } from '@/lib/constants/dashboard-page-meta'
"""

CRUMB_KEYS = {
    "page.tsx": "",
    "activity/page.tsx": "activity",
    "analytics/page.tsx": "analytics",
    "api-logs/page.tsx": "api-logs",
    "backups/page.tsx": "backups",
    "cards/page.tsx": "cards",
    "cards/link/page.tsx": "cards/link",
    "cards/register/page.tsx": "cards/register",
    "carousel/page.tsx": "carousel",
    "customers/page.tsx": "customers",
    "customers/merchant-onboard/page.tsx": "customers/merchant-onboard",
    "customers/super-merchants/page.tsx": "customers/super-merchants",
    "finance/page.tsx": "finance",
    "finance/partners/page.tsx": "finance/partners",
    "finance/partners/create/page.tsx": "finance/partners/create",
    "finance/partners/configure-mapping/page.tsx": "finance/partners/configure-mapping",
    "finance/tariffs/page.tsx": "finance/tariffs",
    "finance/tariffs-new/page.tsx": "finance/tariffs-new",
    "finance/transaction-mapping/page.tsx": "finance/transaction-mapping",
    "gateway-partners/page.tsx": "gateway-partners",
    "gateway-partners/create/page.tsx": "gateway-partners/create",
    "kyc/page.tsx": "kyc",
    "platform-revenue/page.tsx": "platform-revenue",
    "products/page.tsx": "products",
    "profile/page.tsx": "profile",
    "reports/page.tsx": "reports",
    "revenue-tax/page.tsx": "revenue-tax",
    "roles/page.tsx": "roles",
    "security/page.tsx": "security",
    "settings/page.tsx": "settings",
    "settings/nav-visibility/page.tsx": "settings/nav-visibility",
    "system-logs/page.tsx": "system-logs",
    "test-permissions/page.tsx": "test-permissions",
    "transaction-modes/page.tsx": "transaction-modes",
    "transactions/page.tsx": "transactions",
    "transactions/liquidations/page.tsx": "transactions/liquidations",
    "transactions/reversals/page.tsx": "transactions/reversals",
    "users/page.tsx": "users",
    "users/create/page.tsx": "users/create",
    "users/permissions/page.tsx": "users/permissions",
    "users/[userId]/nav-visibility/page.tsx": "users/[userId]/nav-visibility",
    "wallet/page.tsx": "wallet",
    "wallet/[walletId]/statement/page.tsx": "wallet/[walletId]/statement",
}


def route_key(path: Path) -> str | None:
    rel = str(path.relative_to(DASHBOARD))
    return CRUMB_KEYS.get(rel)


def ensure_imports(text: str, needs_layout: bool, needs_scroll: bool, needs_bc: bool, needs_meta: bool) -> str:
    if needs_meta and IMPORT_META not in text:
        m = re.search(r"(import .+\n)(?!import )", text)
        insert_at = m.end() if m else 0
        text = text[:insert_at] + IMPORT_META + text[insert_at:]
    if needs_bc and "DashboardBreadcrumbs" not in text:
        m = re.search(r"import Navbar[^\n]+\n", text)
        if m:
            text = text[: m.end()] + IMPORT_BC + text[m.end() :]
    if needs_layout and "DashboardPageLayout" not in text:
        m = re.search(r"import Navbar[^\n]+\n", text)
        if m:
            text = text[: m.end()] + IMPORT_LAYOUT + text[m.end() :]
    if needs_scroll and "DashboardScrollLayout" not in text:
        m = re.search(r"import Navbar[^\n]+\n", text)
        if m:
            text = text[: m.end()] + IMPORT_SCROLL + text[m.end() :]
    return text


def crumb_snippet(route: str) -> str:
    return f"""<DashboardBreadcrumbs items={{getDashboardPageCrumbs('{route}')}} />
"""


def remove_legacy_breadcrumbs(text: str) -> str:
    # Remove common hand-rolled breadcrumb blocks (mb-4 nav with Dashboard link)
    text = re.sub(
        r"\s*\{/\* Breadcrumbs \*/\}\s*"
        r"<div className=\"mb-4\">\s*"
        r"<nav className=\"flex items-center[^\"]*\"[^>]*>.*?</nav>\s*"
        r"</div>\s*",
        "\n",
        text,
        flags=re.DOTALL,
    )
    text = re.sub(
        r"\s*<div className=\"mb-4\">\s*"
        r"<nav className=\"flex items-center space-x-2 text-sm text-gray-600\">.*?</nav>\s*"
        r"</div>\s*",
        "\n",
        text,
        flags=re.DOTALL,
    )
    return text


def insert_breadcrumbs_after_shell(text: str, route: str) -> str:
    if "DashboardBreadcrumbs" in text or "getDashboardPageCrumbs" in text:
        return text
    snippet = crumb_snippet(route)
    patterns = [
        r"(<div className=\{dashboardPageShellClass\}>)\s*",
        r"(<div className=\{dashboardFormShellClass\}>)\s*",
        r"(<DashboardPageLayout[^>]*>)\s*",
        r"(<DashboardScrollLayout[^>]*>)\s*",
    ]
    for pat in patterns:
        if re.search(pat, text):
            return re.sub(pat, r"\1\n        " + snippet.replace("\n", "\n        "), text, count=1)
    return text


def wrap_standard_page(text: str) -> str:
    """Replace outer shell with DashboardPageLayout when safe (single main content block)."""
    if "DashboardPageLayout" in text or "DashboardScrollLayout" in text:
        return text

    # Opening: min-h-screen + Navbar + main + shell
    open_pat = re.compile(
        r'<div className="min-h-screen bg-gray-50(?:\s+flex\s+flex-col)?">\s*'
        r"<Navbar />\s*"
        r"<main className=\{DASHBOARD_MAIN_CLASS\}>\s*"
        r"<div className=\{dashboardPageShellClass\}>",
        re.MULTILINE,
    )
    if not open_pat.search(text):
        open_pat2 = re.compile(
            r'<div className="min-h-screen bg-gray-50(?:\s+flex\s+flex-col)?">\s*'
            r"<Navbar />\s*"
            r"<main className=\{DASHBOARD_MAIN_CLASS\}>\s*"
            r"<div className=\{dashboardFormShellClass\}>",
            re.MULTILINE,
        )
        if open_pat2.search(text):
            text = open_pat2.sub("<DashboardPageLayout variant=\"form\">", text, count=1)
        else:
            return text
    else:
        text = open_pat.sub("<DashboardPageLayout>", text, count=1)

    # Closing: shell + main + outer div (only first occurrence from end of main return - risky)
    # Replace last occurrence pattern before modals is hard; use simpler close
    text = re.sub(
        r"</div>\s*</main>\s*</div>(\s*\n\s*(?:\{/\*|</DashboardPageLayout>))",
        r"</DashboardPageLayout>\1",
        text,
        count=1,
    )
    return text


def migrate_file(path: Path, route: str) -> bool:
    text = path.read_text()
    orig = text
    is_scroll = route in SCROLL_ROUTES

    text = remove_legacy_breadcrumbs(text)

    needs_bc = "Navbar" in text
    needs_meta = needs_bc
    needs_layout = needs_bc and not is_scroll
    needs_scroll = needs_bc and is_scroll

    text = ensure_imports(text, needs_layout, needs_scroll, needs_bc, needs_meta)

    if needs_bc and route is not None:
        text = insert_breadcrumbs_after_shell(text, route)

    if needs_layout and "DashboardPageLayout" not in orig:
        text = wrap_standard_page(text)

    if text != orig:
        path.write_text(text)
        return True
    return False


def main():
    changed = []
    for path in sorted(DASHBOARD.rglob("page.tsx")):
        if ".bak" in path.name:
            continue
        key = route_key(path)
        if key is None:
            continue
        if migrate_file(path, key):
            changed.append(str(path.relative_to(ROOT)))
    print(f"Migrated {len(changed)} files")
    for c in changed:
        print(" ", c)


if __name__ == "__main__":
    main()
