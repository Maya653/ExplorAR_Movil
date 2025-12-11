import re
import os

def fix_file(file_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to match conflict blocks
    # <<<<<<< HEAD
    # (content we want)
    # =======
    # (content we discard)
    # >>>>>>> origin/MA (or anything)
    
    pattern = re.compile(r'<<<<<<< HEAD\s*(.*?)\s*=======\s*(.*?)\s*>>>>>>>.*?(?:\n|$)', re.DOTALL)
    
    def replace(match):
        return match.group(1)

    new_content = pattern.sub(replace, content)
    
    # Special handling for Icons.js which might not have <<<<<<< HEAD but has =======
    if "Icons.js" in file_path and "=======" in new_content and "<<<<<<< HEAD" not in new_content:
        print("Fixing Icons.js special case")
        parts = new_content.split('=======')
        head_part = parts[0]
        # Ensure it ends correctly
        if not head_part.strip().endswith(');'):
             head_part = head_part.rstrip() + '\n);\n'
        new_content = head_part

    if content != new_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {file_path}")
    else:
        print(f"No changes needed for {file_path}")

files = [
    r"app/src/screens/TourHistoryScreen.js",
    r"app/components/Icons.js"
]

for f in files:
    fix_file(f)
