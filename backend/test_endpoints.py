#!/usr/bin/env python3
"""
Simple endpoint testing script for AMEP backend
Tests API endpoints without requiring full server startup
"""

import sys
import os
import json
from collections import defaultdict

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_blueprint_imports():
    """Test importing all blueprints and extract their routes"""
    print("=" * 60)
    print("AMEP Backend Endpoint Analysis")
    print("=" * 60)

    endpoints = defaultdict(list)
    import_errors = []

    # List of blueprint modules to test
    blueprint_modules = [
        'auth_routes',
        'mastery_routes',
        'mastery_concepts_routes',
        'engagement_routes',
        'classroom_routes',
        'live_polling_routes',
        'template_routes',
        'dashboard_routes',
        'pbl_workflow_routes',
        'pbl_crud_extensions',
        'polling_template_crud'
    ]

    print(f"Testing {len(blueprint_modules)} blueprint modules...")

    for module_name in blueprint_modules:
        try:
            module = __import__(f'api.{module_name}', fromlist=[module_name])

            # Get the blueprint (usually named with _bp suffix)
            blueprint_name = module_name.replace('_routes', '_bp').replace('_crud', '_bp')
            if hasattr(module, blueprint_name):
                bp = getattr(module, blueprint_name)
            elif hasattr(module, 'auth_bp'):
                bp = module.auth_bp
            elif hasattr(module, 'mastery_bp'):
                bp = module.mastery_bp
            elif hasattr(module, 'concepts_bp'):
                bp = module.concepts_bp
            elif hasattr(module, 'engagement_bp'):
                bp = module.engagement_bp
            elif hasattr(module, 'classroom_bp'):
                bp = module.classroom_bp
            elif hasattr(module, 'live_polling_bp'):
                bp = module.live_polling_bp
            elif hasattr(module, 'template_bp'):
                bp = module.template_bp
            elif hasattr(module, 'dashboard_bp'):
                bp = module.dashboard_bp
            elif hasattr(module, 'pbl_workflow_bp'):
                bp = module.pbl_workflow_bp
            elif hasattr(module, 'pbl_crud_bp'):
                bp = module.pbl_crud_bp
            elif hasattr(module, 'poll_template_crud_bp'):
                bp = module.poll_template_crud_bp
            else:
                print(f"⚠️  Could not find blueprint in {module_name}")
                continue

            print(f"✅ {module_name}: {bp.name}")

            # Extract routes from blueprint
            if hasattr(bp, 'deferred_functions'):
                for func in bp.deferred_functions:
                    if hasattr(func, 'f') and hasattr(func.f, 'rule'):
                        rule = func.f.rule
                        methods = func.f.methods
                        endpoints[rule].extend(methods)

        except ImportError as e:
            import_errors.append((module_name, str(e)))
            print(f"❌ {module_name}: Import failed - {e}")
        except Exception as e:
            print(f"⚠️  {module_name}: Unexpected error - {e}")

    print(f"\nImport Summary:")
    print(f"✅ Successful: {len(blueprint_modules) - len(import_errors)}")
    print(f"❌ Failed: {len(import_errors)}")

    if import_errors:
        print("\nImport Errors:")
        for module, error in import_errors:
            print(f"  {module}: {error}")

    return endpoints, import_errors

def analyze_endpoints(endpoints):
    """Analyze the collected endpoints"""
    print("\n" + "=" * 60)
    print("ENDPOINT ANALYSIS")
    print("=" * 60)

    total_endpoints = len(endpoints)
    methods_count = defaultdict(int)

    print(f"Total unique endpoints found: {total_endpoints}")

    for rule, methods in endpoints.items():
        for method in methods:
            methods_count[method] += 1

    print("\nHTTP Methods Distribution:")
    for method, count in sorted(methods_count.items()):
        print(f"  {method}: {count} endpoints")

    # Group endpoints by prefix
    prefix_groups = defaultdict(list)
    for rule in endpoints.keys():
        # Extract the first part of the path
        parts = rule.split('/')
        if len(parts) > 1:
            prefix = f"/{parts[1]}"
            prefix_groups[prefix].append(rule)

    print("\nEndpoints by API Prefix:")
    for prefix, rules in sorted(prefix_groups.items()):
        print(f"  {prefix}: {len(rules)} endpoints")
        if len(rules) <= 5:  # Show all if 5 or fewer
            for rule in sorted(rules):
                print(f"    {rule}")
        else:  # Show first 3 and indicate more
            for rule in sorted(rules)[:3]:
                print(f"    {rule}")
            print(f"    ... and {len(rules) - 3} more")

def check_disconnected_endpoints(endpoints, import_errors):
    """Identify potentially disconnected or non-usable endpoints"""
    print("\n" + "=" * 60)
    print("DISCONNECTED/NON-USABLE ENDPOINTS ANALYSIS")
    print("=" * 60)

    disconnected = []

    # Check for missing auth endpoints
    auth_endpoints = [rule for rule in endpoints.keys() if '/auth' in rule]
    if not auth_endpoints:
        disconnected.append(("Authentication endpoints", "No /auth endpoints found - users cannot login/register"))

    # Check for health endpoint
    health_endpoints = [rule for rule in endpoints.keys() if 'health' in rule]
    if not health_endpoints:
        disconnected.append(("Health check endpoint", "/api/health endpoint missing - cannot monitor service status"))

    # Check for import errors
    if import_errors:
        for module, error in import_errors:
            disconnected.append((f"{module} endpoints", f"Blueprint import failed: {error}"))

    # Check for incomplete API coverage
    expected_prefixes = ['/auth', '/mastery', '/engagement', '/classroom', '/polling', '/templates', '/dashboard', '/pbl']
    found_prefixes = set()
    for rule in endpoints.keys():
        parts = rule.split('/')
        if len(parts) > 1:
            found_prefixes.add(f"/{parts[1]}")

    missing_prefixes = set(expected_prefixes) - found_prefixes
    if missing_prefixes:
        for prefix in missing_prefixes:
            disconnected.append((f"{prefix} API", f"No endpoints found for {prefix} - API module not loaded"))

    if disconnected:
        print("🚨 POTENTIALLY DISCONNECTED ENDPOINTS:")
        for component, issue in disconnected:
            print(f"  ❌ {component}: {issue}")
    else:
        print("✅ No obvious disconnected endpoints found")

    return disconnected

def main():
    """Main testing function"""
    try:
        endpoints, import_errors = test_blueprint_imports()
        analyze_endpoints(endpoints)
        disconnected = check_disconnected_endpoints(endpoints, import_errors)

        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Total endpoints discovered: {len(endpoints)}")
        print(f"Blueprint import failures: {len(import_errors)}")
        print(f"Potentially disconnected components: {len(disconnected)}")

        if disconnected:
            print("\n⚠️  ACTION REQUIRED: Fix the disconnected components listed above")
        else:
            print("\n✅ All endpoints appear to be properly connected")

    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0

if __name__ == '__main__':
    sys.exit(main())