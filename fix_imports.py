import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find package and imports
    package_match = re.search(r'^package\s+[\w\.]+;', content, re.MULTILINE)
    
    # We want to find fully qualified names like com.example.zhanfinancebackend.modules.auth.entity.User
    # but NOT in package or import statements.
    
    # regex to find com.example.zhanfinancebackend...ClassName
    # It must end with a Capitalized word (the class name)
    # We must exclude lines starting with "import " or "package "
    
    lines = content.split('\n')
    new_lines = []
    imports_to_add = set()
    
    fqn_pattern = re.compile(r'\b(com\.example\.zhanfinancebackend\.[\w\.]+\.([A-Z]\w*))\b')
    
    modified = False
    
    for line in lines:
        if line.strip().startswith('import ') or line.strip().startswith('package '):
            new_lines.append(line)
            continue
            
        # find all FQNs in the line
        matches = fqn_pattern.findall(line)
        if matches:
            for fqn, class_name in matches:
                # exclude if it's somehow just a package or if the FQN doesn't actually have a class
                imports_to_add.add(fqn)
                line = line.replace(fqn, class_name)
                modified = True
                
        new_lines.append(line)
        
    if not modified:
        return False
        
    # Now we need to insert the new imports right after the package statement or existing imports
    # Let's collect existing imports to avoid duplicates
    existing_imports = set(re.findall(r'^import\s+([\w\.]+);', content, re.MULTILINE))
    
    final_imports = imports_to_add - existing_imports
    
    if not final_imports:
        # We replaced FQNs but imports were already there!
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))
        return True
        
    # Find where to insert
    insert_idx = 0
    last_import_idx = -1
    package_idx = -1
    
    for i, line in enumerate(new_lines):
        if line.startswith('package '):
            package_idx = i
        elif line.startswith('import '):
            last_import_idx = i
            
    if last_import_idx != -1:
        insert_idx = last_import_idx + 1
    elif package_idx != -1:
        insert_idx = package_idx + 1
    else:
        insert_idx = 0
        
    # Insert imports
    imports_str = [f"import {imp};" for imp in sorted(final_imports)]
    
    # add an empty line before and after if needed
    if insert_idx > 0 and new_lines[insert_idx-1].strip() != '':
        imports_str.insert(0, "")
        
    # Check if we have multiple classes with the same name!
    # If so, we CANNOT import both. We must keep one fully qualified or it breaks.
    # Let's check for clashes.
    class_names = [imp.split('.')[-1] for imp in (final_imports | existing_imports)]
    if len(class_names) != len(set(class_names)):
        print(f"Skipping {filepath} due to class name clash in imports!")
        return False
        
    for i, imp_str in enumerate(imports_str):
        new_lines.insert(insert_idx + i, imp_str)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
        
    return True

def main():
    root_dir = r"c:\Users\murat\IdeaProjects\JF-1C\zhan-finance-backend\src\main\java\com\example\zhanfinancebackend"
    modified_count = 0
    for subdir, _, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.java'):
                filepath = os.path.join(subdir, file)
                if process_file(filepath):
                    modified_count += 1
                    print(f"Updated {filepath}")
                    
    print(f"Total files updated: {modified_count}")

if __name__ == "__main__":
    main()
