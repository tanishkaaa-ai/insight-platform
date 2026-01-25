
import requests
import os
import sys

BASE_URL = "http://localhost:5000/api"

def test_annotation_backend():
    print("--- Starting Annotation Backend Verification ---")

    # 1. Test File Upload
    print("\n1. Testing /api/upload endpoint...")
    
    # Create a dummy image file
    dummy_filename = "test_annotation.jpg"
    with open(dummy_filename, "w") as f:
        f.write("This is a dummy file for annotation testing.")

    try:
        files = {'file': open(dummy_filename, 'rb')}
        res = requests.post(f"{BASE_URL}/upload", files=files)
        
        if res.status_code == 201:
            data = res.json()
            file_url = data.get('file_url')
            print(f"✅ Upload Success! File URL: {file_url}")
            
            # 2. Test File Serving
            print(f"\n2. Testing File Serving at {file_url}...")
            # The file_url is likely relative (/api/uploads/...), need to prepend host
            serve_url = f"http://localhost:5000{file_url}"
            res_serve = requests.get(serve_url)
            
            if res_serve.status_code == 200:
                print("✅ Serving Success! File content retrieved.")
                if res_serve.text == "This is a dummy file for annotation testing.":
                    print("✅ Content Verified.")
                else:
                    print("❌ Content Mismatch.")
            else:
                print(f"❌ Serving Failed: {res_serve.status_code}")
                
        else:
            print(f"❌ Upload Failed: {res.status_code} {res.text}")

    except Exception as e:
        print(f"❌ Exception during test: {e}")
    finally:
        # Cleanup
        if os.path.exists(dummy_filename):
            os.remove(dummy_filename)
        print("\n--- Verification Complete ---")

if __name__ == "__main__":
    test_annotation_backend()
