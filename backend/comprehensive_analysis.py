#!/usr/bin/env python3
"""
Comprehensive AMEP Backend API Endpoint Analysis
Creates a complete tree of all API endpoints and identifies issues
"""

import re
import json
from collections import defaultdict

def parse_routes_file():
    """Parse the all_routes.txt file to extract endpoint information"""
    routes = []

    try:
        with open('all_routes.txt', 'r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue

                # Parse format: file.py:@blueprint.route('path', methods=['METHOD'])
                match = re.match(r'api/([^:]+):@(\w+)\.route\(([^,]+),\s*methods=\[([^\]]+)\]', line)
                if match:
                    file_name = match.group(1)
                    blueprint = match.group(2)
                    path = match.group(3).strip("'\"")
                    methods_str = match.group(4)

                    # Parse methods
                    methods = []
                    for method_match in re.finditer(r"'([^']+)'", methods_str):
                        methods.append(method_match.group(1))

                    routes.append({
                        'file': file_name,
                        'blueprint': blueprint,
                        'path': path,
                        'methods': methods
                    })

    except FileNotFoundError:
        print("❌ all_routes.txt not found. Run: grep -r '@.*_bp\.route' api/ > all_routes.txt")
        return []

    return routes

def get_blueprint_prefixes():
    """Extract blueprint URL prefixes from app.py"""
    prefixes = {}

    # From the register_blueprints function in app.py
    blueprint_mappings = {
        'auth_bp': '/api/auth',
        'mastery_bp': '/api/mastery',
        'concepts_bp': '/api/mastery',  # Note: same prefix as mastery_bp
        'classroom_bp': '/api/classroom',
        'engagement_bp': '/api/engagement',
        'live_polling_bp': '/api/polling',
        'poll_template_crud_bp': ['/api/polling', '/api/templates', '/api/engagement', '/api/classroom', '/api/dashboard'],
        'template_bp': '/api/templates',
        'dashboard_bp': '/api/dashboard',
        'pbl_workflow_bp': '/api/pbl',
        'pbl_crud_bp': '/api/pbl'
    }

    return blueprint_mappings

def get_standalone_routes():
    """Get standalone routes from api.py"""
    return [
        {'path': '/api/submit_response', 'methods': ['POST']},
        {'path': '/api/mastery_status/<student_id>', 'methods': ['GET']},
        {'path': '/api/engagement_event', 'methods': ['POST']},
        {'path': '/api/live_poll_response', 'methods': ['POST']}
    ]

def build_endpoint_tree(routes, prefixes, standalone_routes):
    """Build a comprehensive endpoint tree"""
    endpoint_tree = defaultdict(lambda: defaultdict(list))

    # Process blueprint routes
    for route in routes:
        blueprint = route['blueprint']
        path = route['path']
        methods = route['methods']
        file_name = route['file']

        # Get prefixes for this blueprint
        if blueprint in prefixes:
            blueprint_prefixes = prefixes[blueprint]
            if isinstance(blueprint_prefixes, list):
                # Handle multiple prefixes (like poll_template_crud_bp)
                for prefix in blueprint_prefixes:
                    full_path = prefix + path
                    endpoint_tree[full_path]['methods'].extend(methods)
                    endpoint_tree[full_path]['sources'].append({
                        'file': file_name,
                        'blueprint': blueprint,
                        'prefix': prefix
                    })
            else:
                full_path = blueprint_prefixes + path
                endpoint_tree[full_path]['methods'].extend(methods)
                endpoint_tree[full_path]['sources'].append({
                    'file': file_name,
                    'blueprint': blueprint,
                    'prefix': blueprint_prefixes
                })

    # Process standalone routes
    for route in standalone_routes:
        path = route['path']
        methods = route['methods']
        endpoint_tree[path]['methods'].extend(methods)
        endpoint_tree[path]['sources'].append({
            'file': 'api.py',
            'blueprint': 'standalone',
            'prefix': ''
        })

    # Deduplicate methods
    for path, data in endpoint_tree.items():
        data['methods'] = list(set(data['methods']))

    return endpoint_tree

def analyze_endpoints(endpoint_tree):
    """Analyze the endpoints for issues and patterns"""
    analysis = {
        'total_endpoints': len(endpoint_tree),
        'methods_distribution': defaultdict(int),
        'prefix_distribution': defaultdict(int),
        'issues': []
    }

    # Analyze methods and prefixes
    for path, data in endpoint_tree.items():
        for method in data['methods']:
            analysis['methods_distribution'][method] += 1

        # Extract prefix
        if '/' in path:
            prefix = '/' + path.split('/')[1]
            analysis['prefix_distribution'][prefix] += 1

    # Check for issues
    issues = []

    # Check for authentication endpoints
    auth_endpoints = [p for p in endpoint_tree.keys() if p.startswith('/api/auth')]
    if not auth_endpoints:
        issues.append({
            'type': 'missing_auth',
            'severity': 'critical',
            'description': 'No authentication endpoints found - users cannot login/register'
        })

    # Check for health endpoint
    health_endpoints = [p for p in endpoint_tree.keys() if 'health' in p]
    if not health_endpoints:
        issues.append({
            'type': 'missing_health',
            'severity': 'high',
            'description': 'No health check endpoint - cannot monitor service status'
        })

    # Check for duplicate paths with different methods
    path_method_count = defaultdict(set)
    for path, data in endpoint_tree.items():
        path_method_count[path].update(data['methods'])

    duplicates = {path: methods for path, methods in path_method_count.items() if len(methods) > 1}
    if duplicates:
        issues.append({
            'type': 'duplicate_paths',
            'severity': 'medium',
            'description': f'Found {len(duplicates)} paths with multiple methods - potential conflicts',
            'details': duplicates
        })

    # Check for missing CRUD operations on resources
    resource_patterns = {}
    for path in endpoint_tree.keys():
        # Look for patterns like /api/resource/<id>
        match = re.match(r'/api/([^/]+)/([^/]+)', path)
        if match:
            resource = match.group(1)
            subpath = match.group(2)
            if not subpath.startswith('<'):  # Not a parameter
                if resource not in resource_patterns:
                    resource_patterns[resource] = {'paths': [], 'methods': set()}
                resource_patterns[resource]['paths'].append(path)
                resource_patterns[resource]['methods'].update(endpoint_tree[path]['methods'])

    for resource, data in resource_patterns.items():
        methods = data['methods']
        missing_crud = []
        if 'GET' not in methods:
            missing_crud.append('GET (read)')
        if 'POST' not in methods and resource in ['auth', 'mastery', 'engagement', 'classroom', 'polling', 'templates', 'dashboard', 'pbl']:
            missing_crud.append('POST (create)')
        if 'PUT' not in methods:
            missing_crud.append('PUT (update)')
        if 'DELETE' not in methods:
            missing_crud.append('DELETE (delete)')

        if missing_crud:
            issues.append({
                'type': 'incomplete_crud',
                'severity': 'low',
                'description': f'Resource /{resource} missing CRUD operations: {", ".join(missing_crud)}'
            })

    analysis['issues'] = issues
    return analysis

def print_endpoint_tree(endpoint_tree, analysis):
    """Print a formatted endpoint tree"""
    print("=" * 80)
    print("AMEP BACKEND API ENDPOINT TREE")
    print("=" * 80)
    print(f"Total Endpoints: {analysis['total_endpoints']}")
    print()

    # Sort endpoints by path
    sorted_endpoints = sorted(endpoint_tree.items())

    # Group by prefix
    prefix_groups = defaultdict(list)
    for path, data in sorted_endpoints:
        if '/' in path:
            prefix = '/' + path.split('/')[1]
            prefix_groups[prefix].append((path, data))

    # Print by prefix
    for prefix in sorted(prefix_groups.keys()):
        endpoints = prefix_groups[prefix]
        print(f"📁 {prefix.upper()} ({len(endpoints)} endpoints)")
        print("-" * 50)

        for path, data in sorted(endpoints):
            methods_str = ', '.join(sorted(data['methods']))
            sources = data.get('sources', [])
            if sources:
                source_info = sources[0]['file']
                print(f"  {methods_str:15} {path}")
                if len(sources) > 1:
                    print(f"                ⚠️  Multiple sources: {len(sources)} files")
            else:
                print(f"  {methods_str:15} {path}")
        print()

    # Print standalone routes
    standalone = [(p, d) for p, d in sorted_endpoints if not p.startswith('/api/')]
    if standalone:
        print("📁 STANDALONE ROUTES")
        print("-" * 50)
        for path, data in standalone:
            methods_str = ', '.join(sorted(data['methods']))
            print(f"  {methods_str:15} {path}")
        print()

def print_analysis(analysis):
    """Print analysis results"""
    print("=" * 80)
    print("ENDPOINT ANALYSIS")
    print("=" * 80)

    print("📊 METHODS DISTRIBUTION:")
    for method, count in sorted(analysis['methods_distribution'].items()):
        print(f"  {method}: {count} endpoints")
    print()

    print("📂 PREFIX DISTRIBUTION:")
    for prefix, count in sorted(analysis['prefix_distribution'].items()):
        print(f"  {prefix}: {count} endpoints")
    print()

    print("🚨 ISSUES FOUND:")
    if not analysis['issues']:
        print("  ✅ No issues detected")
    else:
        severity_colors = {'critical': '🔴', 'high': '🟠', 'medium': '🟡', 'low': '🔵'}
        for issue in analysis['issues']:
            severity_icon = severity_colors.get(issue['severity'], '⚪')
            print(f"  {severity_icon} {issue['severity'].upper()}: {issue['description']}")
            if 'details' in issue:
                print(f"      Details: {issue['details']}")
        print()

def main():
    """Main analysis function"""
    print("🔍 Starting AMEP Backend API Analysis...")

    # Parse data
    routes = parse_routes_file()
    prefixes = get_blueprint_prefixes()
    standalone_routes = get_standalone_routes()

    print(f"📄 Found {len(routes)} blueprint routes")
    print(f"🔗 Found {len(standalone_routes)} standalone routes")
    print(f"🏷️  Identified {len(prefixes)} blueprint prefixes")

    # Build endpoint tree
    endpoint_tree = build_endpoint_tree(routes, prefixes, standalone_routes)

    # Analyze endpoints
    analysis = analyze_endpoints(endpoint_tree)

    # Print results
    print_endpoint_tree(endpoint_tree, analysis)
    print_analysis(analysis)

    # Summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✅ Total endpoints analyzed: {analysis['total_endpoints']}")
    print(f"⚠️  Issues identified: {len(analysis['issues'])}")

    critical_issues = [i for i in analysis['issues'] if i['severity'] == 'critical']
    if critical_issues:
        print(f"🔴 Critical issues: {len(critical_issues)} - FIX IMMEDIATELY")
    else:
        print("✅ No critical issues found")

    # Export to JSON
    export_data = {
        'endpoint_tree': dict(endpoint_tree),
        'analysis': analysis,
        'metadata': {
            'total_routes_parsed': len(routes),
            'standalone_routes': len(standalone_routes),
            'blueprint_prefixes': len(prefixes)
        }
    }

    with open('endpoint_analysis.json', 'w') as f:
        json.dump(export_data, f, indent=2, default=str)

    print("💾 Analysis exported to endpoint_analysis.json")

if __name__ == '__main__':
    main()