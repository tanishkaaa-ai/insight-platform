import sys
import os

print(f"Executable: {sys.executable}")
print(f"CWD: {os.getcwd()}")
print("Sys Path:")
for p in sys.path:
    print(f"  {p}")

try:
    import flask
    print(f"Flask found at: {flask.__file__}")
except ImportError as e:
    print(f"ImportError: {e}")

try:
    import site
    print(f"Site packages: {site.getsitepackages()}")
except Exception as e:
    print(f"Site check error: {e}")
